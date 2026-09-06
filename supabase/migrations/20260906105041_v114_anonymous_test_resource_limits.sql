-- V114: anonymous testers use the authenticated Postgres role, so the test
-- workspace needs explicit per-resource quotas in addition to owner isolation.

create or replace function private.gold_guest_insert_allowed(p_resource text)
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_guest boolean := coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
begin
  if v_uid is null then return false; end if;
  if not v_is_guest then return true; end if;
  if not private.gold_access_active() then return false; end if;

  return case p_resource
    when 'account_privacy_settings' then
      (select count(*) from public.account_privacy_settings where owner_id=v_uid)<1
    when 'clients' then
      (select count(*) from public.clients where owner_id=v_uid)<5
    when 'cases' then
      (select count(*) from public.cases where owner_id=v_uid)<12
    when 'approvals' then
      (select count(*) from public.approvals where owner_id=v_uid)<12
    when 'assessments' then
      (select count(*) from public.assessments where owner_id=v_uid)<24
    when 'source_status' then
      (select count(*) from public.source_status where owner_id=v_uid)<24
    when 'exports' then
      (select count(*) from public.exports where owner_id=v_uid)<20
    when 'improvement_proposals' then
      (select count(*) from public.improvement_proposals where owner_id=v_uid)<3
    when 'deletion_requests' then
      (select count(*) from public.deletion_requests where owner_id=v_uid)<1
    when 'upgrade_requests' then
      (select count(*) from public.upgrade_requests where owner_id=v_uid)<3
    when 'email_connections' then false
    else false
  end;
end;
$$;

revoke all on function private.gold_guest_insert_allowed(text) from public,anon,authenticated,service_role;
grant execute on function private.gold_guest_insert_allowed(text) to authenticated;

drop policy if exists account_privacy_settings_insert_own on public.account_privacy_settings;
create policy account_privacy_settings_insert_own
on public.account_privacy_settings for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and real_data_authorized=false
  and special_categories_authorized=false
  and (select private.gold_guest_insert_allowed('account_privacy_settings'))
);

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own
on public.clients for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('clients'))
);

drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own
on public.cases for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('cases'))
);

drop policy if exists approvals_insert_own on public.approvals;
create policy approvals_insert_own
on public.approvals for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('approvals'))
);

drop policy if exists assessments_insert_own on public.assessments;
create policy assessments_insert_own
on public.assessments for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('assessments'))
);

drop policy if exists source_status_insert_own on public.source_status;
create policy source_status_insert_own
on public.source_status for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('source_status'))
);

drop policy if exists exports_insert_own on public.exports;
create policy exports_insert_own
on public.exports for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('exports'))
);

drop policy if exists improvement_proposals_insert_own on public.improvement_proposals;
create policy improvement_proposals_insert_own
on public.improvement_proposals for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and status='pending'
  and (select private.gold_guest_insert_allowed('improvement_proposals'))
);

drop policy if exists deletion_requests_insert_own on public.deletion_requests;
create policy deletion_requests_insert_own
on public.deletion_requests for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and status='requested'
  and legal_hold=false
  and confirmed_at is null
  and completed_at is null
  and (select private.gold_guest_insert_allowed('deletion_requests'))
);

drop policy if exists upgrade_requests_insert_own on public.upgrade_requests;
create policy upgrade_requests_insert_own
on public.upgrade_requests for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('upgrade_requests'))
);

drop policy if exists email_connections_insert_own on public.email_connections;
create policy email_connections_insert_own
on public.email_connections for insert to authenticated
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and (select private.gold_guest_insert_allowed('email_connections'))
);

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
    from auth.users
    where is_anonymous is true and created_at>=now()-interval '24 hours';

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
