-- Keep all evidence checks and the one content correction. The former final
-- review is split into roadmap and letters, each with a durable checkpoint.
-- Worst case: planning + 5 research + 2 generation + 4 reviews +
-- 2 corrected generation + 4 reviews = 18 calls. The 30-minute lifetime,
-- 20-claim cap, one transport retry and all access predicates are unchanged.
alter table private.case_analysis_work drop constraint case_analysis_work_steps_check;
alter table private.case_analysis_work add constraint case_analysis_work_steps_check check(steps between 0 and 18);

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
    if j.expires_at<=now() or w.attempts>=20 or w.steps>=18 or (j.status='running' and w.failures>=1)
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
  if j.status<>'queued' or j.expires_at<=now() or w.attempts>=20 or w.steps>=18
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
      or (case (p_outcome#>>'{result,analysis,verification,version}')
        when 'v157' then jsonb_array_length(p_outcome#>'{result,analysis,verification,review_response_ids}')<>3
        when 'v160' then jsonb_array_length(p_outcome#>'{result,analysis,verification,review_response_ids}')<>4
          or p_outcome#>'{result,analysis,verification,review_scopes}' is distinct from '["analysis","calculations","roadmap","letters"]'::jsonb
          or exists(select 1 from jsonb_array_elements(p_outcome#>'{result,analysis,verification,review_response_ids}') r(value)
            where jsonb_typeof(value)<>'string' or length(trim(value#>>'{}'))=0)
          or (select count(distinct value) from jsonb_array_elements(p_outcome#>'{result,analysis,verification,review_response_ids}') r(value))<>4
        else true end)
      then raise exception 'Invalid reviewed result'; end if;
    insert into public.case_roadmaps(id,owner_id,case_id,output_language,reference_language,style,result,source_fingerprint,source_documents,model,workflow_version)
      values(j.id,j.owner_id,j.case_id,w.request->>'output_language',w.request->>'reference_language',w.request->'style',p_outcome->'result',j.source_fingerprint,p_outcome->'source_documents',p_outcome->>'model',p_outcome->>'workflow_version') on conflict(id) do nothing;
    update public.case_analysis_jobs set status='completed',stage='completed',roadmap_id=id,updated_at=now(),finished_at=now() where id=j.id returning * into j;
  elsif v_status='processing' and w.steps<17 and p_outcome->>'checkpoint' is not null and p_outcome->>'stage' in ('planning','research','generation','review','correction') then
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
