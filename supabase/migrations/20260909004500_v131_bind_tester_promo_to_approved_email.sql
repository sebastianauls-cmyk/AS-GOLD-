alter table private.gold_promo_codes
  add column if not exists assigned_email text;

create or replace function private.gold_redeem_test_access_impl(p_promo_code text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_code text := private.gold_normalize_promo_code(p_promo_code);
  v_access private.user_access%rowtype;
  v_promo private.gold_promo_codes%rowtype;
  v_existing private.gold_promo_redemptions%rowtype;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_user_email text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if char_length(v_code)=0 or char_length(v_code)>64 then raise exception 'Invalid or expired promo code'; end if;

  select lower(email) into v_user_email from auth.users where id=v_uid;

  select * into v_access
  from private.user_access
  where user_id=v_uid and active=true and status='approved';
  if not found then raise exception 'Active access required'; end if;

  if v_access.app_role='owner' then
    return jsonb_build_object('access_granted',true,'already_redeemed',true,'owner_permanent_access',true,'plan_key','business','no_auto_renew',true,'payment_enabled',false);
  end if;

  select * into v_promo
  from private.gold_promo_codes
  where code_hash=extensions.digest(v_code,'sha256') and active=true and grant_plan_key is not null
  for update;

  if not found or v_promo.valid_from>v_now or (v_promo.valid_until is not null and v_promo.valid_until<=v_now) then
    raise exception 'Invalid or expired promo code';
  end if;

  if v_promo.assigned_email is not null and lower(btrim(v_promo.assigned_email))<>coalesce(v_user_email,'') then
    raise exception 'Promo code is not assigned to this account';
  end if;

  select * into v_existing
  from private.gold_promo_redemptions
  where promo_code_id=v_promo.id and owner_id=v_uid;

  if found then
    return jsonb_build_object('access_granted',v_existing.ends_at>v_now,'already_redeemed',true,'expired',v_existing.ends_at<=v_now,'plan_key',v_existing.plan_key,'starts_at',v_existing.starts_at,'ends_at',v_existing.ends_at,'access_days',v_promo.grant_days,'no_auto_renew',true,'payment_enabled',false);
  end if;

  if v_promo.max_redemptions is not null and v_promo.redemption_count>=v_promo.max_redemptions then
    raise exception 'Promo redemption limit reached';
  end if;

  v_starts_at := v_now;
  v_ends_at := v_starts_at+make_interval(days=>v_promo.grant_days);

  insert into private.gold_promo_redemptions(promo_code_id,owner_id,plan_key,starts_at,ends_at)
  values (v_promo.id,v_uid,v_promo.grant_plan_key,v_starts_at,v_ends_at);

  insert into public.user_access_periods(owner_id,plan_id,term_months,starts_at,ends_at,status,auto_renew,amount_paid,currency,reactivation_until)
  values (v_uid,case when v_promo.grant_plan_key='free' then 'free' else 'gold_'||v_promo.grant_plan_key end,1,v_starts_at,v_ends_at,'active',false,0,'EUR',v_ends_at+interval '3 months');

  insert into public.audit_events(owner_id,event_type,entity_type,entity_id,event_data,source)
  values (v_uid,'promo_access_redeemed','account',null,jsonb_build_object('plan_key',v_promo.grant_plan_key,'ends_at',v_ends_at,'no_auto_renew',true,'assigned_email',v_promo.assigned_email),'server');

  update private.user_access
  set permissions=coalesce(permissions,'{}'::jsonb) || jsonb_build_object('access_source','promo_test','promo_label',v_promo.label,'promo_plan_key',v_promo.grant_plan_key,'promo_access_starts_at',v_starts_at,'promo_access_ends_at',v_ends_at,'test_access',true,'promo_access_expired',false,'payment_required',false,'auto_renew',false,'post_expiry_mode','free'), updated_at=v_now,last_changed_at=v_now
  where user_id=v_uid;

  update private.gold_promo_codes set redemption_count=redemption_count+1,updated_at=v_now where id=v_promo.id;

  return jsonb_build_object('access_granted',true,'already_redeemed',false,'plan_key',v_promo.grant_plan_key,'starts_at',v_starts_at,'ends_at',v_ends_at,'access_days',v_promo.grant_days,'redemptions_remaining',case when v_promo.max_redemptions is null then null else v_promo.max_redemptions-v_promo.redemption_count-1 end,'no_auto_renew',true,'payment_enabled',false,'post_expiry_plan',coalesce(v_access.permissions->>'tier','free'));
end;
$function$;
