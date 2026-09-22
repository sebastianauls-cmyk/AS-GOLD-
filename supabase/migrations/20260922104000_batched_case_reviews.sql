-- Split high-effort topic/calculation audits into bounded durable batches.
-- Maximum: 1 planning + 5 research + 3 initial generation + 10 reviews +
-- 2 corrected generation + 10 final reviews = 31 successful model stages.
-- One transport retry fits the 32-claim cap. Fixed 45-minute TTL is unchanged.
alter table private.case_analysis_work drop constraint case_analysis_work_attempts_check;
alter table private.case_analysis_work add constraint case_analysis_work_attempts_check check(attempts between 0 and 32);

create or replace function private.case_analysis_review_coverage_valid(p_result jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare
  v_topics jsonb:=p_result#>'{analysis,topics}';
  v_calculations jsonb:=p_result#>'{analysis,calculations}';
  v_verification jsonb:=p_result#>'{analysis,verification}';
  v_expected jsonb:='[]'; v_ids jsonb; v_scope_ids jsonb; v_start integer;
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
  v_expected:=v_expected||'[{"scope":"roadmap","topic_ids":[],"calculation_ids":[]},{"scope":"letters","topic_ids":[],"calculation_ids":[]}]'::jsonb;
  v_ids:=v_verification->'review_response_ids';
  if jsonb_array_length(v_ids)<>jsonb_array_length(v_expected)
    or exists(select 1 from jsonb_array_elements(v_ids) r(value) where jsonb_typeof(value) is distinct from 'string' or length(trim(value#>>'{}'))=0)
    or (select count(distinct value) from jsonb_array_elements(v_ids) r(value))<>jsonb_array_length(v_expected)
    then return false; end if;
  return coalesce(v_verification->'review_coverage'=v_expected and v_verification->'review_scopes'=(select jsonb_agg(value->'scope') from jsonb_array_elements(v_expected) r(value)),false);
end $$;
revoke all on function private.case_analysis_review_coverage_valid(jsonb) from public,anon,authenticated;

alter table private.case_analysis_work drop constraint case_analysis_work_steps_check;
alter table private.case_analysis_work add constraint case_analysis_work_steps_check check(steps between 0 and 31);

create or replace function private.dispatch_case_analysis_jobs() returns integer
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
    if j.expires_at<=now() or w.attempts>=32 or w.steps>=31 or (j.status='running' and w.failures>=1)
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

create or replace function private.claim_case_analysis_job(p_job_id uuid,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.case_analysis_work; j public.case_analysis_jobs; v_lease uuid;
begin
  if p_token is null or p_token!~'^[a-f0-9]{64}$' then return null; end if;
  select * into w from private.case_analysis_work where job_id=p_job_id for update;
  if not found or w.dispatch_hash is distinct from encode(sha256(convert_to(p_token,'UTF8')),'hex') or w.dispatch_until is null or w.dispatch_until<=now() then return null; end if;
  select * into j from public.case_analysis_jobs where id=p_job_id for update;
  if j.status<>'queued' or j.expires_at<=now() or w.attempts>=32 or w.steps>=31
    or not private.case_analysis_allowed(j.owner_id,j.case_id,(w.request->>'draft_letters')::boolean) then return null; end if;
  v_lease:=gen_random_uuid();
  update private.case_analysis_work set dispatch_hash=null,dispatch_until=null,lease=v_lease,lease_until=now()+interval '5 minutes',attempts=attempts+1 where job_id=j.id;
  update public.case_analysis_jobs set status='running',started_at=coalesce(started_at,now()),updated_at=now() where id=j.id;
  return to_jsonb(j)||jsonb_build_object('request',w.request,'checkpoint',w.checkpoint,'lease',v_lease);
end $$;

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
        when p_outcome#>>'{result,analysis,verification,version}'='v162' then not private.case_analysis_review_coverage_valid(p_outcome->'result')
        else true end)
      then raise exception 'Invalid reviewed result'; end if;
    insert into public.case_roadmaps(id,owner_id,case_id,output_language,reference_language,style,result,source_fingerprint,source_documents,model,workflow_version)
      values(j.id,j.owner_id,j.case_id,w.request->>'output_language',w.request->>'reference_language',w.request->'style',p_outcome->'result',j.source_fingerprint,p_outcome->'source_documents',p_outcome->>'model',p_outcome->>'workflow_version') on conflict(id) do nothing;
    update public.case_analysis_jobs set status='completed',stage='completed',roadmap_id=id,updated_at=now(),finished_at=now() where id=j.id returning * into j;
  elsif v_status='processing' and w.steps<30 and p_outcome->>'checkpoint' is not null and p_outcome->>'stage' in ('planning','research','generation','review','correction') then
    update public.case_analysis_jobs set status='queued',stage=p_outcome->>'stage',updated_at=now() where id=j.id returning * into j;
    update private.case_analysis_work set checkpoint=p_outcome->>'checkpoint',steps=steps+1,available_at=now(),lease=null,lease_until=null where job_id=j.id;
    return to_jsonb(j);
  elsif v_status='failed' and p_outcome->>'retry'='true' and w.failures<1 and w.attempts<32 and j.expires_at>now()
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
