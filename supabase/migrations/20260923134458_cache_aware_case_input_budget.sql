-- Account for provider-confirmed cache READS, not cache writes or predicted hits.
-- 1 cached token consumes 0.1 units, rounded up per request; other input costs
-- 1 unit. GPT-5.6 Sol cached/input pricing is 0.1 in both context tiers, and
-- cached/cache-write pricing is 0.08 (official pricing checked 2026-09-23).
-- This remains a resource stop, not an invoice guarantee. Raw usage is retained.
alter table private.case_model_budget_policy rename column max_input_tokens to max_input_units;
alter table private.case_model_calls add column input_units bigint generated always as
  (coalesce(input_tokens-cached_tokens+(cached_tokens+9)/10,request_bytes)) stored;
comment on column private.case_model_budget_policy.max_input_units is 'Reported non-cached input plus ceiling(cached reads / 10); unknown requests retain request bytes. Same numerical allowances; no invoice guarantee.';
comment on column private.case_model_calls.input_units is 'Derived only from settled provider usage, otherwise conservative request-byte reservation. Raw input_tokens and cached_tokens remain separately auditable.';

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
  if not found or w.lease is null or w.lease is distinct from p_lease or w.lease_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if not found or j.status<>'running' or j.expires_at<=now()
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  if exists(select 1 from private.case_model_calls where job_id=p_job_id and lease=p_lease) then return null; end if;
  if (select count(*) from private.case_model_budget_policy)<>3 then return null; end if;
  -- Serialize all reservations, including separate owners and concurrent jobs.
  for p in select * from private.case_model_budget_policy order by scope for update loop
    select count(*),coalesce(sum(charged_output_tokens),0),coalesce(sum(request_bytes),0),coalesce(sum(search_calls),0),coalesce(sum(input_units),0)
      into v_calls,v_output,v_bytes,v_search,v_input from private.case_model_calls
      where (p.scope='job' and job_id=p_job_id)
        or (p.scope='owner' and owner_id=j.owner_id and created_at>=now()-interval '24 hours')
        or (p.scope='global' and created_at>=now()-interval '24 hours');
    if v_calls+1>p.max_calls or v_output+p_output_tokens>p.max_output_tokens
      or v_bytes+p_request_bytes>p.max_request_bytes or v_search+p_search_calls>p.max_search_calls
      or v_input>=p.max_input_units then return jsonb_build_object('limit',p.scope); end if;
  end loop;
  insert into private.case_model_calls(job_id,owner_id,lease,stage,reserved_output_tokens,charged_output_tokens,request_bytes,search_calls)
    values(j.id,j.owner_id,p_lease,p_stage,p_output_tokens,p_output_tokens,p_request_bytes,p_search_calls) returning id into v_id;
  return jsonb_build_object('reservation_id',v_id);
end $$;

-- CREATE OR REPLACE preserves the existing signature, owner and service-role-only grants.
-- No job is restarted, no ledger row is removed, and no other limit is raised.
