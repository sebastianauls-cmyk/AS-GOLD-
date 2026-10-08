-- Add provider billing evidence without changing any allowance, reservation,
-- legacy settlement signature, consent check, or worker configuration.
alter table private.case_model_calls add column billing_receipt jsonb;
comment on column private.case_model_calls.billing_receipt is
  'Content-free response metadata, schema 1. NULL fields are unknown, not zero or default pricing. Historical calls remain NULL. Search counts are returned actions, not an invoice.';

create function public.settle_case_model_call_with_receipt(
  p_job_id uuid,p_lease uuid,p_reservation_id uuid,
  p_input_tokens bigint,p_output_tokens integer,p_cached_tokens bigint,p_receipt jsonb
) returns boolean language plpgsql security definer set search_path='' as $$
declare
  c private.case_model_calls;
  k text;
  required_keys constant text[]:=array[
    'schema_version','requested_model','response_model','response_id','response_status',
    'requested_service_tier','service_tier','cache_read_tokens','cache_write_tokens',
    'web_search_calls','web_search_completed_calls','web_open_calls','web_find_calls','web_unknown_calls'];
begin
  if p_receipt is null or jsonb_typeof(p_receipt)<>'object' then return false;end if;
  if octet_length(p_receipt::text)>3000 or p_receipt->'schema_version' is distinct from '1'::jsonb
    or not(p_receipt ?& required_keys) or p_receipt-required_keys<>'{}'::jsonb then return false;end if;
  foreach k in array array['requested_model','response_model','response_id','response_status','requested_service_tier','service_tier'] loop
    if p_receipt->k<>'null'::jsonb and
      (jsonb_typeof(p_receipt->k)<>'string' or (p_receipt->>k)!~'^[A-Za-z0-9_.:/-]{1,128}$') then return false;end if;
  end loop;
  foreach k in array array['cache_read_tokens','cache_write_tokens','web_search_calls','web_search_completed_calls','web_open_calls','web_find_calls','web_unknown_calls'] loop
    if p_receipt->k<>'null'::jsonb then
      if jsonb_typeof(p_receipt->k)<>'number' or (p_receipt->>k)!~'^[0-9]{1,16}$' then return false;end if;
      if (p_receipt->>k)::numeric>9007199254740991 then return false;end if;
    end if;
  end loop;
  if (p_receipt->>'cache_read_tokens')::bigint<>p_cached_tokens
    or (p_receipt->>'cache_write_tokens')::bigint>p_input_tokens-p_cached_tokens
    or (p_receipt->>'web_search_completed_calls')::bigint>(p_receipt->>'web_search_calls')::bigint then return false;end if;
  -- A missing output array makes every action count unknown together.
  if exists(select 1 from unnest(array['web_search_completed_calls','web_open_calls','web_find_calls','web_unknown_calls']) as keys(action_key)
    where (p_receipt->keys.action_key='null'::jsonb)<>(p_receipt->'web_search_calls'='null'::jsonb)) then return false;end if;

  -- Use the same lock order as the existing settlement/reservation functions.
  -- Bind evidence to the original lease, even when a late response arrives
  -- after cancellation. An exact replay is harmless; conflicting evidence is not.
  perform 1 from private.case_model_budget_policy order by scope for update;
  select * into c from private.case_model_calls
    where id=p_reservation_id and job_id=p_job_id and lease=p_lease for update;
  if not found or (c.billing_receipt is not null and c.billing_receipt<>p_receipt) then return false;end if;
  if not public.settle_case_model_call(p_job_id,p_lease,p_reservation_id,p_input_tokens,p_output_tokens,p_cached_tokens) then return false;end if;
  update private.case_model_calls set billing_receipt=p_receipt where id=c.id and billing_receipt is null;
  return true;
end
$$;
revoke all on function public.settle_case_model_call_with_receipt(uuid,uuid,uuid,bigint,integer,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.settle_case_model_call_with_receipt(uuid,uuid,uuid,bigint,integer,bigint,jsonb) to service_role;
