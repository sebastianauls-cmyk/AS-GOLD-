-- AS Workspace Gold V124: Stripe-hosted test checkout for fixed access terms.
--
-- Payment remains explicitly test-only at the application boundary.  These
-- database primitives never contact Stripe; they reserve a trusted quote and
-- apply access only when the server submits a signature-verified Stripe event.

alter table public.upgrade_requests
  add column if not exists payment_provider text,
  add column if not exists payment_amount numeric(12,2),
  add column if not exists payment_currency text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_checkout_url text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists checkout_expires_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists granted_access_period_id uuid references public.user_access_periods(id) on delete set null;

alter table public.upgrade_requests
  drop constraint if exists upgrade_requests_payment_provider_check,
  add constraint upgrade_requests_payment_provider_check
    check (payment_provider is null or payment_provider='stripe'),
  drop constraint if exists upgrade_requests_payment_amount_check,
  add constraint upgrade_requests_payment_amount_check
    check (payment_amount is null or payment_amount>0),
  drop constraint if exists upgrade_requests_payment_currency_check,
  add constraint upgrade_requests_payment_currency_check
    check (payment_currency is null or payment_currency='EUR');

create unique index if not exists upgrade_requests_stripe_session_v124_idx
  on public.upgrade_requests(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists upgrade_requests_one_pending_checkout_v124_idx
  on public.upgrade_requests(owner_id)
  where status='checkout_pending';

create index if not exists upgrade_requests_granted_period_v124_idx
  on public.upgrade_requests(granted_access_period_id)
  where granted_access_period_id is not null;

create table if not exists private.gold_stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  checkout_session_id text,
  upgrade_request_id uuid references public.upgrade_requests(id) on delete set null,
  processed_at timestamptz not null default now()
);

alter table private.gold_stripe_webhook_events enable row level security;
revoke all on table private.gold_stripe_webhook_events from public, anon, authenticated;

comment on table private.gold_stripe_webhook_events is
  'Idempotency ledger for signature-verified Stripe webhook events. No webhook payload or payment credential is stored.';

