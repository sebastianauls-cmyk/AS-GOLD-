-- AS Gold V31: private, server-validated promotional codes.
-- No commercial code is seeded: an offer must be deliberately configured with
-- its discount, scope, validity and redemption limits before it can be used.

create table if not exists private.gold_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique,
  label text not null check (char_length(label) between 1 and 80),
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  allowed_plan_keys text[] not null default '{}',
  allowed_term_months integer[] not null default '{}',
  active boolean not null default false,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_user integer not null default 1 check (max_redemptions_per_user > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from),
  check (array_position(allowed_plan_keys,null) is null),
  check (array_position(allowed_term_months,null) is null)
);

comment on table private.gold_promo_codes is
  'V31 promo configuration. Only a SHA-256 digest of the normalized bearer code is stored.';
comment on column private.gold_promo_codes.code_hash is
  'extensions.digest(private.gold_normalize_promo_code(code), sha256); never expose or store the raw code.';

alter table private.gold_promo_codes enable row level security;
revoke all on table private.gold_promo_codes from public, anon, authenticated;

alter table public.upgrade_requests
  add column if not exists promo_code_id uuid references private.gold_promo_codes(id) on delete set null,
  add column if not exists promo_label text,
  add column if not exists promo_discount_percent numeric(5,2),
  add column if not exists package_total_before_promo numeric(12,2),
  add column if not exists promo_savings numeric(12,2),
  add column if not exists quoted_package_total numeric(12,2);

alter table public.upgrade_requests
  drop constraint if exists upgrade_requests_promo_discount_percent_check,
  add constraint upgrade_requests_promo_discount_percent_check
    check (promo_discount_percent is null or (promo_discount_percent > 0 and promo_discount_percent <= 100)),
  drop constraint if exists upgrade_requests_package_total_before_promo_check,
  add constraint upgrade_requests_package_total_before_promo_check
    check (package_total_before_promo is null or package_total_before_promo >= 0),
  drop constraint if exists upgrade_requests_promo_savings_check,
  add constraint upgrade_requests_promo_savings_check
    check (promo_savings is null or promo_savings >= 0),
  drop constraint if exists upgrade_requests_quoted_package_total_check,
  add constraint upgrade_requests_quoted_package_total_check
    check (quoted_package_total is null or quoted_package_total >= 0);

create or replace function private.gold_normalize_promo_code(p_code text)
returns text
language sql
immutable
set search_path=''
as $$
  select upper(regexp_replace(btrim(coalesce(p_code,'')), '\s+', '', 'g'));
$$;

revoke all on function private.gold_normalize_promo_code(text) from public, anon, authenticated;

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
  v_current private.gold_plans%rowtype;
  v_target private.gold_plans%rowtype;
  v_term private.gold_plan_terms%rowtype;
  v_period public.user_access_periods%rowtype;
  v_promo private.gold_promo_codes%rowtype;
  v_now timestamptz := now();
  v_code text := private.gold_normalize_promo_code(p_promo_code);
  v_code_supplied boolean := char_length(v_code) > 0;
  v_promo_valid boolean := false;
  v_user_redemptions integer := 0;
  v_prorated_before_promo numeric;
  v_prorated numeric;
  v_package_before_promo numeric;
  v_package_total numeric;
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

  select * into v_current
  from private.gold_plans
  where plan_key=coalesce(v_access.permissions->>'tier','free') and active=true;
  if not found then
    select * into v_current from private.gold_plans where plan_key='free' and active=true;
  end if;

  select * into v_target
  from private.gold_plans
  where plan_key=p_to_plan and active=true;
  if not found then raise exception 'Unknown target plan'; end if;
  if v_target.rank <= v_current.rank then raise exception 'Target plan must be higher than current plan'; end if;

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
    v_prorated_before_promo := round(greatest(v_target.price_eur-v_current.price_eur,0),2);
  end if;

  v_regular_package_total := round(v_target.price_eur*v_term.term_months,2);
  v_package_before_promo := round(v_regular_package_total*(1-v_term.discount_percent/100.0),2);
  v_term_savings := round(v_regular_package_total-v_package_before_promo,2);

  if v_code_supplied and char_length(v_code) <= 64 then
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
        and status in ('paid','applied');
      v_promo_valid := v_user_redemptions < v_promo.max_redemptions_per_user;
    end if;
  end if;

  if v_promo_valid then
    v_promo_savings := round(v_package_before_promo*v_promo.discount_percent/100.0,2);
    v_prorated := round(v_prorated_before_promo*(1-v_promo.discount_percent/100.0),2);
  else
    v_prorated := v_prorated_before_promo;
  end if;

  v_package_total := round(v_package_before_promo-v_promo_savings,2);
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
    'package_total',v_package_total,
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

