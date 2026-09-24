do $$ begin if exists(select 1 from private.case_analysis_config where singleton and enabled) or exists(select 1 from public.case_analysis_jobs where status in ('queued','running')) then raise exception 'Retained-work rollout requires paused processing and no active jobs'; end if; end $$;
-- Keep the latest encrypted, unfinished work for an explicitly authorized new
-- job after a technical interruption. No enqueue, credit, budget, deadline,
-- retry or review-acceptance rule is changed. Existing lost work is not restored.
create table private.retained_case_work (
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  origin_job_id uuid not null references public.case_analysis_jobs(id) on delete cascade,
  cache_key text not null check(cache_key ~ '^[a-f0-9]{64}$'),
  source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
  ciphertext text not null check(length(ciphertext) between 1 and 700000),
  saved_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '24 hours',
  primary key(owner_id,case_id),
  check(expires_at>saved_at and expires_at<=saved_at+interval '24 hours')
);
create index retained_case_work_expiry on private.retained_case_work(expires_at);
alter table private.retained_case_work enable row level security;
revoke all on private.retained_case_work from public,anon,authenticated,service_role;

create function private.case_work_failure_recoverable(p_code text) returns boolean
language sql immutable set search_path='' as $$
  select coalesce(p_code in ('job_stopped','access_changed','provider_network','provider_timeout',
    'provider_response_format','provider_http','provider_quota','provider_missing',
    'budget_limit','budget_unavailable','worker_failed','retained_work_unavailable'),false)
$$;
revoke all on function private.case_work_failure_recoverable(text) from public,anon,authenticated,service_role;

