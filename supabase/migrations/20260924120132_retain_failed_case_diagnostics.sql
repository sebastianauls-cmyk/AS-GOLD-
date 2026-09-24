-- Keep the last encrypted candidate long enough to diagnose content failures.
-- The existing 24-hour expiry and access/consent deletion still apply. Neither
-- the resume allowlist nor any publication gate or spending limit is changed.
do $$
begin
  if exists(select 1 from private.case_analysis_config where enabled)
    or exists(select 1 from public.case_analysis_jobs where status in ('queued','running')) then
    raise exception 'Pause case processing and wait for active jobs before changing retention';
  end if;
end $$;

create or replace function private.discard_finished_case_work() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('completed','cancelled','failed') and
    (new.status<>'failed'
      or (not private.case_work_failure_recoverable(new.error_code)
        and coalesce(new.error_code,'') not in ('review_unresolved','source_unresolved'))
      or not private.case_analysis_allowed(new.owner_id,new.case_id,
        coalesce((select (request->>'draft_letters')::boolean from private.case_analysis_work where job_id=new.id),true))) then
    delete from private.retained_case_work where owner_id=new.owner_id and case_id=new.case_id;
  end if;
  return new;
end $$;
revoke all on function private.discard_finished_case_work() from public,anon,authenticated,service_role;

-- Starting from the UI refreshes updated_at and reaffirms an already enabled
-- consent. That no-op must not erase the very checkpoint the retry can reuse.
-- All substantive privacy changes and all access/auth changes still discard it.
create or replace function private.discard_owner_case_work() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_owner uuid;
begin
  if tg_op='UPDATE' and tg_table_name='account_privacy_settings'
    and (to_jsonb(old)-'updated_at') is not distinct from (to_jsonb(new)-'updated_at') then
    return null;
  end if;
  v_owner:=case tg_table_name when 'account_privacy_settings' then (to_jsonb(old)->>'owner_id')::uuid
    when 'user_access' then (to_jsonb(old)->>'user_id')::uuid else (to_jsonb(old)->>'id')::uuid end;
  delete from private.retained_case_work where owner_id=v_owner;
  return null;
end $$;
revoke all on function private.discard_owner_case_work() from public,anon,authenticated,service_role;