create or replace function private.gold_upgrade_quote_impl(
  p_to_plan text,
  p_term_months integer default 1
)
returns jsonb
language sql
security definer
set search_path=''
as $$
  select private.gold_upgrade_quote_impl(p_to_plan,p_term_months,null);
$$;

create or replace function private.gold_request_upgrade_impl(
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
  v_quote jsonb;
  v_id uuid;
  v_promo_id uuid;
  v_code text := private.gold_normalize_promo_code(p_promo_code);
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  v_quote := private.gold_upgrade_quote_impl(p_to_plan,p_term_months,p_promo_code);

  if char_length(v_code)>0 and (v_quote->>'promo_code_state')<>'valid' then
    raise exception 'Invalid or expired promo code';
  end if;

  if (v_quote->>'promo_code_state')='valid' then
    select id into v_promo_id
    from private.gold_promo_codes
    where code_hash=extensions.digest(v_code,'sha256')
    limit 1;
  end if;

  insert into public.upgrade_requests(
    owner_id,from_plan,to_plan,term_months,status,
    current_plan_price,target_plan_price,upgrade_difference,next_regular_price,
    discount_percent,no_auto_renew,access_period_id,period_starts_at,period_ends_at,
    prorated_difference,currency,promo_code_id,promo_label,promo_discount_percent,
    package_total_before_promo,promo_savings,quoted_package_total
  ) values (
    v_uid,v_quote->>'from_plan',p_to_plan,coalesce(p_term_months,1),'requested',
    (v_quote->>'current_monthly_price')::numeric,(v_quote->>'target_monthly_price')::numeric,
    (v_quote->>'upgrade_difference_full_month')::numeric,(v_quote->>'next_regular_price')::numeric,
    (v_quote->>'term_discount_percent')::numeric,true,(v_quote->>'period_id')::uuid,
    (v_quote->>'period_starts_at')::timestamptz,(v_quote->>'period_ends_at')::timestamptz,
    (v_quote->>'upgrade_due_now')::numeric,'EUR',v_promo_id,v_quote->>'promo_label',
    nullif((v_quote->>'promo_discount_percent')::numeric,0),
    (v_quote->>'package_total_before_promo')::numeric,(v_quote->>'promo_savings')::numeric,
    (v_quote->>'package_total')::numeric
  ) returning id into v_id;

  return v_quote || jsonb_build_object(
    'request_id',v_id,
    'status','requested',
    'message','Upgrade vorgemerkt. Während der Testphase wird keine Zahlung ausgelöst.'
  );
end;
$$;

-- Keep the existing two-argument contract for older clients.
create or replace function private.gold_request_upgrade_impl(
  p_to_plan text,
  p_term_months integer default 1
)
returns jsonb
language sql
security definer
set search_path=''
as $$
  select private.gold_request_upgrade_impl(p_to_plan,p_term_months,null);
$$;

create or replace function public.gold_upgrade_quote(
  p_to_plan text,
  p_term_months integer,
  p_promo_code text
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.gold_upgrade_quote_impl(p_to_plan,p_term_months,p_promo_code);
$$;

create or replace function public.gold_request_upgrade(
  p_to_plan text,
  p_term_months integer,
  p_promo_code text
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.gold_request_upgrade_impl(p_to_plan,p_term_months,p_promo_code);
$$;

revoke all on function private.gold_upgrade_quote_impl(text,integer,text) from public, anon;
revoke all on function private.gold_request_upgrade_impl(text,integer,text) from public, anon;
grant execute on function private.gold_upgrade_quote_impl(text,integer,text) to authenticated;
grant execute on function private.gold_request_upgrade_impl(text,integer,text) to authenticated;

revoke all on function public.gold_upgrade_quote(text,integer,text) from public, anon;
revoke all on function public.gold_request_upgrade(text,integer,text) from public, anon;
grant execute on function public.gold_upgrade_quote(text,integer,text) to authenticated;
grant execute on function public.gold_request_upgrade(text,integer,text) to authenticated;

comment on function public.gold_upgrade_quote(text,integer,text) is
  'V31 authenticated price preview with private promo validation; payment remains disabled.';
comment on function public.gold_request_upgrade(text,integer,text) is
  'V31 authenticated upgrade reservation with private promo validation; no payment is executed.';
