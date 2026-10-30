-- Guest-cap hardening: only successfully granted anonymous workspaces count
-- against the rolling 24-hour demo quota. Denied auth identities must not extend
-- the lockout window.

create or replace function private.handle_new_gold_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_guest boolean := coalesce(new.is_anonymous,false);
  v_guest_allowed boolean := true;
  v_guest_ends_at timestamptz := coalesce(new.created_at,now())+interval '2 hours';
  v_permissions jsonb;
begin
  if v_guest then
    perform pg_advisory_xact_lock(hashtext('as-workspace-gold-anonymous-test-cap'));

    select count(*)<20 into v_guest_allowed
    from private.user_access ua
    where ua.permissions->>'access_source'='anonymous_test'
      and coalesce((ua.permissions->>'guest_access')::boolean,false) is true
      and ua.status='approved'
      and ua.active is true
      and ua.created_at>=now()-interval '24 hours';

    v_permissions := jsonb_build_object(
      'tier','business',
      'document_limit',2,
      'full_analysis',true,
      'draft_letters',true,
      'business_mode',true,
      'export_word',true,
      'export_pdf',true,
      'export_excel',true,
      'export_pptx',true,
      'export_csv',true,
      'export_txt',true,
      'payment_required',false,
      'test_phase',true,
      'test_access',v_guest_allowed,
      'guest_access',v_guest_allowed,
      'quota_exhausted',not v_guest_allowed,
      'access_source','anonymous_test',
      'guest_access_ends_at',v_guest_ends_at,
      'auto_renew',false,
      'post_expiry_mode','ended'
    );
  else
    v_permissions := jsonb_build_object(
      'tier','free',
      'document_limit',3,
      'full_analysis',false,
      'draft_letters',false,
      'payment_required',false,
      'test_phase',true,
      'paid_term_days',30,
      'reminder_day_1',20,
      'reminder_day_2',28,
      'auto_renew',false,
      'post_expiry_mode','paused',
      'reactivation_months',3,
      'reactivation_by_payment',true
    );
  end if;

  insert into private.user_access (
    user_id,app_role,active,status,permissions,display_name,
    approved_at,approved_by,created_at,updated_at,last_changed_at
  ) values (
    new.id,
    'member',
    case when v_guest then v_guest_allowed else true end,
    case when v_guest and not v_guest_allowed then 'pending' else 'approved' end,
    v_permissions,
    case when v_guest then 'Synthetischer Testzugang' else nullif(coalesce(new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'full_name'),'') end,
    case when v_guest and not v_guest_allowed then null else now() end,
    null,
    now(),
    now(),
    now()
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;