-- Paid rights are derived from an active access period.  The permanent owner
-- overlay and the existing time-limited tester overlay remain unchanged.
create or replace function private.gold_effective_permissions(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_access private.user_access%rowtype;
  v_permissions jsonb;
  v_ends_at timestamptz;
  v_plan_key text;
  v_period public.user_access_periods%rowtype;
begin
  select * into v_access
  from private.user_access
  where user_id=p_user_id;
  if not found then return '{}'::jsonb; end if;

  v_permissions := coalesce(v_access.permissions,'{}'::jsonb);

  if v_access.app_role='owner' then
    return v_permissions
      || coalesce(private.gold_plan_permission_overlay('business'),'{}'::jsonb)
      || jsonb_build_object(
        'owner_permanent_access',true,
        'access_source','owner',
        'test_access',false,
        'promo_access_expired',false
      );
  end if;

  if coalesce(v_permissions->>'access_source','')='promo_test' then
    begin
      v_ends_at := nullif(v_permissions->>'promo_access_ends_at','')::timestamptz;
    exception when invalid_text_representation then
      v_ends_at := null;
    end;
    v_plan_key := nullif(v_permissions->>'promo_plan_key','');

    if v_ends_at is not null and v_ends_at>now() and v_plan_key is not null then
      return v_permissions
        || coalesce(private.gold_plan_permission_overlay(v_plan_key),'{}'::jsonb)
        || jsonb_build_object('test_access',true,'promo_access_expired',false);
    end if;
  end if;

  select period.* into v_period
  from public.user_access_periods period
  join private.gold_plans plan
    on period.plan_id=case when plan.plan_key='free' then 'free' else 'gold_'||plan.plan_key end
  where period.owner_id=p_user_id
    and period.status='active'
    and period.starts_at<=now()
    and period.ends_at>now()
  order by plan.rank desc,period.ends_at desc
  limit 1;

  if v_period.id is not null then
    v_plan_key := case when v_period.plan_id='free' then 'free' else replace(v_period.plan_id,'gold_','') end;
    return v_permissions
      || coalesce(private.gold_plan_permission_overlay(v_plan_key),'{}'::jsonb)
      || jsonb_build_object(
        'access_source',case when coalesce(v_period.amount_paid,0)>0 then 'stripe_payment' else coalesce(v_permissions->>'access_source','granted') end,
        'paid_access_ends_at',v_period.ends_at,
        'paid_plan_key',v_plan_key,
        'test_access',case when coalesce(v_period.amount_paid,0)>0 then false else coalesce(v_permissions->>'access_source','')='promo_test' end,
        'promo_access_expired',false,
        'auto_renew',false
      );
  end if;

  if coalesce(v_permissions->>'access_source','')='promo_test' then
    return v_permissions
      || coalesce(private.gold_plan_permission_overlay('free'),'{}'::jsonb)
      || jsonb_build_object(
        'test_access',false,
        'promo_access_expired',true,
        'auto_renew',false,
        'payment_required',false
      );
  end if;

  if coalesce(v_permissions->>'access_source','')='stripe_payment' then
    return v_permissions
      || coalesce(private.gold_plan_permission_overlay('free'),'{}'::jsonb)
      || jsonb_build_object(
        'paid_access_expired',true,
        'auto_renew',false,
        'payment_required',false
      );
  end if;

  return v_permissions;
end;
$$;

revoke all on function private.gold_effective_permissions(uuid) from public, anon, authenticated;

-- Replace the quote implementation so an existing paid period is considered
-- and the exact amount sent to Checkout is visible to the user beforehand.
create or replace function private.gold_upgrade_quote_impl(
  p_to_plan text,
  p_term_months integer,
  p_promo_code text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_access private.user_access%rowtype;
  v_effective_permissions jsonb;
  v_current private.gold_plans%rowtype;
  v_target private.gold_plans%rowtype;
  v_term private.gold_plan_terms%rowtype;
  v_period public.user_access_periods%rowtype;
  v_promo private.gold_promo_codes%rowtype;
  v_now timestamptz := now();
  v_code text := private.gold_normalize_promo_code(p_promo_code);
  v_code_supplied boolean := char_length(v_code)>0;
  v_promo_valid boolean := false;
  v_user_redemptions integer := 0;
  v_prorated_before_promo numeric;
  v_prorated numeric;
  v_package_before_promo numeric;
  v_package_total numeric;
  v_checkout_total numeric;
  v_regular_package_total numeric;
  v_term_savings numeric;
  v_promo_savings numeric := 0;
  v_savings numeric;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select * into v_access
  from private.user_access
  where user_id=v_uid and active=true and status='approved';
  if not found then raise exception 'Active access required'; end if;

  v_effective_permissions := private.gold_effective_permissions(v_uid);

  select * into v_current
  from private.gold_plans
  where plan_key=coalesce(v_effective_permissions->>'tier','free') and active=true;
  if not found then
    select * into v_current from private.gold_plans where plan_key='free' and active=true;
  end if;

  select * into v_target
  from private.gold_plans
  where plan_key=p_to_plan and active=true;
  if not found then raise exception 'Unknown target plan'; end if;
  if v_target.rank<=v_current.rank then raise exception 'Target plan must be higher than current plan'; end if;

  select * into v_term
  from private.gold_plan_terms
  where term_months=coalesce(p_term_months,1) and active=true;
  if not found then raise exception 'Unsupported term'; end if;

  select * into v_period
  from public.user_access_periods
  where owner_id=v_uid and status='active' and starts_at<=v_now and ends_at>v_now
  order by ends_at desc limit 1;

  if v_period.id is not null then
    v_prorated_before_promo := public.calculate_upgrade_proration(
      v_current.price_eur,v_target.price_eur,v_period.starts_at,v_period.ends_at,v_now
    );
  else
    v_prorated_before_promo := 0;
  end if;

  v_regular_package_total := round(v_target.price_eur*v_term.term_months,2);
  v_package_before_promo := round(v_regular_package_total*(1-v_term.discount_percent/100.0),2);
  v_term_savings := round(v_regular_package_total-v_package_before_promo,2);

  if v_code_supplied and char_length(v_code)<=64 then
    select * into v_promo
    from private.gold_promo_codes
    where code_hash=extensions.digest(v_code,'sha256')
      and active=true
      and valid_from<=v_now
      and (valid_until is null or valid_until>v_now)
      and (cardinality(allowed_plan_keys)=0 or v_target.plan_key=any(allowed_plan_keys))
      and (cardinality(allowed_term_months)=0 or v_term.term_months=any(allowed_term_months))
      and (max_redemptions is null or redemption_count<max_redemptions)
    limit 1;

    if found then
      select count(*)::integer into v_user_redemptions
      from public.upgrade_requests
      where owner_id=v_uid
        and promo_code_id=v_promo.id
        and (
          status in ('paid','applied')
          or (status='checkout_pending' and checkout_expires_at>v_now)
        );
      v_promo_valid := v_user_redemptions<v_promo.max_redemptions_per_user;
    end if;
  end if;

  if v_promo_valid then
    v_promo_savings := round(v_package_before_promo*v_promo.discount_percent/100.0,2);
    v_prorated := round(v_prorated_before_promo*(1-v_promo.discount_percent/100.0),2);
  else
    v_prorated := v_prorated_before_promo;
  end if;

  v_package_total := round(v_package_before_promo-v_promo_savings,2);
  v_checkout_total := round(v_package_total+case when v_period.id is null then 0 else v_prorated end,2);
  v_savings := round(v_term_savings+v_promo_savings,2);

  return jsonb_build_object(
    'from_plan',v_current.plan_key,
    'from_plan_name',v_current.plan_name,
    'to_plan',v_target.plan_key,
    'to_plan_name',v_target.plan_name,
    'current_monthly_price',v_current.price_eur,
    'target_monthly_price',v_target.price_eur,
    'upgrade_difference_full_month',round(greatest(v_target.price_eur-v_current.price_eur,0),2),
    'upgrade_due_now_before_promo',v_prorated_before_promo,
    'upgrade_due_now',v_prorated,
    'term_months',v_term.term_months,
    'discount_percent',v_term.discount_percent,
    'term_discount_percent',v_term.discount_percent,
    'regular_package_total',v_regular_package_total,
    'package_total_before_promo',v_package_before_promo,
    'promo_code_state',case when not v_code_supplied then 'none' when v_promo_valid then 'valid' else 'invalid' end,
    'promo_code_applied',v_promo_valid,
    'promo_label',case when v_promo_valid then v_promo.label else null end,
    'promo_discount_percent',case when v_promo_valid then v_promo.discount_percent else 0 end,
    'promo_savings',v_promo_savings,
    'promo_grants_access',v_promo_valid and v_promo.grant_plan_key=v_target.plan_key and v_promo.grant_days is not null,
    'package_total',v_package_total,
    'checkout_total',v_checkout_total,
    'savings',v_savings,
    'next_regular_price',v_target.price_eur,
    'period_id',v_period.id,
    'period_starts_at',v_period.starts_at,
    'period_ends_at',v_period.ends_at,
    'no_auto_renew',true,
    'payment_enabled',false,
    'currency','EUR'
  );
end;
$$;

revoke all on function private.gold_upgrade_quote_impl(text,integer,text) from public, anon;
grant execute on function private.gold_upgrade_quote_impl(text,integer,text) to authenticated;

create or replace function public.gold_reserve_checkout_service(
  p_request_id uuid,
  p_owner_id uuid,
  p_ttl_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_request public.upgrade_requests%rowtype;
  v_promo private.gold_promo_codes%rowtype;
  v_now timestamptz := now();
  v_pending_count integer := 0;
  v_user_count integer := 0;
  v_total numeric(12,2);
begin
  if p_owner_id is null or p_request_id is null then raise exception 'Checkout identity required'; end if;
  if p_ttl_minutes<>30 then raise exception 'Unsupported checkout lifetime'; end if;

  update public.upgrade_requests
  set status='cancelled',updated_at=v_now
  where owner_id=p_owner_id and status='checkout_pending' and checkout_expires_at<=v_now;

  if exists(
    select 1 from public.upgrade_requests
    where owner_id=p_owner_id and status='checkout_pending' and checkout_expires_at>v_now
  ) then raise exception 'Checkout already pending'; end if;

  select * into v_request
  from public.upgrade_requests
  where id=p_request_id and owner_id=p_owner_id and status='requested'
  for update;
  if not found then raise exception 'Checkout request not available'; end if;

  v_total := round(
    coalesce(v_request.quoted_package_total,0)
      + case when v_request.access_period_id is null then 0 else coalesce(v_request.prorated_difference,0) end,
    2
  );
  if v_total<=0 then raise exception 'Zero amount requires direct promo activation'; end if;
  if v_request.currency<>'EUR' then raise exception 'Unsupported checkout currency'; end if;

  if v_request.promo_code_id is not null then
    select * into v_promo
    from private.gold_promo_codes
    where id=v_request.promo_code_id
    for update;
    if not found or not v_promo.active or v_promo.valid_from>v_now
      or (v_promo.valid_until is not null and v_promo.valid_until<=v_now)
    then raise exception 'Promo code is no longer available'; end if;

    select count(*)::integer into v_pending_count
    from public.upgrade_requests
    where promo_code_id=v_promo.id
      and status='checkout_pending'
      and checkout_expires_at>v_now;
    if v_promo.max_redemptions is not null
      and v_promo.redemption_count+v_pending_count>=v_promo.max_redemptions
    then raise exception 'Promo redemption limit reached'; end if;

    select count(*)::integer into v_user_count
    from public.upgrade_requests
    where owner_id=p_owner_id and promo_code_id=v_promo.id
      and (
        status in ('paid','applied')
        or (status='checkout_pending' and checkout_expires_at>v_now)
      );
    if v_user_count>=v_promo.max_redemptions_per_user
    then raise exception 'Promo already used by this account'; end if;
  end if;

  update public.upgrade_requests
  set status='checkout_pending',
      payment_provider='stripe',
      payment_amount=v_total,
      payment_currency='EUR',
      checkout_expires_at=v_now+interval '30 minutes',
      updated_at=v_now
  where id=v_request.id;

  return jsonb_build_object(
    'request_id',v_request.id,
    'owner_id',v_request.owner_id,
    'to_plan',v_request.to_plan,
    'to_plan_name',v_request.to_plan,
    'term_months',v_request.term_months,
    'payment_amount',v_total,
    'payment_currency','EUR',
    'checkout_expires_at',v_now+interval '30 minutes',
    'promo_label',v_request.promo_label,
    'no_auto_renew',true
  );
end;
$$;

create or replace function public.gold_attach_checkout_session_service(
  p_request_id uuid,
  p_owner_id uuid,
  p_checkout_session_id text,
  p_checkout_url text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_updated integer;
begin
  if char_length(coalesce(p_checkout_session_id,''))<8 or char_length(p_checkout_session_id)>255
    then raise exception 'Invalid checkout session'; end if;
  if char_length(coalesce(p_checkout_url,''))<12 or char_length(p_checkout_url)>2048
    then raise exception 'Invalid checkout URL'; end if;

  update public.upgrade_requests
  set stripe_checkout_session_id=p_checkout_session_id,
      stripe_checkout_url=p_checkout_url,
      updated_at=now()
  where id=p_request_id and owner_id=p_owner_id
    and status='checkout_pending' and checkout_expires_at>now()
    and stripe_checkout_session_id is null;
  get diagnostics v_updated=row_count;
  if v_updated<>1 then raise exception 'Checkout reservation expired'; end if;

  return jsonb_build_object('attached',true,'request_id',p_request_id);
end;
$$;

create or replace function public.gold_cancel_checkout_service(
  p_request_id uuid,
  p_checkout_session_id text,
  p_event_id text,
  p_event_type text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_request public.upgrade_requests%rowtype;
begin
  if p_event_id is not null then
    insert into private.gold_stripe_webhook_events(event_id,event_type,checkout_session_id)
    values (p_event_id,coalesce(p_event_type,'checkout.cancelled'),p_checkout_session_id)
    on conflict (event_id) do nothing;
    if not found then return jsonb_build_object('cancelled',false,'duplicate',true); end if;
  end if;

  select * into v_request
  from public.upgrade_requests
  where (p_request_id is not null and id=p_request_id)
     or (p_checkout_session_id is not null and stripe_checkout_session_id=p_checkout_session_id)
  order by created_at desc limit 1
  for update;
  if not found then return jsonb_build_object('cancelled',false,'missing',true); end if;

  update public.upgrade_requests
  set status='cancelled',updated_at=now()
  where id=v_request.id and status in ('requested','checkout_pending');

  if p_event_id is not null then
    update private.gold_stripe_webhook_events
    set upgrade_request_id=v_request.id
    where event_id=p_event_id;
  end if;

  return jsonb_build_object('cancelled',true,'request_id',v_request.id);
end;
$$;

create or replace function public.gold_fulfill_checkout_service(
  p_event_id text,
  p_event_type text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_amount_total bigint,
  p_currency text,
  p_payment_status text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_request public.upgrade_requests%rowtype;
  v_promo private.gold_promo_codes%rowtype;
  v_now timestamptz := now();
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_period_id uuid;
  v_expected_amount bigint;
begin
  if char_length(coalesce(p_event_id,''))<4 then raise exception 'Stripe event id required'; end if;
  if p_payment_status<>'paid' then return jsonb_build_object('applied',false,'payment_pending',true); end if;

  insert into private.gold_stripe_webhook_events(event_id,event_type,checkout_session_id)
  values (p_event_id,p_event_type,p_checkout_session_id)
  on conflict (event_id) do nothing;
  if not found then return jsonb_build_object('applied',false,'duplicate',true); end if;

  select * into v_request
  from public.upgrade_requests
  where stripe_checkout_session_id=p_checkout_session_id
  for update;
  if not found then raise exception 'Unknown checkout session'; end if;

  update private.gold_stripe_webhook_events
  set upgrade_request_id=v_request.id
  where event_id=p_event_id;

  if v_request.status='applied' then
    return jsonb_build_object('applied',true,'already_applied',true,'request_id',v_request.id);
  end if;
  if v_request.status<>'checkout_pending' then raise exception 'Checkout is not pending'; end if;

  v_expected_amount := round(v_request.payment_amount*100)::bigint;
  if p_amount_total is null or p_amount_total<>v_expected_amount then raise exception 'Checkout amount mismatch'; end if;
  if upper(coalesce(p_currency,''))<>v_request.payment_currency then raise exception 'Checkout currency mismatch'; end if;

  if v_request.promo_code_id is not null then
    select * into v_promo from private.gold_promo_codes
    where id=v_request.promo_code_id for update;
    if not found then raise exception 'Promo record missing'; end if;
    update private.gold_promo_codes
    set redemption_count=redemption_count+1,updated_at=v_now
    where id=v_promo.id;
  end if;

  v_starts_at := v_now;
  v_ends_at := greatest(v_now,coalesce(v_request.period_ends_at,v_now))
    + make_interval(days=>coalesce(v_request.term_months,1)*30);

  if v_request.access_period_id is not null then
    update public.user_access_periods
    set status='cancelled',updated_at=v_now
    where id=v_request.access_period_id and owner_id=v_request.owner_id and status='active';
  end if;

  insert into public.user_access_periods(
    owner_id,plan_id,term_months,starts_at,ends_at,status,auto_renew,
    amount_paid,currency,reactivation_until
  ) values (
    v_request.owner_id,'gold_'||v_request.to_plan,v_request.term_months,
    v_starts_at,v_ends_at,'active',false,v_request.payment_amount,'EUR',v_ends_at+interval '3 months'
  ) returning id into v_period_id;

  update private.user_access
  set permissions=coalesce(permissions,'{}'::jsonb) || jsonb_build_object(
        'access_source','stripe_payment',
        'paid_plan_key',v_request.to_plan,
        'paid_access_starts_at',v_starts_at,
        'paid_access_ends_at',v_ends_at,
        'paid_access_expired',false,
        'payment_required',false,
        'auto_renew',false,
        'post_expiry_mode','free'
      ),
      updated_at=v_now,
      last_changed_at=v_now
  where user_id=v_request.owner_id and active=true and status='approved';
  if not found then raise exception 'Active access record missing'; end if;

  update public.upgrade_requests
  set status='applied',
      stripe_payment_intent_id=nullif(p_payment_intent_id,''),
      paid_at=coalesce(p_paid_at,v_now),
      fulfilled_at=v_now,
      granted_access_period_id=v_period_id,
      updated_at=v_now
  where id=v_request.id;

  insert into public.audit_events(owner_id,event_type,entity_type,entity_id,event_data,source)
  values (
    v_request.owner_id,'stripe_payment_applied','upgrade_request',v_request.id,
    jsonb_build_object(
      'plan_key',v_request.to_plan,
      'term_months',v_request.term_months,
      'amount',v_request.payment_amount,
      'currency','EUR',
      'ends_at',v_ends_at,
      'no_auto_renew',true
    ),
    'server'
  );

  return jsonb_build_object(
    'applied',true,
    'request_id',v_request.id,
    'access_period_id',v_period_id,
    'plan_key',v_request.to_plan,
    'starts_at',v_starts_at,
    'ends_at',v_ends_at,
    'no_auto_renew',true
  );
end;
$$;

revoke all on function public.gold_reserve_checkout_service(uuid,uuid,integer) from public, anon, authenticated;
revoke all on function public.gold_attach_checkout_session_service(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.gold_cancel_checkout_service(uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.gold_fulfill_checkout_service(text,text,text,text,bigint,text,text,timestamptz) from public, anon, authenticated;

grant execute on function public.gold_reserve_checkout_service(uuid,uuid,integer) to service_role;
grant execute on function public.gold_attach_checkout_session_service(uuid,uuid,text,text) to service_role;
grant execute on function public.gold_cancel_checkout_service(uuid,text,text,text) to service_role;
grant execute on function public.gold_fulfill_checkout_service(text,text,text,text,bigint,text,text,timestamptz) to service_role;

comment on function public.gold_reserve_checkout_service(uuid,uuid,integer) is
  'V124 service-only reservation of one trusted EUR checkout per account.';
comment on function public.gold_fulfill_checkout_service(text,text,text,text,bigint,text,text,timestamptz) is
  'V124 idempotent service-only access grant after a signature-verified paid Stripe Checkout event.';
