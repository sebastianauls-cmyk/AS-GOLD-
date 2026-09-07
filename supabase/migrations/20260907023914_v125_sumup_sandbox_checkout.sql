-- AS Workspace Gold V125: SumUp-hosted sandbox checkout.
--
-- The application can only open a checkout for a SumUp merchant that the
-- server has verified as a sandbox account. Live payments remain locked.

alter table public.upgrade_requests
  add column if not exists sumup_checkout_id text,
  add column if not exists sumup_checkout_reference text,
  add column if not exists sumup_checkout_url text,
  add column if not exists sumup_merchant_code text,
  add column if not exists sumup_transaction_id text,
  add column if not exists sumup_transaction_code text;

alter table public.upgrade_requests
  drop constraint if exists upgrade_requests_payment_provider_check,
  add constraint upgrade_requests_payment_provider_check
    check (payment_provider is null or payment_provider in ('stripe','sumup'));

create unique index if not exists upgrade_requests_sumup_checkout_v125_idx
  on public.upgrade_requests(sumup_checkout_id)
  where sumup_checkout_id is not null;

create unique index if not exists upgrade_requests_sumup_reference_v125_idx
  on public.upgrade_requests(sumup_checkout_reference)
  where sumup_checkout_reference is not null;

create unique index if not exists upgrade_requests_sumup_transaction_v125_idx
  on public.upgrade_requests(sumup_transaction_id)
  where sumup_transaction_id is not null;

alter table public.user_access_periods
  add column if not exists payment_provider text;

alter table public.user_access_periods
  drop constraint if exists user_access_periods_payment_provider_check,
  add constraint user_access_periods_payment_provider_check
    check (payment_provider is null or payment_provider in ('stripe','sumup'));

create table if not exists private.gold_sumup_checkout_events (
  checkout_id text not null,
  checkout_status text not null,
  transaction_id text,
  upgrade_request_id uuid references public.upgrade_requests(id) on delete set null,
  processed_at timestamptz not null default now(),
  primary key (checkout_id,checkout_status)
);

create index if not exists gold_sumup_events_upgrade_request_v125_idx
  on private.gold_sumup_checkout_events(upgrade_request_id)
  where upgrade_request_id is not null;

alter table private.gold_sumup_checkout_events enable row level security;
revoke all on table private.gold_sumup_checkout_events from public, anon, authenticated;

comment on table private.gold_sumup_checkout_events is
  'Idempotency ledger for SumUp checkout states verified by retrieving the checkout from the SumUp API. No webhook payload or credential is stored.';

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
  v_paid_source text;
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
    v_paid_source := coalesce(nullif(v_period.payment_provider,''),'legacy')||'_payment';
    return v_permissions
      || coalesce(private.gold_plan_permission_overlay(v_plan_key),'{}'::jsonb)
      || jsonb_build_object(
        'access_source',case when coalesce(v_period.amount_paid,0)>0 then v_paid_source else coalesce(v_permissions->>'access_source','granted') end,
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

  if coalesce(v_permissions->>'access_source','') in ('stripe_payment','sumup_payment','legacy_payment') then
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
  if v_total<0.5 then raise exception 'Zero amount requires direct promo activation'; end if;
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
      payment_provider='sumup',
      payment_amount=v_total,
      payment_currency='EUR',
      stripe_checkout_session_id=null,
      stripe_checkout_url=null,
      stripe_payment_intent_id=null,
      sumup_checkout_id=null,
      sumup_checkout_reference=null,
      sumup_checkout_url=null,
      sumup_merchant_code=null,
      sumup_transaction_id=null,
      sumup_transaction_code=null,
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
    'payment_provider','sumup',
    'checkout_expires_at',v_now+interval '30 minutes',
    'promo_label',v_request.promo_label,
    'no_auto_renew',true
  );
end;
$$;

