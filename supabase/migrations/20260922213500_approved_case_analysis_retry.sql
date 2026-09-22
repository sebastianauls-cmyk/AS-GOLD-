-- An administrator may approve one additional attempt after a documented repair.
-- This migration grants no credits, starts no jobs and changes no existing jobs.
-- Approval is separate from deployment; it must be obtained before granting a credit.
create table private.case_analysis_repair_credits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  failed_job_id uuid not null unique references public.case_analysis_jobs(id) on delete cascade,
  source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
  reason text not null check(length(btrim(reason)) between 20 and 500),
  repair_commit text not null check(repair_commit ~ '^[a-f0-9]{40}$'),
  approval_reference text not null check(length(btrim(approval_reference)) between 20 and 500),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '30 minutes',
  granted_by name not null default session_user,
  revoked_at timestamptz,
  used_at timestamptz,
  used_by_job_id uuid unique references public.case_analysis_jobs(id) on delete set null,
  check(expires_at=granted_at+interval '30 minutes'),
  check(used_by_job_id is null or used_at is not null)
);
create index case_analysis_repair_credits_owner_granted on private.case_analysis_repair_credits(owner_id,granted_at desc);
alter table private.case_analysis_repair_credits enable row level security;
revoke all on private.case_analysis_repair_credits from public,anon,authenticated,service_role;

-- Database-administrator operation only: deliberately no public RPC and no
-- service-role EXECUTE grant. A normal web client cannot grant its own credit.
create function private.grant_case_analysis_repair_credit(
  p_failed_job_id uuid,p_reason text,p_repair_commit text,p_approval_reference text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.case_analysis_jobs; c private.case_analysis_repair_credits; v_used integer;
begin
  if p_reason is null or length(btrim(p_reason)) not between 20 and 500
    or p_repair_commit is null or p_repair_commit!~'^[a-f0-9]{40}$'
    or p_approval_reference is null or length(btrim(p_approval_reference)) not between 20 and 500
    then raise exception 'Repair and explicit approval references required'; end if;
  select * into j from public.case_analysis_jobs where id=p_failed_job_id;
  if not found then raise exception 'Eligible failed analysis required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(j.owner_id::text,0));
  select * into c from private.case_analysis_repair_credits where failed_job_id=j.id;
  if found then return to_jsonb(c); end if; -- Idempotent; never renews or resets a credit.
  select * into j from public.case_analysis_jobs where id=p_failed_job_id for update;
  if j.status<>'failed' or j.finished_at is null or j.roadmap_id is not null
    or j.created_at<now()-interval '1 day'
    or coalesce(j.error_code,'') not in ('source_unresolved','review_unresolved','provider_timeout','provider_network','provider_http','provider_response_format')
    then raise exception 'Eligible failed analysis required'; end if;
  if not private.case_analysis_allowed(j.owner_id,j.case_id,false)
    or not exists(select 1 from auth.users where id=j.owner_id and is_anonymous is false)
    then raise exception 'Analysis authorization missing' using errcode='42501'; end if;
  if exists(select 1 from public.case_analysis_jobs where owner_id=j.owner_id and case_id=j.case_id and status in ('queued','running'))
    then raise exception 'Analysis already active'; end if;
  if exists(select 1 from private.case_analysis_repair_credits where owner_id=j.owner_id and granted_at>=now()-interval '1 day')
    then raise exception 'Repair credit daily limit reached'; end if;
  select (select count(*) from public.case_analysis_jobs where owner_id=j.owner_id and created_at>=now()-interval '1 day')
    +(select count(*) from public.case_roadmaps r where owner_id=j.owner_id and created_at>=now()-interval '1 day'
      and not exists(select 1 from public.case_analysis_jobs x where x.id=r.id)) into v_used;
  if v_used<>20 then raise exception 'Repair credit requires the normal daily limit'; end if;
  insert into private.case_analysis_repair_credits(owner_id,case_id,failed_job_id,source_fingerprint,reason,repair_commit,approval_reference)
    values(j.owner_id,j.case_id,j.id,j.source_fingerprint,btrim(p_reason),p_repair_commit,btrim(p_approval_reference)) returning * into c;
  return to_jsonb(c);
end $$;
revoke all on function private.grant_case_analysis_repair_credit(uuid,text,text,text) from public,anon,authenticated,service_role;

create or replace function private.enqueue_case_analysis_job(p_owner_id uuid,p_case_id uuid,p_fingerprint text,p_request jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.case_analysis_jobs; v_limit integer; v_used integer; v_credit uuid;
begin
  if p_request->>'acknowledged' is distinct from 'true' or p_request->>'privacy_notice_version' is distinct from '2026-08-30-v1'
    or p_request->>'terms_version' is distinct from '2026-08-30-test-v1'
    or coalesce(p_request->>'output_language','') not in ('de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi')
    or coalesce(p_request->>'reference_language','') not in ('de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi')
    or jsonb_typeof(p_request->'style') is distinct from 'object'
    or jsonb_typeof(p_request->'draft_letters') is distinct from 'boolean'
    or not private.case_analysis_allowed(p_owner_id,p_case_id,(p_request->>'draft_letters')::boolean)
    then raise exception 'Analysis authorization missing' using errcode='42501'; end if;
  if not exists(select 1 from private.case_analysis_config where singleton and enabled) then raise exception 'Background service unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id::text,0));
  select * into j from public.case_analysis_jobs where owner_id=p_owner_id and case_id=p_case_id and status in ('queued','running');
  if found then return to_jsonb(j); end if;
  select case when is_anonymous then 4 else 20 end into v_limit from auth.users where id=p_owner_id;
  select (select count(*) from public.case_analysis_jobs where owner_id=p_owner_id and created_at>=now()-interval '1 day')
    +(select count(*) from public.case_roadmaps r where owner_id=p_owner_id and created_at>=now()-interval '1 day'
      and not exists(select 1 from public.case_analysis_jobs x where x.id=r.id)) into v_used;
  if v_used>=v_limit then
    -- Exactly one extra charged job, for the approved case and unchanged sources.
    -- Failed jobs continue to count. Neither guest limits nor provider quotas change.
    if v_limit=20 and v_used=20 then
      select id into v_credit from private.case_analysis_repair_credits
        where owner_id=p_owner_id and case_id=p_case_id and source_fingerprint=p_fingerprint
          and used_at is null and revoked_at is null and expires_at>now() order by granted_at limit 1 for update;
    end if;
    if v_credit is null then raise exception 'Analysis daily limit reached'; end if;
  end if;
  insert into public.case_analysis_jobs(owner_id,case_id,source_fingerprint) values(p_owner_id,p_case_id,p_fingerprint) returning * into j;
  insert into private.case_analysis_work(job_id,request) values(j.id,p_request);
  if v_credit is not null then
    update private.case_analysis_repair_credits set used_at=now(),used_by_job_id=j.id where id=v_credit;
  end if;
  return to_jsonb(j);
end $$;
