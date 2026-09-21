-- Only a normal authenticated request can enqueue an authorized analysis.
-- No historical cases are enqueued by this migration.
create table public.case_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  status text not null default 'queued' check(status in ('queued','running','completed','failed','cancelled')),
  stage text not null default 'planning',
  source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
  roadmap_id uuid references public.case_roadmaps(id) on delete set null,
  error_code text,
  error_message text check(length(error_message)<=1200),
  issues jsonb not null default '[]'::jsonb check(jsonb_typeof(issues)='array' and jsonb_array_length(issues)<=8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz not null default now()+interval '30 minutes'
);
create unique index case_analysis_jobs_one_active on public.case_analysis_jobs(owner_id,case_id) where status in ('queued','running');
create index case_analysis_jobs_owner_created on public.case_analysis_jobs(owner_id,created_at desc);
create index case_analysis_jobs_case_created on public.case_analysis_jobs(case_id,created_at desc);
create unique index case_analysis_jobs_roadmap on public.case_analysis_jobs(roadmap_id) where roadmap_id is not null;
alter table public.case_analysis_jobs enable row level security;
create policy case_analysis_jobs_read_own on public.case_analysis_jobs for select to authenticated using(
  owner_id=(select auth.uid()) and (select private.gold_access_active())
  and exists(select 1 from public.cases c where c.id=case_id and c.owner_id=(select auth.uid()))
);
revoke all on public.case_analysis_jobs from public,anon,authenticated;
grant select on public.case_analysis_jobs to authenticated;
grant all on public.case_analysis_jobs to service_role;

-- Sealed candidates and machine capabilities are never returned by the Data API.
create table private.case_analysis_work (
  job_id uuid primary key references public.case_analysis_jobs(id) on delete cascade,
  request jsonb not null check(jsonb_typeof(request)='object' and octet_length(request::text)<=10000),
  checkpoint text check(length(checkpoint)<=700000),
  steps integer not null default 0 check(steps between 0 and 16),
  attempts integer not null default 0 check(attempts between 0 and 20),
  failures integer not null default 0,
  available_at timestamptz not null default now(),
  dispatch_hash text,
  dispatch_until timestamptz,
  lease uuid,
  lease_until timestamptz
);
create table private.case_analysis_config (
  singleton boolean primary key default true check(singleton),
  worker_url text not null check(worker_url ~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/gold-case-worker$'),
  enabled boolean not null default false
);
alter table private.case_analysis_work enable row level security;
alter table private.case_analysis_config enable row level security;
revoke all on private.case_analysis_work,private.case_analysis_config from public,anon,authenticated;

-- Uses database-owned identity/access state, never user-editable JWT metadata.
create function private.case_analysis_allowed(p_owner uuid,p_case uuid,p_letters boolean) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from private.user_access ua join auth.users u on u.id=ua.user_id
    join public.cases c on c.owner_id=u.id and c.id=p_case
    join public.account_privacy_settings s on s.owner_id=u.id
    where u.id=p_owner and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())
      and ua.active is true and ua.status='approved'
      and ((ua.permissions->>'access_source'='anonymous_test' and u.is_anonymous is true
        and nullif(ua.permissions->>'guest_access_ends_at','')::timestamptz>now())
        or (ua.permissions->>'access_source' is distinct from 'anonymous_test' and u.is_anonymous is not true))
      and private.gold_effective_permissions(u.id)->>'full_analysis'='true'
      and (not p_letters or private.gold_effective_permissions(u.id)->>'draft_letters'='true')
      and s.ai_processing_enabled is true and s.privacy_notice_version='2026-08-30-v1'
      and s.privacy_notice_acknowledged_at is not null and s.terms_version='2026-08-30-test-v1'
      and s.terms_acknowledged_at is not null
  )
$$;

