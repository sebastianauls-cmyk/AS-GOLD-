-- Reserve the complete existing per-job resource envelope before dispatch.
-- No allowance is increased. Waiting uses no model calls and lasts at most
-- 24 hours; admitted processing retains its fixed one-hour execution lifetime.
alter table private.case_analysis_work add column capacity jsonb;
alter table private.case_analysis_work add column execution_started_at timestamptz;
alter table private.case_analysis_work add constraint case_capacity_shape check
  ((capacity is null and execution_started_at is null) or
   (jsonb_typeof(capacity)='object' and execution_started_at is not null));

-- Preserve any already-started job and its original checkpoint lifetime.
update private.case_analysis_work w set capacity=to_jsonb(p)-'scope',execution_started_at=j.created_at
from public.case_analysis_jobs j,private.case_model_budget_policy p
where j.id=w.job_id and j.status in ('queued','running') and p.scope='job'
  and (w.attempts>0 or w.checkpoint is not null or exists(select 1 from private.case_model_calls c where c.job_id=j.id));

create function private.prepare_case_capacity_wait() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.case_analysis_jobs set stage='capacity',expires_at=created_at+interval '24 hours' where id=new.job_id;
  return new;
end $$;
revoke all on function private.prepare_case_capacity_wait() from public,anon,authenticated,service_role;
create trigger case_capacity_wait before insert on private.case_analysis_work
for each row execute function private.prepare_case_capacity_wait();

-- Called while holding the same three policy-row locks used by reservations
-- and settlements. Reads do not lock other jobs, avoiding inverted lock order.
-- Existing charges survive deletion. Holds cover only the unused balance of
-- active admitted jobs and are released by completion/cancellation/expiry.
create function private.case_capacity_usage(p_scope text,p_owner uuid,p_job uuid default null)
returns table(calls bigint,output_tokens bigint,request_bytes bigint,search_calls bigint,input_units bigint)
language sql stable set search_path='' as $$
  with spent as (
    select count(*)::bigint as calls,coalesce(sum(c.charged_output_tokens),0)::bigint as output_tokens,
      coalesce(sum(c.request_bytes),0)::bigint as request_bytes,coalesce(sum(c.search_calls),0)::bigint as search_calls,
      coalesce(sum(c.input_units),0)::bigint as input_units
    from private.case_model_calls c
    where (p_scope='job' and c.job_id=p_job)
      or (p_scope in ('owner','global') and c.created_at>=now()-interval '24 hours' and (p_scope='global' or c.owner_id=p_owner))
  ), held as (
    select coalesce(sum(greatest((w.capacity->>'max_calls')::bigint-u.calls,0)),0)::bigint as calls,
      coalesce(sum(greatest((w.capacity->>'max_output_tokens')::bigint-u.output_tokens,0)),0)::bigint as output_tokens,
      coalesce(sum(greatest((w.capacity->>'max_request_bytes')::bigint-u.request_bytes,0)),0)::bigint as request_bytes,
      coalesce(sum(greatest((w.capacity->>'max_search_calls')::bigint-u.search_calls,0)),0)::bigint as search_calls,
      coalesce(sum(greatest((w.capacity->>'max_input_units')::bigint-u.input_units,0)),0)::bigint as input_units
    from private.case_analysis_work w join public.case_analysis_jobs j on j.id=w.job_id
    cross join lateral (
      select count(*) as calls,coalesce(sum(c.charged_output_tokens),0) as output_tokens,
        coalesce(sum(c.request_bytes),0) as request_bytes,coalesce(sum(c.search_calls),0) as search_calls,
        coalesce(sum(c.input_units),0) as input_units from private.case_model_calls c where c.job_id=j.id
    ) u
    where p_scope in ('owner','global') and w.capacity is not null and j.status in ('queued','running')
      and j.expires_at>now() and j.id is distinct from p_job and (p_scope='global' or j.owner_id=p_owner)
  ) select s.calls+h.calls,s.output_tokens+h.output_tokens,s.request_bytes+h.request_bytes,
      s.search_calls+h.search_calls,s.input_units+h.input_units from spent s cross join held h
$$;
revoke all on function private.case_capacity_usage(text,uuid,uuid) from public,anon,authenticated,service_role;

