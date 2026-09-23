-- Resource limits, not a currency quote. Unknown/failed requests keep their
-- maximum output reservation. Owner/global daily limits survive case deletion.
create table private.case_model_budget_policy (
  scope text primary key check(scope in ('job','owner','global')),
  max_calls integer not null check(max_calls>0),
  max_output_tokens bigint not null check(max_output_tokens>0),
  max_request_bytes bigint not null check(max_request_bytes>0),
  max_search_calls integer not null check(max_search_calls>=0),
  max_input_tokens bigint not null check(max_input_tokens>0)
);
insert into private.case_model_budget_policy values
  ('job',40,60000,6000000,12,600000),
  ('owner',80,120000,12000000,24,1200000),
  ('global',120,180000,18000000,36,1800000);

create table private.case_model_calls (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  owner_id uuid references auth.users(id) on delete set null,
  lease uuid not null,
  stage text not null,
  reserved_output_tokens integer not null check(reserved_output_tokens between 1 and 22000),
  charged_output_tokens integer not null check(charged_output_tokens between 0 and 22000),
  request_bytes integer not null check(request_bytes between 1 and 2000000),
  search_calls integer not null check(search_calls between 0 and 2),
  input_tokens bigint check(input_tokens>=0),
  cached_tokens bigint check(cached_tokens>=0 and cached_tokens<=input_tokens),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique(job_id,lease),
  check(charged_output_tokens<=reserved_output_tokens)
);
create index case_model_calls_daily on private.case_model_calls(created_at);
create index case_model_calls_owner_daily on private.case_model_calls(owner_id,created_at);
alter table private.case_model_budget_policy enable row level security;
alter table private.case_model_calls enable row level security;
revoke all on private.case_model_budget_policy,private.case_model_calls from public,anon,authenticated,service_role;

create function public.reserve_case_model_call(p_job_id uuid,p_lease uuid,p_output_tokens integer,p_request_bytes integer,p_search_calls integer,p_stage text) returns jsonb
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
    select count(*),coalesce(sum(charged_output_tokens),0),coalesce(sum(request_bytes),0),coalesce(sum(search_calls),0),coalesce(sum(input_tokens),0)
      into v_calls,v_output,v_bytes,v_search,v_input from private.case_model_calls
      where (p.scope='job' and job_id=p_job_id)
        or (p.scope='owner' and owner_id=j.owner_id and created_at>=now()-interval '24 hours')
        or (p.scope='global' and created_at>=now()-interval '24 hours');
    if v_calls+1>p.max_calls or v_output+p_output_tokens>p.max_output_tokens
      or v_bytes+p_request_bytes>p.max_request_bytes or v_search+p_search_calls>p.max_search_calls
      or v_input>=p.max_input_tokens then return jsonb_build_object('limit',p.scope); end if;
  end loop;
  insert into private.case_model_calls(job_id,owner_id,lease,stage,reserved_output_tokens,charged_output_tokens,request_bytes,search_calls)
    values(j.id,j.owner_id,p_lease,p_stage,p_output_tokens,p_output_tokens,p_request_bytes,p_search_calls) returning id into v_id;
  return jsonb_build_object('reservation_id',v_id);
end $$;

create function public.settle_case_model_call(p_job_id uuid,p_lease uuid,p_reservation_id uuid,p_input_tokens bigint,p_output_tokens integer,p_cached_tokens bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare c private.case_model_calls;
begin
  if p_input_tokens is null or p_output_tokens is null or p_cached_tokens is null
    or p_input_tokens<0 or p_output_tokens<0 or p_cached_tokens<0 or p_cached_tokens>p_input_tokens then return false; end if;
  -- No job writes: an in-flight response can settle after cancellation, but can
  -- never restart work, restore consent or save an unreviewed result.
  perform 1 from private.case_model_budget_policy order by scope for update;
  select * into c from private.case_model_calls where id=p_reservation_id and job_id=p_job_id and lease=p_lease for update;
  if not found or p_output_tokens>c.reserved_output_tokens then return false; end if;
  if c.settled_at is not null then return c.input_tokens=p_input_tokens and c.charged_output_tokens=p_output_tokens and c.cached_tokens=p_cached_tokens; end if;
  update private.case_model_calls set charged_output_tokens=p_output_tokens,input_tokens=p_input_tokens,cached_tokens=p_cached_tokens,settled_at=now() where id=c.id;
  return true;
end $$;
revoke all on function public.reserve_case_model_call(uuid,uuid,integer,integer,integer,text),public.settle_case_model_call(uuid,uuid,uuid,bigint,integer,bigint) from public,anon,authenticated;
grant execute on function public.reserve_case_model_call(uuid,uuid,integer,integer,integer,text),public.settle_case_model_call(uuid,uuid,uuid,bigint,integer,bigint) to service_role;
comment on table private.case_model_calls is 'Content-free usage and conservative reservations. No prompts, model output, documents, provider messages or API keys. Case deletion does not refund spent resources.';