create function private.enqueue_case_analysis_job(p_owner_id uuid,p_case_id uuid,p_fingerprint text,p_request jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.case_analysis_jobs; v_limit integer; v_used integer;
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
  if v_used>=v_limit then raise exception 'Analysis daily limit reached'; end if;
  insert into public.case_analysis_jobs(owner_id,case_id,source_fingerprint) values(p_owner_id,p_case_id,p_fingerprint) returning * into j;
  insert into private.case_analysis_work(job_id,request) values(j.id,p_request);
  return to_jsonb(j);
end $$;

create function private.dispatch_case_analysis_jobs() returns integer
language plpgsql security definer set search_path='' as $$
declare w record; j public.case_analysis_jobs; v_url text; v_token text; v_count integer:=0;
begin
  select worker_url into v_url from private.case_analysis_config where singleton and enabled;
  for w in select x.* from private.case_analysis_work x join public.case_analysis_jobs q on q.id=x.job_id
    where q.status in ('queued','running') and (q.expires_at<=now() or
      (v_url is not null and x.available_at<=now() and coalesce(x.lease_until,'-infinity')<=now() and coalesce(x.dispatch_until,'-infinity')<=now()))
    order by q.created_at for update of x skip locked limit 4
  loop
    select * into j from public.case_analysis_jobs where id=w.job_id for update;
    if j.expires_at<=now() or w.attempts>=20 or w.steps>=16 or (j.status='running' and w.failures>=1)
      or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then
      update public.case_analysis_jobs set status='failed',error_code='job_stopped',error_message='Der Auftrag konnte innerhalb seiner Freigabe und Laufzeit nicht abgeschlossen werden. Kein neues Ergebnis gespeichert.',finished_at=now(),updated_at=now() where id=j.id;
      update private.case_analysis_work set checkpoint=null,dispatch_hash=null,dispatch_until=null,lease=null,lease_until=null where job_id=j.id;
      continue;
    end if;
    v_token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
    update private.case_analysis_work set dispatch_hash=encode(sha256(convert_to(v_token,'UTF8')),'hex'),dispatch_until=now()+interval '2 minutes',
      lease=null,lease_until=null,failures=failures+case when j.status='running' then 1 else 0 end where job_id=j.id;
    update public.case_analysis_jobs set status='queued',updated_at=now() where id=j.id;
    perform net.http_post(url:=v_url,headers:='{"Content-Type":"application/json"}'::jsonb,
      body:=jsonb_build_object('job_id',j.id,'token',v_token),timeout_milliseconds:=10000);
    v_count:=v_count+1;
  end loop;
  return v_count;
end $$;

create function private.claim_case_analysis_job(p_job_id uuid,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; v_lease uuid;
begin
  if p_token is null or p_token!~'^[a-f0-9]{64}$' then return null; end if;
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.dispatch_hash is distinct from encode(sha256(convert_to(p_token,'UTF8')),'hex') or w.dispatch_until is null or w.dispatch_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'queued' or j.expires_at<=now() or w.attempts>=20 or w.steps>=16
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  v_lease:=gen_random_uuid();
  update private.case_analysis_work set dispatch_hash=null,dispatch_until=null,lease=v_lease,lease_until=now()+interval '5 minutes',attempts=attempts+1 where job_id=j.id;
  update public.case_analysis_jobs set status='running',started_at=coalesce(started_at,now()),updated_at=now() where id=j.id;
  return to_jsonb(j)||jsonb_build_object('request',w.request,'checkpoint',w.checkpoint,'lease',v_lease);
end $$;

create function private.finish_case_analysis_job(p_job_id uuid,p_lease uuid,p_outcome jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; v_status text:=p_outcome->>'status';
begin
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'running' then return null; end if;
  if j.expires_at<=now() or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then
    v_status:='failed';p_outcome:=jsonb_build_object('status','failed','code','access_changed','message','Die Verarbeitungsfreigabe ist abgelaufen oder wurde geändert. Kein neues Ergebnis gespeichert.');
  end if;
  if v_status='completed' then
    if jsonb_typeof(p_outcome->'result') is distinct from 'object' or p_outcome->>'workflow_version' is null
      or jsonb_typeof(p_outcome#>'{result,analysis,verification,review_response_ids}') is distinct from 'array'
      or jsonb_array_length(p_outcome#>'{result,analysis,verification,review_response_ids}')<>3
      then raise exception 'Invalid reviewed result'; end if;
    insert into public.case_roadmaps(id,owner_id,case_id,output_language,reference_language,style,result,source_fingerprint,source_documents,model,workflow_version)
      values(j.id,j.owner_id,j.case_id,w.request->>'output_language',w.request->>'reference_language',w.request->'style',p_outcome->'result',j.source_fingerprint,p_outcome->'source_documents',p_outcome->>'model',p_outcome->>'workflow_version') on conflict(id) do nothing;
    update public.case_analysis_jobs set status='completed',stage='completed',roadmap_id=id,updated_at=now(),finished_at=now() where id=j.id returning * into j;
  elsif v_status='processing' and w.steps<15 and p_outcome->>'checkpoint' is not null and p_outcome->>'stage' in ('planning','research','generation','review','correction') then
    update public.case_analysis_jobs set status='queued',stage=p_outcome->>'stage',updated_at=now() where id=j.id returning * into j;
    update private.case_analysis_work set checkpoint=p_outcome->>'checkpoint',steps=steps+1,available_at=now(),lease=null,lease_until=null where job_id=j.id;
    return to_jsonb(j);
  elsif v_status='failed' and p_outcome->>'retry'='true' and w.failures<1 and w.attempts<20 and j.expires_at>now()
    and p_outcome->>'code' in ('provider_network','provider_timeout') then
    update private.case_analysis_work set failures=failures+1,available_at=now()+interval '30 seconds',lease=null,lease_until=null where job_id=j.id;
    update public.case_analysis_jobs set status='queued',updated_at=now() where id=j.id returning * into j;
    return to_jsonb(j);
  else
    update public.case_analysis_jobs set status='failed',error_code=left(coalesce(p_outcome->>'code','workflow_invalid'),80),
      error_message=left(coalesce(p_outcome->>'message','Die Verarbeitung konnte nicht vollständig geprüft werden. Kein neues Ergebnis gespeichert.'),1200),
      issues=case when jsonb_typeof(p_outcome->'issues')='array' and jsonb_array_length(p_outcome->'issues')<=8 then p_outcome->'issues' else '[]'::jsonb end,
      updated_at=now(),finished_at=now() where id=j.id returning * into j;
  end if;
  update private.case_analysis_work set checkpoint=null,dispatch_hash=null,dispatch_until=null,lease=null,lease_until=null where job_id=j.id;
  return to_jsonb(j);
end $$;

create function private.cancel_case_analysis_job(p_owner_id uuid,p_case_id uuid,p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.case_analysis_jobs;
begin
  perform 1 from private.case_analysis_work where job_id=p_job_id for update;
  select * into j from public.case_analysis_jobs where id=p_job_id and owner_id=p_owner_id and case_id=p_case_id for update;
  if not found then return null; end if;
  if j.status in ('queued','running') then
    update public.case_analysis_jobs set status='cancelled',updated_at=now(),finished_at=now() where id=j.id returning * into j;
    update private.case_analysis_work set checkpoint=null,dispatch_hash=null,dispatch_until=null,lease=null,lease_until=null where job_id=j.id;
  end if;
  return to_jsonb(j);
end $$;

create function public.enqueue_case_analysis_job(p_owner_id uuid,p_case_id uuid,p_fingerprint text,p_request jsonb) returns jsonb
language sql security invoker set search_path='' as $$select private.enqueue_case_analysis_job(p_owner_id,p_case_id,p_fingerprint,p_request)$$;
create function public.claim_case_analysis_job(p_job_id uuid,p_token text) returns jsonb
language sql security invoker set search_path='' as $$select private.claim_case_analysis_job(p_job_id,p_token)$$;
create function public.finish_case_analysis_job(p_job_id uuid,p_lease uuid,p_outcome jsonb) returns jsonb
language sql security invoker set search_path='' as $$select private.finish_case_analysis_job(p_job_id,p_lease,p_outcome)$$;
create function public.cancel_case_analysis_job(p_owner_id uuid,p_case_id uuid,p_job_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select private.cancel_case_analysis_job(p_owner_id,p_case_id,p_job_id)$$;

revoke all on function private.case_analysis_allowed(uuid,uuid,boolean),private.enqueue_case_analysis_job(uuid,uuid,text,jsonb),private.dispatch_case_analysis_jobs(),private.claim_case_analysis_job(uuid,text),private.finish_case_analysis_job(uuid,uuid,jsonb),private.cancel_case_analysis_job(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.enqueue_case_analysis_job(uuid,uuid,text,jsonb),public.claim_case_analysis_job(uuid,text),public.finish_case_analysis_job(uuid,uuid,jsonb),public.cancel_case_analysis_job(uuid,uuid,uuid) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.enqueue_case_analysis_job(uuid,uuid,text,jsonb),private.claim_case_analysis_job(uuid,text),private.finish_case_analysis_job(uuid,uuid,jsonb),private.cancel_case_analysis_job(uuid,uuid,uuid) to service_role;
grant execute on function public.enqueue_case_analysis_job(uuid,uuid,text,jsonb),public.claim_case_analysis_job(uuid,text),public.finish_case_analysis_job(uuid,uuid,jsonb),public.cancel_case_analysis_job(uuid,uuid,uuid) to service_role;

-- The next migration installs/schedules the platform dispatch separately.
comment on table public.case_analysis_jobs is 'Durable, owner-visible status of explicitly authorized complete case analyses. No unreviewed candidates or external sending.';

create function private.wake_case_analysis_jobs() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform private.dispatch_case_analysis_jobs();
  return new;
exception when others then
  -- The durable checkpoint remains committed; the scheduled dispatcher retries.
  raise log 'Case job dispatch deferred, SQLSTATE %',SQLSTATE;
  return new;
end $$;
revoke all on function private.wake_case_analysis_jobs() from public,anon,authenticated;
create trigger case_analysis_wake after insert or update of checkpoint,available_at on private.case_analysis_work
for each row execute function private.wake_case_analysis_jobs();