create function private.admit_case_capacity(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work;j public.case_analysis_jobs;p private.case_model_budget_policy;
  envelope private.case_model_budget_policy;u record;
begin
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found then return false;end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if not found or j.status not in ('queued','running') or j.expires_at<=now()
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return false;end if;
  if w.capacity is not null then return true;end if;
  if w.attempts<>0 or w.steps<>0 or w.checkpoint is not null then return false;end if;
  perform 1 from private.case_model_budget_policy order by scope for update;
  if (select count(*) from private.case_model_budget_policy)<>3 then return false;end if;
  select * into envelope from private.case_model_budget_policy where scope='job';
  for p in select * from private.case_model_budget_policy where scope<>'job' order by scope loop
    select * into u from private.case_capacity_usage(p.scope,j.owner_id);
    if u.calls+envelope.max_calls>p.max_calls or u.output_tokens+envelope.max_output_tokens>p.max_output_tokens
      or u.request_bytes+envelope.max_request_bytes>p.max_request_bytes or u.search_calls+envelope.max_search_calls>p.max_search_calls
      or u.input_units+envelope.max_input_units>p.max_input_units then return false;end if;
  end loop;
  update private.case_analysis_work set capacity=to_jsonb(envelope)-'scope',execution_started_at=now() where job_id=j.id;
  update public.case_analysis_jobs set stage='planning',expires_at=now()+interval '1 hour',updated_at=now() where id=j.id;
  return true;
end $$;
revoke all on function private.admit_case_capacity(uuid) from public,anon,authenticated,service_role;


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
    order by (x.capacity is not null) desc,q.created_at,q.id for update of x skip locked limit 200
  loop
    select * into j from public.case_analysis_jobs where id=w.job_id for update;
    if j.expires_at<=now() or w.attempts>=117 or w.steps>=114 or (j.status='running' and (w.failures>=1 or w.transport_retries>=3))
      or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then
      update public.case_analysis_jobs set status='failed',error_code='job_stopped',error_message='Der Auftrag konnte innerhalb seiner Freigabe und Laufzeit nicht abgeschlossen werden. Kein neues Ergebnis gespeichert.',finished_at=now(),updated_at=now() where id=j.id;
      update private.case_analysis_work set checkpoint=null,dispatch_hash=null,dispatch_until=null,lease=null,lease_until=null where job_id=j.id;
      continue;
    end if;
    if v_count>=4 then exit;end if;
    if not private.admit_case_capacity(j.id) then
      update public.case_analysis_jobs set stage='capacity' where id=j.id and stage<>'capacity';
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

create or replace function private.claim_case_analysis_job(p_job_id uuid,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; v_lease uuid;
begin
  if p_token is null or p_token!~'^[a-f0-9]{64}$' then return null; end if;
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.dispatch_hash is distinct from encode(sha256(convert_to(p_token,'UTF8')),'hex') or w.dispatch_until is null or w.dispatch_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if w.capacity is null or w.execution_started_at is null or j.status<>'queued' or j.expires_at<=now() or w.attempts>=117 or w.steps>=114
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  v_lease:=gen_random_uuid();
  update private.case_analysis_work set dispatch_hash=null,dispatch_until=null,lease=v_lease,lease_until=now()+interval '5 minutes',attempts=attempts+1 where job_id=j.id;
  update public.case_analysis_jobs set status='running',started_at=coalesce(started_at,now()),updated_at=now() where id=j.id;
  return to_jsonb(j)||jsonb_build_object('request',w.request,'checkpoint',w.checkpoint,'lease',v_lease,'checkpoint_issued_at',w.execution_started_at);
end $$;

create or replace function public.reserve_case_model_call(p_job_id uuid,p_lease uuid,p_output_tokens integer,p_request_bytes integer,p_search_calls integer,p_stage text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; p private.case_model_budget_policy;
  v_calls bigint; v_output bigint; v_bytes bigint; v_search bigint; v_input bigint; v_id uuid;
begin
  if p_output_tokens is null or p_output_tokens not between 1 and 22000
    or p_request_bytes is null or p_request_bytes not between 1 and 2000000
    or p_search_calls is null or p_search_calls not between 0 and 2
    or p_stage is null or p_stage not in ('planning','research','research_recovery','analysis_generation','generation','correction','review') then return null; end if;
  -- Same lock order as claim/finish/cancel. Check authorization again immediately
  -- before dispatch, including cancellation during source loading.
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.capacity is null or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if not found or j.status<>'running' or j.expires_at<=now()
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  if exists(select 1 from private.case_model_calls where job_id=p_job_id and lease=p_lease) then return null; end if;
  if (select count(*) from private.case_model_budget_policy)<>3 then return null; end if;
  -- Serialize all reservations, including separate owners and concurrent jobs.
  for p in select * from private.case_model_budget_policy order by scope for update loop
    if p.scope='job' then
      p.max_calls:=least(p.max_calls,(w.capacity->>'max_calls')::integer);
      p.max_output_tokens:=least(p.max_output_tokens,(w.capacity->>'max_output_tokens')::bigint);
      p.max_request_bytes:=least(p.max_request_bytes,(w.capacity->>'max_request_bytes')::bigint);
      p.max_search_calls:=least(p.max_search_calls,(w.capacity->>'max_search_calls')::integer);
      p.max_input_units:=least(p.max_input_units,(w.capacity->>'max_input_units')::bigint);
    end if;
    select calls,output_tokens,request_bytes,search_calls,input_units
      into v_calls,v_output,v_bytes,v_search,v_input from private.case_capacity_usage(p.scope,j.owner_id,j.id);
    if v_calls+1>p.max_calls or v_output+p_output_tokens>p.max_output_tokens
      or v_bytes+p_request_bytes>p.max_request_bytes or v_search+p_search_calls>p.max_search_calls
      or v_input+p_request_bytes>p.max_input_units then return jsonb_build_object('limit',p.scope); end if;
  end loop;
  insert into private.case_model_calls(job_id,owner_id,lease,stage,reserved_output_tokens,charged_output_tokens,request_bytes,search_calls)
    values(j.id,j.owner_id,p_lease,p_stage,p_output_tokens,p_output_tokens,p_request_bytes,p_search_calls) returning id into v_id;
  return jsonb_build_object('reservation_id',v_id);
end $$;

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
  select * into j from public.case_analysis_jobs where id=j.id;
  return to_jsonb(j);
end $$;
