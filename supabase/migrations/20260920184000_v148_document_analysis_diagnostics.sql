-- Application-reported metadata only. No document/model contents or approval.
create or replace function private.record_gold_document_analysis_failure_impl(
  p_document_id uuid, p_metadata jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_key text;
begin
  if v_uid is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not private.gold_access_active() then raise exception using errcode='42501', message='Active access required'; end if;
  if not exists(select 1 from public.documents where id=p_document_id and owner_id=v_uid) then
    raise exception using errcode='42501', message='Document not accessible';
  end if;
  if p_metadata is null or jsonb_typeof(p_metadata)<>'object' or octet_length(p_metadata::text)>512
     or (p_metadata-array['code','stage','attempt','http_status','provider_status','request_id','attempt_id'])<>'{}'::jsonb
     or not (p_metadata ?& array['code','stage','attempt']) then
    raise exception using errcode='22023', message='Invalid failure metadata';
  end if;
  if jsonb_typeof(p_metadata->'code')<>'string' or not (p_metadata->>'code'=any(array[
    'provider_timeout','provider_network','provider_http','provider_rate_limit','provider_auth',
    'provider_token_limit','provider_incomplete','provider_invalid_json','review_invalid',
    'model_workflow_failed','request_failed','function_timeout','function_resources','function_http',
    'function_relay','network_error','session_expired','invalid_response','review_unresolved',
    'source_unresolved','configuration_required']))
     or jsonb_typeof(p_metadata->'stage')<>'string' or not (p_metadata->>'stage'=any(array['request','generation','review','correction']))
     or jsonb_typeof(p_metadata->'attempt')<>'number' or not (p_metadata->>'attempt'=any(array['1','2'])) then
    raise exception using errcode='22023', message='Invalid failure category';
  end if;
  foreach v_key in array array['http_status','provider_status'] loop
    if p_metadata ? v_key and (jsonb_typeof(p_metadata->v_key)<>'number' or p_metadata->>v_key !~ '^[1-5][0-9]{2}$') then
      raise exception using errcode='22023', message='Invalid failure status';
    end if;
  end loop;
  foreach v_key in array array['request_id','attempt_id'] loop
    if p_metadata ? v_key and (jsonb_typeof(p_metadata->v_key)<>'string' or p_metadata->>v_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') then
      raise exception using errcode='22023', message='Invalid failure reference';
    end if;
  end loop;
  insert into public.audit_events(owner_id,event_type,entity_type,entity_id,event_data,source)
  values(v_uid,'document_analysis_failed','document',p_document_id,p_metadata,'app') returning id into v_id;
  return v_id;
end;
$$;
create or replace function public.record_gold_document_analysis_failure(p_document_id uuid,p_metadata jsonb)
returns uuid language sql security invoker set search_path='' as $$
  select private.record_gold_document_analysis_failure_impl(p_document_id,p_metadata);
$$;
revoke all on function private.record_gold_document_analysis_failure_impl(uuid,jsonb) from public,anon;
revoke all on function public.record_gold_document_analysis_failure(uuid,jsonb) from public,anon;
grant execute on function private.record_gold_document_analysis_failure_impl(uuid,jsonb) to authenticated;
grant execute on function public.record_gold_document_analysis_failure(uuid,jsonb) to authenticated;
