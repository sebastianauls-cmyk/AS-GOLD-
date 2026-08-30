-- V29: make application audit events append-only and server validated.
-- Browsers may read their own events, but may no longer insert arbitrary rows.

create or replace function private.record_gold_audit_event_impl(
  p_event_type text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_allowed_metadata text[];
  v_allowed_events constant text[] := array[
    'upgrade_requested',
    'client_created',
    'case_created', 'case_updated',
    'assessment_created',
    'document_uploaded', 'document_opened', 'document_reviewed',
    'document_analysis_generated', 'document_analysis_saved',
    'document_ai_transfer_authorized',
    'approval_created', 'approval_updated', 'approval_invalidated',
    'approval_approved', 'approval_rejected',
    'export_created', 'account_data_export',
    'account_deletion_requested', 'account_deletion_cancelled',
    'legal_notices_acknowledged', 'account_ai_processing_disabled',
    'privacy_settings_updated', 'session_timeout'
  ];
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if not private.gold_access_active() then
    raise exception using errcode = '42501', message = 'Active access required';
  end if;
  if p_event_type is null or not (p_event_type = any (v_allowed_events)) then
    raise exception using errcode = '22023', message = 'Unsupported audit event';
  end if;
  if p_entity_type is not null
     and not (p_entity_type = any (array['account','client','case','document','approval','export'])) then
    raise exception using errcode = '22023', message = 'Unsupported audit entity';
  end if;
  if jsonb_typeof(v_metadata) <> 'object' or length(v_metadata::text) > 512 then
    raise exception using errcode = '22023', message = 'Invalid audit metadata';
  end if;

  v_allowed_metadata := case
    when p_event_type = 'upgrade_requested' then array['plan_key','term_months']
    when p_event_type in ('document_uploaded','document_ai_transfer_authorized') then array['classification']
    when p_event_type in ('document_reviewed','document_analysis_generated','document_analysis_saved',
                          'account_deletion_requested','account_deletion_cancelled',
                          'account_ai_processing_disabled','privacy_settings_updated','session_timeout') then array['status']
    when p_event_type like 'approval_%' then array['revision']
    when p_event_type in ('export_created','account_data_export') then array['format']
    else array[]::text[]
  end;

  if (v_metadata - v_allowed_metadata) <> '{}'::jsonb then
    raise exception using errcode = '22023', message = 'Unsupported audit metadata';
  end if;
  if (v_metadata ? 'format' and not (v_metadata->>'format' = any (array['PDF','DOCX','XLSX','PPTX','CSV','TXT','JSON','ZIP'])))
     or (v_metadata ? 'classification' and not (v_metadata->>'classification' = any (array['unclassified','synthetic','anonymized','personal','special'])))
     or (v_metadata ? 'status' and not (v_metadata->>'status' = any (array['requested','cancelled','completed','provisional','saved','timeout'])))
     or (v_metadata ? 'plan_key' and not (v_metadata->>'plan_key' = any (array['free','start','klar','analyse','komplett','business'])))
     or (v_metadata ? 'revision' and (jsonb_typeof(v_metadata->'revision') <> 'number' or (v_metadata->>'revision')::numeric < 1 or (v_metadata->>'revision')::numeric > 1000000 or trunc((v_metadata->>'revision')::numeric) <> (v_metadata->>'revision')::numeric))
     or (v_metadata ? 'term_months' and (jsonb_typeof(v_metadata->'term_months') <> 'number' or not ((v_metadata->>'term_months')::numeric = any (array[1,3,6,12]::numeric[])))) then
    raise exception using errcode = '22023', message = 'Invalid audit metadata value';
  end if;

  if (p_event_type = 'upgrade_requested' and not (v_metadata ?& array['plan_key','term_months']))
     or (p_event_type in ('document_uploaded','document_ai_transfer_authorized') and not (v_metadata ? 'classification'))
     or (p_event_type like 'approval_%' and not (v_metadata ? 'revision'))
     or (p_event_type in ('export_created','account_data_export') and not (v_metadata ? 'format'))
     or (p_event_type = 'document_analysis_generated' and v_metadata->>'status' is distinct from 'provisional')
     or (p_event_type in ('document_reviewed','document_analysis_saved','privacy_settings_updated') and v_metadata->>'status' is distinct from 'saved')
     or (p_event_type = 'account_deletion_requested' and v_metadata->>'status' is distinct from 'requested')
     or (p_event_type = 'account_deletion_cancelled' and v_metadata->>'status' is distinct from 'cancelled')
     or (p_event_type = 'account_ai_processing_disabled' and v_metadata->>'status' is distinct from 'completed')
     or (p_event_type = 'session_timeout' and v_metadata->>'status' is distinct from 'timeout') then
    raise exception using errcode = '22023', message = 'Missing or inconsistent audit metadata';
  end if;

  if p_event_type in (
       'upgrade_requested','account_data_export','account_deletion_requested',
       'account_deletion_cancelled','legal_notices_acknowledged',
       'account_ai_processing_disabled','privacy_settings_updated','session_timeout'
     ) and p_entity_type is distinct from 'account' then
    raise exception using errcode = '22023', message = 'Account audit entity required';
  elsif p_event_type = 'client_created' and p_entity_type is distinct from 'client' then
    raise exception using errcode = '22023', message = 'Client audit entity required';
  elsif p_event_type in ('case_created','case_updated','assessment_created') and p_entity_type is distinct from 'case' then
    raise exception using errcode = '22023', message = 'Case audit entity required';
  elsif p_event_type like 'document_%' and p_entity_type is distinct from 'document' then
    raise exception using errcode = '22023', message = 'Document audit entity required';
  elsif p_event_type like 'approval_%' and p_entity_type is distinct from 'approval' then
    raise exception using errcode = '22023', message = 'Approval audit entity required';
  elsif p_event_type = 'export_created' and not (p_entity_type = any (array['case','document'])) then
    raise exception using errcode = '22023', message = 'Export source entity required';
  end if;

  if p_entity_type is null and p_entity_id is not null then
    raise exception using errcode = '22023', message = 'Entity type required';
  end if;
  if p_entity_type = 'account' and p_entity_id is not null then
    raise exception using errcode = '22023', message = 'Account events do not accept an entity id';
  elsif p_entity_type = 'client' and not exists (
    select 1 from public.clients where id = p_entity_id and owner_id = v_uid
  ) then
    raise exception using errcode = '42501', message = 'Entity not accessible';
  elsif p_entity_type = 'case' and not exists (
    select 1 from public.cases where id = p_entity_id and owner_id = v_uid
  ) then
    raise exception using errcode = '42501', message = 'Entity not accessible';
  elsif p_entity_type = 'document' and not exists (
    select 1 from public.documents where id = p_entity_id and owner_id = v_uid
  ) then
    raise exception using errcode = '42501', message = 'Entity not accessible';
  elsif p_entity_type = 'approval' and not exists (
    select 1 from public.approvals where id = p_entity_id and owner_id = v_uid
  ) then
    raise exception using errcode = '42501', message = 'Entity not accessible';
  elsif p_entity_type = 'export' and not exists (
    select 1 from public.exports where id = p_entity_id and owner_id = v_uid
  ) then
    raise exception using errcode = '42501', message = 'Entity not accessible';
  end if;

  insert into public.audit_events (
    owner_id, event_type, entity_type, entity_id, event_data, source
  ) values (
    v_uid, p_event_type, p_entity_type, p_entity_id, v_metadata, 'app'
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.record_gold_audit_event(
  p_event_type text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.record_gold_audit_event_impl(
    p_event_type, p_entity_type, p_entity_id, p_metadata
  );
$$;

revoke all on function private.record_gold_audit_event_impl(text,text,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.record_gold_audit_event(text,text,uuid,jsonb) from public, anon;
grant execute on function public.record_gold_audit_event(text,text,uuid,jsonb) to authenticated;

drop policy if exists audit_events_insert_own on public.audit_events;
revoke insert, update, delete on table public.audit_events from anon, authenticated;

comment on function public.record_gold_audit_event(text,text,uuid,jsonb) is
  'Append-only, allowlisted audit event entrypoint. Event semantics, metadata and entity ownership are validated server-side.';
