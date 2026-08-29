-- AS Gold V16: Harden public RPC security boundary.
-- Public RPCs are SECURITY INVOKER wrappers. Privileged implementation stays in private schema.

create or replace function private.gold_current_term_status_impl()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_period public.user_access_periods%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_period from public.user_access_periods
  where owner_id=v_uid and status='active' and ends_at>now()
  order by ends_at desc limit 1;
  if not found then return jsonb_build_object('active_paid_period',false,'no_auto_renew',true); end if;
  return jsonb_build_object(
    'active_paid_period',true,'plan_id',v_period.plan_id,'term_months',v_period.term_months,
    'starts_at',v_period.starts_at,'ends_at',v_period.ends_at,
    'primary_reminder_at',v_period.starts_at + interval '20 days',
    'final_reminder_at',v_period.ends_at - interval '2 days',
    'primary_reminder_sent_at',v_period.reminder_primary_sent_at,
    'final_reminder_sent_at',v_period.reminder_final_sent_at,
    'reactivation_until',coalesce(v_period.reactivation_until,v_period.ends_at + interval '3 months'),
    'no_auto_renew',not v_period.auto_renew);
end;$$;

create or replace function private.gold_upgrade_quote_impl(p_to_plan text,p_term_months integer default 1)
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
  v_now timestamptz := now();
  v_prorated numeric; v_package_total numeric; v_savings numeric;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_access from private.user_access where user_id=v_uid and active=true and status='approved';
  if not found then raise exception 'Active access required'; end if;
  select * into v_current from private.gold_plans where plan_key=coalesce(v_access.permissions->>'tier','free') and active=true;
  if not found then select * into v_current from private.gold_plans where plan_key='free' and active=true; end if;
  select * into v_target from private.gold_plans where plan_key=p_to_plan and active=true;
  if not found then raise exception 'Unknown target plan'; end if;
  if v_target.rank <= v_current.rank then raise exception 'Target plan must be higher than current plan'; end if;
  select * into v_term from private.gold_plan_terms where term_months=coalesce(p_term_months,1) and active=true;
  if not found then raise exception 'Unsupported term'; end if;
  select * into v_period from public.user_access_periods where owner_id=v_uid and status='active' and starts_at<=v_now and ends_at>v_now order by ends_at desc limit 1;
  if v_period.id is not null then
    v_prorated := public.calculate_upgrade_proration(v_current.price_eur,v_target.price_eur,v_period.starts_at,v_period.ends_at,v_now);
  else
    v_prorated := round(greatest(v_target.price_eur-v_current.price_eur,0),2);
  end if;
  v_package_total := round(v_target.price_eur*v_term.term_months*(1-v_term.discount_percent/100.0),2);
  v_savings := round((v_target.price_eur*v_term.term_months)-v_package_total,2);
  return jsonb_build_object('from_plan',v_current.plan_key,'from_plan_name',v_current.plan_name,'to_plan',v_target.plan_key,'to_plan_name',v_target.plan_name,'current_monthly_price',v_current.price_eur,'target_monthly_price',v_target.price_eur,'upgrade_difference_full_month',round(greatest(v_target.price_eur-v_current.price_eur,0),2),'upgrade_due_now',v_prorated,'term_months',v_term.term_months,'discount_percent',v_term.discount_percent,'package_total',v_package_total,'savings',v_savings,'next_regular_price',v_target.price_eur,'period_ends_at',v_period.ends_at,'no_auto_renew',true,'payment_enabled',false,'currency','EUR');
end;$$;

create or replace function private.gold_request_upgrade_impl(p_to_plan text,p_term_months integer default 1)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid(); v_quote jsonb; v_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  v_quote := private.gold_upgrade_quote_impl(p_to_plan,p_term_months);
  insert into public.upgrade_requests(owner_id,from_plan,to_plan,term_months,status)
  values(v_uid,v_quote->>'from_plan',p_to_plan,coalesce(p_term_months,1),'requested') returning id into v_id;
  return v_quote || jsonb_build_object('request_id',v_id,'status','requested','message','Upgrade vorgemerkt. Während der Testphase wird keine Zahlung ausgelöst.');
end;$$;

revoke all on function private.gold_current_term_status_impl() from public, anon;
revoke all on function private.gold_upgrade_quote_impl(text,integer) from public, anon;
revoke all on function private.gold_request_upgrade_impl(text,integer) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.gold_current_term_status_impl() to authenticated;
grant execute on function private.gold_upgrade_quote_impl(text,integer) to authenticated;
grant execute on function private.gold_request_upgrade_impl(text,integer) to authenticated;

create or replace function public.gold_current_term_status()
returns jsonb language sql security invoker set search_path=''
as $$ select private.gold_current_term_status_impl(); $$;

create or replace function public.gold_upgrade_quote(p_to_plan text,p_term_months integer default 1)
returns jsonb language sql security invoker set search_path=''
as $$ select private.gold_upgrade_quote_impl(p_to_plan,p_term_months); $$;

create or replace function public.gold_request_upgrade(p_to_plan text,p_term_months integer default 1)
returns jsonb language sql security invoker set search_path=''
as $$ select private.gold_request_upgrade_impl(p_to_plan,p_term_months); $$;

revoke all on function public.gold_current_term_status() from public, anon;
revoke all on function public.gold_upgrade_quote(text,integer) from public, anon;
revoke all on function public.gold_request_upgrade(text,integer) from public, anon;
grant execute on function public.gold_current_term_status() to authenticated;
grant execute on function public.gold_upgrade_quote(text,integer) to authenticated;
grant execute on function public.gold_request_upgrade(text,integer) to authenticated;
