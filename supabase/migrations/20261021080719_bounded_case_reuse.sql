-- Exact, dated discovery is encrypted draft work. Sources are fetched again.
-- Review/correction approvals remain excluded; no policy limits are increased.
alter table private.case_response_cache drop constraint case_response_cache_stage_check;
alter table private.case_response_cache add constraint case_response_cache_stage_check
  check(stage in ('planning','analysis_generation','generation','research','research_recovery'));

create or replace function private.save_case_response_cache(p_job_id uuid,p_lease uuid,p_cache_key text,p_stage text,p_response_id text,p_ciphertext text) returns boolean
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs;
begin
  if p_cache_key is null or p_cache_key!~'^[a-f0-9]{64}$' or p_ciphertext is null
    or length(p_ciphertext) not between 1 and 700000 or p_response_id is null or length(p_response_id) not between 1 and 128
    or p_stage is null or p_stage not in ('planning','analysis_generation','generation','research','research_recovery') then return false; end if;
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

create or replace function public.reserve_case_model_call(p_job_id uuid,p_lease uuid,p_output_tokens integer,p_request_bytes integer,p_search_calls integer,p_stage text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; p private.case_model_budget_policy;
  v_calls bigint; v_output bigint; v_bytes bigint; v_search bigint; v_input bigint; v_id uuid;
begin
  if p_output_tokens is null or p_output_tokens not between 1 and 22000
    or p_request_bytes is null or p_request_bytes not between 1 and 2000000
    or p_search_calls is null or p_search_calls not between 0 and 2
    or p_stage is null or p_stage not in ('planning','research','research_recovery','analysis_generation','generation','correction','review') then return null; end if;
  -- Recheck the operator stop at the last database boundary before spending.
  -- A lease claimed before the pause cannot authorize a new provider request.
  if not exists(select 1 from private.case_analysis_config where singleton and enabled) then
    return jsonb_build_object('limit','paused');
  end if;
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