create function private.read_retained_case_work(p_job_id uuid,p_lease uuid,p_cache_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; v_result jsonb;
begin
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'running' or j.expires_at<=now() or p_cache_key is null or p_cache_key!~'^[a-f0-9]{64}$'
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  delete from private.retained_case_work where owner_id=j.owner_id and case_id=j.case_id and expires_at<=now();
  select jsonb_build_object('ciphertext',s.ciphertext,'origin_job_id',s.origin_job_id) into v_result
    from private.retained_case_work s join public.case_analysis_jobs origin on origin.id=s.origin_job_id
    where s.owner_id=j.owner_id and s.case_id=j.case_id and s.cache_key=p_cache_key
      and s.source_fingerprint=j.source_fingerprint and s.expires_at>now()
      and origin.id<>j.id and origin.status='failed' and private.case_work_failure_recoverable(origin.error_code);
  return coalesce(v_result,'{}'::jsonb);
end $$;

create function private.save_retained_case_work(p_job_id uuid,p_lease uuid,p_cache_key text,p_ciphertext text) returns boolean
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs;
begin
  if p_cache_key is null or p_cache_key!~'^[a-f0-9]{64}$' or p_ciphertext is null
    or length(p_ciphertext) not between 1 and 700000 then return false; end if;
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return false; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'running' or j.expires_at<=now()
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return false; end if;
  insert into private.retained_case_work(owner_id,case_id,origin_job_id,cache_key,source_fingerprint,ciphertext)
    values(j.owner_id,j.case_id,j.id,p_cache_key,j.source_fingerprint,p_ciphertext)
    on conflict(owner_id,case_id) do update set origin_job_id=excluded.origin_job_id,cache_key=excluded.cache_key,
      source_fingerprint=excluded.source_fingerprint,ciphertext=excluded.ciphertext,saved_at=excluded.saved_at,expires_at=excluded.expires_at;
  return true;
end $$;
create function public.read_retained_case_work(p_job_id uuid,p_lease uuid,p_cache_key text) returns jsonb
language sql security invoker set search_path='' as $$select private.read_retained_case_work(p_job_id,p_lease,p_cache_key)$$;
create function public.save_retained_case_work(p_job_id uuid,p_lease uuid,p_cache_key text,p_ciphertext text) returns boolean
language sql security invoker set search_path='' as $$select private.save_retained_case_work(p_job_id,p_lease,p_cache_key,p_ciphertext)$$;
revoke all on function private.read_retained_case_work(uuid,uuid,text),private.save_retained_case_work(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.read_retained_case_work(uuid,uuid,text),public.save_retained_case_work(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.read_retained_case_work(uuid,uuid,text),private.save_retained_case_work(uuid,uuid,text,text) to service_role;
grant execute on function public.read_retained_case_work(uuid,uuid,text),public.save_retained_case_work(uuid,uuid,text,text) to service_role;

-- Cancellation, completion and content/source failures discard unfinished work.
-- A generic expired-job error retains it only while current access permits it.
create function private.discard_finished_case_work() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('completed','cancelled','failed') and
    (new.status<>'failed' or not private.case_work_failure_recoverable(new.error_code)
      or not private.case_analysis_allowed(new.owner_id,new.case_id,
        coalesce((select (request->>'draft_letters')::boolean from private.case_analysis_work where job_id=new.id),true))) then
    delete from private.retained_case_work where owner_id=new.owner_id and case_id=new.case_id;
  end if;
  return new;
end $$;
revoke all on function private.discard_finished_case_work() from public,anon,authenticated,service_role;
create trigger discard_finished_case_work after update of status on public.case_analysis_jobs
  for each row execute function private.discard_finished_case_work();

-- Changing/withdrawing consent or access invalidates previous retention even
-- if access is subsequently restored before another job is submitted.
create function private.discard_owner_case_work() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_owner uuid;
begin
  v_owner:=case tg_table_name when 'account_privacy_settings' then (to_jsonb(old)->>'owner_id')::uuid
    when 'user_access' then (to_jsonb(old)->>'user_id')::uuid else (to_jsonb(old)->>'id')::uuid end;
  delete from private.retained_case_work where owner_id=v_owner;
  return null;
end $$;
revoke all on function private.discard_owner_case_work() from public,anon,authenticated,service_role;
create trigger discard_consent_case_work after update or delete on public.account_privacy_settings
  for each row execute function private.discard_owner_case_work();
create trigger discard_access_case_work after update or delete on private.user_access
  for each row execute function private.discard_owner_case_work();
create trigger discard_auth_case_work after update of banned_until,deleted_at,is_anonymous on auth.users
  for each row execute function private.discard_owner_case_work();

-- The existing minute dispatcher also purges expired snapshots when processing
-- is paused. All dispatch/claim limits below are identical to the prior version.
create or replace function private.dispatch_case_analysis_jobs() returns integer
language plpgsql security definer set search_path='' as $$
declare w record; j public.case_analysis_jobs; v_url text; v_token text; v_count integer:=0;
begin
  delete from private.retained_case_work where expires_at<=now();
  select worker_url into v_url from private.case_analysis_config where singleton and enabled;
  for w in select x.* from private.case_analysis_work x join public.case_analysis_jobs q on q.id=x.job_id
    where q.status in ('queued','running') and (q.expires_at<=now() or
      (v_url is not null and x.available_at<=now() and coalesce(x.lease_until,'-infinity')<=now() and coalesce(x.dispatch_until,'-infinity')<=now()))
    order by q.created_at for update of x skip locked limit 4
  loop
    select * into j from public.case_analysis_jobs where id=w.job_id for update;
    if j.expires_at<=now() or w.attempts>=117 or w.steps>=114 or (j.status='running' and (w.failures>=1 or w.transport_retries>=3))
      or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then
      update public.case_analysis_jobs set status='failed',error_code='job_stopped',error_message='Der Auftrag konnte innerhalb seiner Freigabe und Laufzeit nicht abgeschlossen werden. Kein neues Ergebnis gespeichert.',finished_at=now(),updated_at=now() where id=j.id;
      update private.case_analysis_work set checkpoint=null,dispatch_hash=null,dispatch_until=null,lease=null,lease_until=null where job_id=j.id;
      continue;
    end if;
    v_token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
    update private.case_analysis_work set dispatch_hash=encode(sha256(convert_to(v_token,'UTF8')),'hex'),dispatch_until=now()+interval '2 minutes',
      lease=null,lease_until=null,failures=failures+case when j.status='running' then 1 else 0 end,
      transport_retries=transport_retries+case when j.status='running' then 1 else 0 end where job_id=j.id;
    update public.case_analysis_jobs set status='queued',updated_at=now() where id=j.id;
    perform net.http_post(url:=v_url,headers:='{"Content-Type":"application/json"}'::jsonb,
      body:=jsonb_build_object('job_id',j.id,'token',v_token),timeout_milliseconds:=10000);
    v_count:=v_count+1;
  end loop;
  return v_count;
end $$;