create or replace function public.gold_attach_sumup_checkout_service(
  p_request_id uuid,
  p_owner_id uuid,
  p_checkout_id text,
  p_checkout_reference text,
  p_checkout_url text,
  p_merchant_code text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_updated integer;
begin
  if p_checkout_id !~ '^[0-9a-fA-F-]{36}$' then raise exception 'Invalid SumUp checkout id'; end if;
  if char_length(coalesce(p_checkout_reference,''))<8 or char_length(p_checkout_reference)>64
    then raise exception 'Invalid SumUp checkout reference'; end if;
  if p_checkout_url !~ '^https://checkout[.]sumup[.]com/' or char_length(p_checkout_url)>2048
    then raise exception 'Invalid SumUp checkout URL'; end if;
  if p_merchant_code !~ '^[A-Z0-9]{6,16}$' then raise exception 'Invalid SumUp merchant code'; end if;

  update public.upgrade_requests
  set sumup_checkout_id=p_checkout_id,
      sumup_checkout_reference=p_checkout_reference,
      sumup_checkout_url=p_checkout_url,
      sumup_merchant_code=p_merchant_code,
      updated_at=now()
  where id=p_request_id and owner_id=p_owner_id
    and payment_provider='sumup'
    and status='checkout_pending' and checkout_expires_at>now()
    and sumup_checkout_id is null;
  get diagnostics v_updated=row_count;
  if v_updated<>1 then raise exception 'Checkout reservation expired'; end if;

  return jsonb_build_object('attached',true,'request_id',p_request_id);
end;
$$;

create or replace function public.gold_cancel_sumup_checkout_service(
  p_request_id uuid,
  p_checkout_id text,
  p_event_type text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_request public.upgrade_requests%rowtype;
  v_event_type text := coalesce(nullif(p_event_type,''),'CANCELLED');
begin
  if p_request_id is null and p_checkout_id is null then raise exception 'Checkout identity required'; end if;

  select * into v_request
  from public.upgrade_requests
  where (p_request_id is not null and id=p_request_id)
     or (p_request_id is null and p_checkout_id is not null and sumup_checkout_id=p_checkout_id)
  order by created_at desc limit 1
  for update;
  if not found then return jsonb_build_object('cancelled',false,'missing',true); end if;
  if v_request.payment_provider<>'sumup' then raise exception 'Payment provider mismatch'; end if;
  if p_checkout_id is not null and v_request.sumup_checkout_id is not null
    and p_checkout_id<>v_request.sumup_checkout_id then raise exception 'Checkout id mismatch'; end if;

  update public.upgrade_requests
  set status='cancelled',updated_at=now()
  where id=v_request.id and status in ('requested','checkout_pending');

  if coalesce(p_checkout_id,v_request.sumup_checkout_id) is not null then
    insert into private.gold_sumup_checkout_events(
      checkout_id,checkout_status,upgrade_request_id
    ) values (
      coalesce(p_checkout_id,v_request.sumup_checkout_id),v_event_type,v_request.id
    ) on conflict (checkout_id,checkout_status) do update
      set processed_at=excluded.processed_at,
          upgrade_request_id=excluded.upgrade_request_id;
  end if;

  return jsonb_build_object('cancelled',true,'request_id',v_request.id);
end;
$$;

create or replace function public.gold_fulfill_sumup_checkout_service(
  p_checkout_id text,
  p_checkout_reference text,
  p_merchant_code text,
  p_transaction_id text,
  p_transaction_code text,
  p_amount numeric,
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
begin
  if p_checkout_id !~ '^[0-9a-fA-F-]{36}$' then raise exception 'SumUp checkout id required'; end if;
  if char_length(coalesce(p_transaction_id,''))<8 then raise exception 'SumUp transaction id required'; end if;
  if upper(coalesce(p_payment_status,''))<>'PAID' then
    return jsonb_build_object('applied',false,'payment_pending',true);
  end if;

  select * into v_request
  from public.upgrade_requests
  where sumup_checkout_id=p_checkout_id
  for update;
  if not found then raise exception 'Unknown SumUp checkout'; end if;
  if v_request.payment_provider<>'sumup' then raise exception 'Payment provider mismatch'; end if;

  if v_request.status='applied' then
    return jsonb_build_object('applied',true,'already_applied',true,'request_id',v_request.id);
  end if;
  if v_request.status<>'checkout_pending' then raise exception 'Checkout is not pending'; end if;

  if p_checkout_reference<>v_request.sumup_checkout_reference then raise exception 'Checkout reference mismatch'; end if;
  if p_merchant_code<>v_request.sumup_merchant_code then raise exception 'Checkout merchant mismatch'; end if;
  if p_amount is null or abs(round(p_amount,2)-v_request.payment_amount)>0.001 then raise exception 'Checkout amount mismatch'; end if;
  if upper(coalesce(p_currency,''))<>v_request.payment_currency then raise exception 'Checkout currency mismatch'; end if;

  insert into private.gold_sumup_checkout_events(
    checkout_id,checkout_status,transaction_id,upgrade_request_id
  ) values (
    p_checkout_id,'PAID',p_transaction_id,v_request.id
  ) on conflict (checkout_id,checkout_status) do nothing;
  if not found then raise exception 'Duplicate SumUp payment state without applied checkout'; end if;

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
    amount_paid,currency,reactivation_until,payment_provider
  ) values (
    v_request.owner_id,'gold_'||v_request.to_plan,v_request.term_months,
    v_starts_at,v_ends_at,'active',false,v_request.payment_amount,'EUR',
    v_ends_at+interval '3 months','sumup'
  ) returning id into v_period_id;

  update private.user_access
  set permissions=coalesce(permissions,'{}'::jsonb) || jsonb_build_object(
        'access_source','sumup_payment',
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
      sumup_transaction_id=p_transaction_id,
      sumup_transaction_code=nullif(p_transaction_code,''),
      paid_at=coalesce(p_paid_at,v_now),
      fulfilled_at=v_now,
      granted_access_period_id=v_period_id,
      updated_at=v_now
  where id=v_request.id;

  insert into public.audit_events(owner_id,event_type,entity_type,entity_id,event_data,source)
  values (
    v_request.owner_id,'sumup_payment_applied','upgrade_request',v_request.id,
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
revoke all on function public.gold_attach_sumup_checkout_service(uuid,uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.gold_cancel_sumup_checkout_service(uuid,text,text) from public, anon, authenticated;
revoke all on function public.gold_fulfill_sumup_checkout_service(text,text,text,text,text,numeric,text,text,timestamptz) from public, anon, authenticated;

grant execute on function public.gold_reserve_checkout_service(uuid,uuid,integer) to service_role;
grant execute on function public.gold_attach_sumup_checkout_service(uuid,uuid,text,text,text,text) to service_role;
grant execute on function public.gold_cancel_sumup_checkout_service(uuid,text,text) to service_role;
grant execute on function public.gold_fulfill_sumup_checkout_service(text,text,text,text,text,numeric,text,text,timestamptz) to service_role;

comment on function public.gold_reserve_checkout_service(uuid,uuid,integer) is
  'V125 service-only reservation of one trusted EUR SumUp checkout per account.';
comment on function public.gold_fulfill_sumup_checkout_service(text,text,text,text,text,numeric,text,text,timestamptz) is
  'V125 idempotent service-only access grant after the server re-fetches and verifies a paid SumUp checkout.';
