-- Group adjacent review sections without removing any required item audit.
-- v170 records one distinct provider approval per group; SQL independently
-- checks complete ordered coverage and the four-scope grouping contract.
-- Prior completed versions retain their original validation. No jobs, quotas,
-- spending policy, consent, leases, expiry or processing configuration change.

create or replace function private.case_analysis_review_coverage_valid(p_result jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare
  v_topics jsonb:=p_result#>'{analysis,topics}';
  v_calculations jsonb:=p_result#>'{analysis,calculations}';
  v_verification jsonb:=p_result#>'{analysis,verification}';
  v_expected jsonb:='[]'; v_ids jsonb; v_scope_ids jsonb; v_start integer;
  v_facts jsonb:=p_result->'facts'; v_questions jsonb:=p_result->'open_questions';
  v_steps jsonb:=p_result->'steps'; v_letters jsonb:=p_result->'letters';
  v_fact_indexes jsonb; v_question_indexes jsonb;
  v_groups jsonb; v_group jsonb; v_index jsonb; v_cursor integer:=0;
  v_required integer; v_scopes jsonb; v_group_scope text;
begin
  if jsonb_typeof(v_topics) is distinct from 'array' or jsonb_typeof(v_calculations) is distinct from 'array'
    or jsonb_typeof(v_verification->'review_response_ids') is distinct from 'array' then return false; end if;
  if jsonb_array_length(v_topics) not between 1 and 10 or jsonb_array_length(v_calculations)>24 then return false; end if;
  if exists(select 1 from jsonb_array_elements(v_topics||v_calculations) t(value)
    where jsonb_typeof(value->'id') is distinct from 'string' or length(trim(value->>'id'))=0)
    or (select count(distinct value->>'id') from jsonb_array_elements(v_topics) t(value))<>jsonb_array_length(v_topics)
    or (select count(distinct value->>'id') from jsonb_array_elements(v_calculations) t(value))<>jsonb_array_length(v_calculations)
    then return false; end if;
  for v_start in 0..((jsonb_array_length(v_topics)-1)/3) loop
    select coalesce(jsonb_agg(value->'id' order by ord),'[]') into v_scope_ids
      from jsonb_array_elements(v_topics) with ordinality t(value,ord) where ord>v_start*3 and ord<=(v_start+1)*3;
    v_expected:=v_expected||jsonb_build_array(jsonb_build_object('scope','analysis','topic_ids',v_scope_ids,'calculation_ids','[]'::jsonb));
  end loop;
  for v_start in 0..greatest(0,(jsonb_array_length(v_calculations)-1)/6) loop
    select coalesce(jsonb_agg(value->'id' order by ord),'[]') into v_scope_ids
      from jsonb_array_elements(v_calculations) with ordinality t(value,ord) where ord>v_start*6 and ord<=(v_start+1)*6;
    v_expected:=v_expected||jsonb_build_array(jsonb_build_object('scope','calculations','topic_ids','[]'::jsonb,'calculation_ids',v_scope_ids));
  end loop;
  if v_verification->>'version' in ('v168','v170') then
    if jsonb_typeof(v_facts) is distinct from 'array' or jsonb_typeof(v_questions) is distinct from 'array'
      or jsonb_typeof(v_steps) is distinct from 'array' or jsonb_typeof(v_letters) is distinct from 'array' then return false; end if;
    if jsonb_array_length(v_facts)>24 or jsonb_array_length(v_questions)>24
      or jsonb_array_length(v_steps) not between 1 and 12 or jsonb_array_length(v_letters)>6 then return false; end if;
    if exists(select 1 from jsonb_array_elements(v_steps||v_letters) t(value)
      where jsonb_typeof(value->'id') is distinct from 'string' or length(trim(value->>'id'))=0)
      or (select count(distinct value->>'id') from jsonb_array_elements(v_steps) t(value))<>jsonb_array_length(v_steps)
      or (select count(distinct value->>'id') from jsonb_array_elements(v_letters) t(value))<>jsonb_array_length(v_letters) then return false; end if;
    v_expected:=v_expected||jsonb_build_array(jsonb_build_object('scope','roadmap','topic_ids','[]'::jsonb,'calculation_ids','[]'::jsonb,
      'part','overview','fact_indexes','[]'::jsonb,'question_indexes','[]'::jsonb,'step_ids','[]'::jsonb));
    if greatest(jsonb_array_length(v_facts),jsonb_array_length(v_questions))>0 then
      for v_start in 0..((greatest(jsonb_array_length(v_facts),jsonb_array_length(v_questions))-1)/4) loop
        select coalesce(jsonb_agg(i order by i),'[]') into v_fact_indexes from generate_series(v_start*4,least((v_start+1)*4,jsonb_array_length(v_facts))-1) i;
        select coalesce(jsonb_agg(i order by i),'[]') into v_question_indexes from generate_series(v_start*4,least((v_start+1)*4,jsonb_array_length(v_questions))-1) i;
        v_expected:=v_expected||jsonb_build_array(jsonb_build_object('scope','roadmap','topic_ids','[]'::jsonb,'calculation_ids','[]'::jsonb,
          'part','records','fact_indexes',v_fact_indexes,'question_indexes',v_question_indexes,'step_ids','[]'::jsonb));
      end loop;
    end if;
    for v_start in 0..((jsonb_array_length(v_steps)-1)/3) loop
      select coalesce(jsonb_agg(value->'id' order by ord),'[]') into v_scope_ids
        from jsonb_array_elements(v_steps) with ordinality t(value,ord) where ord>v_start*3 and ord<=(v_start+1)*3;
      v_expected:=v_expected||jsonb_build_array(jsonb_build_object('scope','roadmap','topic_ids','[]'::jsonb,'calculation_ids','[]'::jsonb,
        'part','steps','fact_indexes','[]'::jsonb,'question_indexes','[]'::jsonb,'step_ids',v_scope_ids));
    end loop;
    for v_start in 0..greatest(0,jsonb_array_length(v_letters)-1) loop
      select coalesce(jsonb_agg(value->'id' order by ord),'[]') into v_scope_ids
        from jsonb_array_elements(v_letters) with ordinality t(value,ord) where ord=v_start+1;
      v_expected:=v_expected||jsonb_build_array(jsonb_build_object('scope','letters','topic_ids','[]'::jsonb,'calculation_ids','[]'::jsonb,'letter_ids',v_scope_ids));
    end loop;
  else
    -- Previously completed versions keep their original coverage contract.
    v_expected:=v_expected||'[{"scope":"roadmap","topic_ids":[],"calculation_ids":[]},{"scope":"letters","topic_ids":[],"calculation_ids":[]}]'::jsonb;
  end if;
  v_required:=jsonb_array_length(v_expected);
  select jsonb_agg(value->'scope') into v_scopes from jsonb_array_elements(v_expected) r(value);
  if v_verification->>'version'='v170' then
    v_groups:=v_verification->'review_groups'; v_scopes:='[]';
    if jsonb_typeof(v_groups) is distinct from 'array' then return false; end if;
    if jsonb_array_length(v_groups) not between 1 and v_required then return false; end if;
    for v_group in select value from jsonb_array_elements(v_groups) loop
      if jsonb_typeof(v_group) is distinct from 'array' then return false; end if;
      if jsonb_array_length(v_group) not between 1 and 4 then return false; end if;
      v_group_scope:=v_expected->v_cursor->>'scope';
      for v_index in select value from jsonb_array_elements(v_group) loop
        -- Every required section appears exactly once, in its original order.
        -- No scalar, gap, duplicate, mixed scope or invented index is accepted.
        if v_cursor>=v_required or v_index is distinct from to_jsonb(v_cursor)
          or v_expected->v_cursor->>'scope' is distinct from v_group_scope then return false; end if;
        v_cursor:=v_cursor+1;
      end loop;
      v_scopes:=v_scopes||jsonb_build_array(v_group_scope);
    end loop;
    if v_cursor<>v_required then return false; end if;
    v_required:=jsonb_array_length(v_groups);
    if v_verification->'review_response_id' is distinct from (v_verification->'review_response_ids'->-1) then return false; end if;
  end if;
  v_ids:=v_verification->'review_response_ids';
  if jsonb_array_length(v_ids)<>v_required
    or exists(select 1 from jsonb_array_elements(v_ids) r(value) where jsonb_typeof(value) is distinct from 'string' or length(trim(value#>>'{}'))=0)
    or (select count(distinct value) from jsonb_array_elements(v_ids) r(value))<>v_required
    then return false; end if;
  return coalesce(v_verification->'review_coverage'=v_expected and v_verification->'review_scopes'=v_scopes,false);
end $$;
revoke all on function private.case_analysis_review_coverage_valid(jsonb) from public,anon,authenticated;

create or replace function private.finish_case_analysis_job(p_job_id uuid,p_lease uuid,p_outcome jsonb) returns jsonb
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
      or (case
        when p_outcome#>>'{result,analysis,verification,version}'='v157' then jsonb_array_length(p_outcome#>'{result,analysis,verification,review_response_ids}')<>3
        when p_outcome#>>'{result,analysis,verification,version}' in ('v160','v161') then jsonb_array_length(p_outcome#>'{result,analysis,verification,review_response_ids}')<>4
          or p_outcome#>'{result,analysis,verification,review_scopes}' is distinct from '["analysis","calculations","roadmap","letters"]'::jsonb
          or exists(select 1 from jsonb_array_elements(p_outcome#>'{result,analysis,verification,review_response_ids}') r(value)
            where jsonb_typeof(value)<>'string' or length(trim(value#>>'{}'))=0)
          or (select count(distinct value) from jsonb_array_elements(p_outcome#>'{result,analysis,verification,review_response_ids}') r(value))<>4
        when p_outcome#>>'{result,analysis,verification,version}' in ('v162','v163','v164','v168','v170') then not private.case_analysis_review_coverage_valid(p_outcome->'result')
        else true end)
      then raise exception 'Invalid reviewed result'; end if;
    insert into public.case_roadmaps(id,owner_id,case_id,output_language,reference_language,style,result,source_fingerprint,source_documents,model,workflow_version)
      values(j.id,j.owner_id,j.case_id,w.request->>'output_language',w.request->>'reference_language',w.request->'style',p_outcome->'result',j.source_fingerprint,p_outcome->'source_documents',p_outcome->>'model',p_outcome->>'workflow_version') on conflict(id) do nothing;
    update public.case_analysis_jobs set status='completed',stage='completed',roadmap_id=id,updated_at=now(),finished_at=now() where id=j.id returning * into j;
  elsif v_status='processing' and w.steps<113 and p_outcome->>'checkpoint' is not null and p_outcome->>'stage' in ('planning','research','generation','review','correction') then
    update public.case_analysis_jobs set status='queued',stage=p_outcome->>'stage',updated_at=now() where id=j.id returning * into j;
    update private.case_analysis_work set checkpoint=p_outcome->>'checkpoint',steps=steps+1,failures=0,available_at=now(),lease=null,lease_until=null where job_id=j.id;
    return to_jsonb(j);
  elsif v_status='failed' and p_outcome->>'retry'='true' and w.failures<1 and w.transport_retries<3 and w.attempts<117 and j.expires_at>now()
    and (p_outcome->>'code' in ('provider_network','provider_timeout','provider_response_format')
      or (p_outcome->>'code'='provider_http' and p_outcome->'provider_status' in ('500'::jsonb,'502'::jsonb,'503'::jsonb,'504'::jsonb)))
    and (p_outcome->>'retry_after' is null or (jsonb_typeof(p_outcome->'retry_after')='number'
      and (p_outcome->>'retry_after')::numeric between 0 and 86400
      and j.expires_at>now()+make_interval(secs=>greatest(30,(p_outcome->>'retry_after')::double precision)))) then
    update private.case_analysis_work set failures=failures+1,transport_retries=transport_retries+1,available_at=now()+make_interval(secs=>greatest(30,coalesce((p_outcome->>'retry_after')::double precision,30))),lease=null,lease_until=null where job_id=j.id;
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
