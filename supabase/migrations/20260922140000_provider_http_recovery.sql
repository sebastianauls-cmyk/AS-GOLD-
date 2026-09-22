-- Retry only transient provider server responses within the existing per-step,
-- total-attempt and original-expiry budgets. Keep every result gate unchanged.
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
        when p_outcome#>>'{result,analysis,verification,version}' in ('v162','v163','v164') then not private.case_analysis_review_coverage_valid(p_outcome->'result')
        else true end)
      then raise exception 'Invalid reviewed result'; end if;
    insert into public.case_roadmaps(id,owner_id,case_id,output_language,reference_language,style,result,source_fingerprint,source_documents,model,workflow_version)
      values(j.id,j.owner_id,j.case_id,w.request->>'output_language',w.request->>'reference_language',w.request->'style',p_outcome->'result',j.source_fingerprint,p_outcome->'source_documents',p_outcome->>'model',p_outcome->>'workflow_version') on conflict(id) do nothing;
    update public.case_analysis_jobs set status='completed',stage='completed',roadmap_id=id,updated_at=now(),finished_at=now() where id=j.id returning * into j;
  elsif v_status='processing' and w.steps<44 and p_outcome->>'checkpoint' is not null and p_outcome->>'stage' in ('planning','research','generation','review','correction') then
    update public.case_analysis_jobs set status='queued',stage=p_outcome->>'stage',updated_at=now() where id=j.id returning * into j;
    update private.case_analysis_work set checkpoint=p_outcome->>'checkpoint',steps=steps+1,failures=0,available_at=now(),lease=null,lease_until=null where job_id=j.id;
    return to_jsonb(j);
  elsif v_status='failed' and p_outcome->>'retry'='true' and w.failures<1 and w.transport_retries<3 and w.attempts<48 and j.expires_at>now()
    and (p_outcome->>'code' in ('provider_network','provider_timeout')
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
