-- Reuse only successfully validated generation responses. This is encrypted
-- draft storage, not a review approval, entitlement, budget refund or new job.
create table private.case_response_cache (
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  cache_key text not null check(cache_key ~ '^[a-f0-9]{64}$'),
  source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
  origin_job_id uuid not null references public.case_analysis_jobs(id) on delete cascade,
  response_id text not null check(length(response_id) between 1 and 128),
  stage text not null check(stage in ('planning','analysis_generation','generation')),
  ciphertext text not null check(length(ciphertext) between 1 and 700000),
  saved_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '24 hours',
  primary key(owner_id,case_id,cache_key),
  check(expires_at>saved_at and expires_at<=saved_at+interval '24 hours')
);
create index case_response_cache_expiry on private.case_response_cache(expires_at);
create index case_response_cache_origin on private.case_response_cache(origin_job_id);
create index case_response_cache_case on private.case_response_cache(case_id);
alter table private.case_response_cache enable row level security;
revoke all on private.case_response_cache from public,anon,authenticated,service_role;

-- Machine-only RPCs: the current one-use lease and current owner/case access
-- are checked in addition to the service-role grant. End users cannot call them.
create function private.read_case_response_cache(p_job_id uuid,p_lease uuid,p_cache_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; v_result jsonb;
begin
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'running' or j.expires_at<=now() or p_cache_key is null or p_cache_key!~'^[a-f0-9]{64}$'
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  select jsonb_build_object('ciphertext',s.ciphertext,'origin_job_id',s.origin_job_id,'response_id',s.response_id) into v_result
    from private.case_response_cache s
    where s.owner_id=j.owner_id and s.case_id=j.case_id and s.cache_key=p_cache_key
      and s.source_fingerprint=j.source_fingerprint and s.expires_at>now();
  return coalesce(v_result,'{}'::jsonb);
end $$;

create function private.save_case_response_cache(p_job_id uuid,p_lease uuid,p_cache_key text,p_stage text,p_response_id text,p_ciphertext text) returns boolean
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs;
begin
  if p_cache_key is null or p_cache_key!~'^[a-f0-9]{64}$' or p_ciphertext is null
    or length(p_ciphertext) not between 1 and 700000 or p_response_id is null or length(p_response_id) not between 1 and 128
    or p_stage is null or p_stage not in ('planning','analysis_generation','generation') then return false; end if;
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return false; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'running' or j.expires_at<=now()
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return false; end if;
  -- An existing settled provider receipt proves the origin; a cached replay
  -- cannot create a new bill, refund, receipt, or extend its retention lifetime.
  if not exists(select 1 from private.case_model_calls c where c.job_id=j.id and c.lease=p_lease
    and c.stage=p_stage and c.settled_at is not null and c.billing_receipt->>'response_id'=p_response_id
    and c.billing_receipt->>'response_status'='completed') then return false; end if;
  delete from private.case_response_cache where owner_id=j.owner_id and case_id=j.case_id and expires_at<=now();
  insert into private.case_response_cache(owner_id,case_id,cache_key,source_fingerprint,origin_job_id,response_id,stage,ciphertext)
    values(j.owner_id,j.case_id,p_cache_key,j.source_fingerprint,j.id,p_response_id,p_stage,p_ciphertext)
    on conflict(owner_id,case_id,cache_key) do nothing;
  delete from private.case_response_cache s where s.owner_id=j.owner_id and s.case_id=j.case_id and s.cache_key in
    (select x.cache_key from private.case_response_cache x where x.owner_id=j.owner_id and x.case_id=j.case_id order by x.saved_at desc,x.cache_key offset 48);
  return true;
end $$;

create function public.read_case_response_cache(p_job_id uuid,p_lease uuid,p_cache_key text) returns jsonb
language sql security invoker set search_path='' as $$select private.read_case_response_cache(p_job_id,p_lease,p_cache_key)$$;
create function public.save_case_response_cache(p_job_id uuid,p_lease uuid,p_cache_key text,p_stage text,p_response_id text,p_ciphertext text) returns boolean
language sql security invoker set search_path='' as $$select private.save_case_response_cache(p_job_id,p_lease,p_cache_key,p_stage,p_response_id,p_ciphertext)$$;
revoke all on function private.read_case_response_cache(uuid,uuid,text),public.read_case_response_cache(uuid,uuid,text) from public,anon,authenticated;
revoke all on function private.save_case_response_cache(uuid,uuid,text,text,text,text),public.save_case_response_cache(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function private.read_case_response_cache(uuid,uuid,text),public.read_case_response_cache(uuid,uuid,text) to service_role;
grant execute on function private.save_case_response_cache(uuid,uuid,text,text,text,text),public.save_case_response_cache(uuid,uuid,text,text,text,text) to service_role;

create function private.discard_owner_case_response_cache() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_owner uuid;
begin
  if tg_op='UPDATE' and tg_table_name='account_privacy_settings'
    and (to_jsonb(old)-'updated_at') is not distinct from (to_jsonb(new)-'updated_at') then return null; end if;
  v_owner:=case tg_table_name when 'account_privacy_settings' then (to_jsonb(old)->>'owner_id')::uuid
    when 'user_access' then (to_jsonb(old)->>'user_id')::uuid else (to_jsonb(old)->>'id')::uuid end;
  delete from private.case_response_cache where owner_id=v_owner;
  return null;
end $$;
revoke all on function private.discard_owner_case_response_cache() from public,anon,authenticated,service_role;
create trigger discard_consent_case_response_cache after update or delete on public.account_privacy_settings
  for each row execute function private.discard_owner_case_response_cache();
create trigger discard_access_case_response_cache after update or delete on private.user_access
  for each row execute function private.discard_owner_case_response_cache();
create trigger discard_auth_case_response_cache after update of banned_until,deleted_at,is_anonymous on auth.users
  for each row execute function private.discard_owner_case_response_cache();

create function private.discard_finished_case_response_cache() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('completed','cancelled') or (new.status='failed' and
    not private.case_analysis_allowed(new.owner_id,new.case_id,
      coalesce((select (request->>'draft_letters')::boolean from private.case_analysis_work where job_id=new.id),true))) then
    delete from private.case_response_cache where owner_id=new.owner_id and case_id=new.case_id;
  end if;
  return null;
end $$;
revoke all on function private.discard_finished_case_response_cache() from public,anon,authenticated,service_role;
create trigger discard_finished_case_response_cache after update of status on public.case_analysis_jobs
  for each row execute function private.discard_finished_case_response_cache();

-- Preserve all dispatch limits. Purge expired cached responses even while paused.
create or replace function private.dispatch_case_analysis_jobs() returns integer
language plpgsql security definer set search_path='' as $$
declare w record; j public.case_analysis_jobs; v_url text; v_token text; v_count integer:=0;
begin
  delete from private.retained_case_work where expires_at<=now();
  delete from private.case_response_cache where expires_at<=now();
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
