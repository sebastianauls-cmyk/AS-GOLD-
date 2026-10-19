-- Preserve the original request reservation and the returned receipt. Search
-- limits must account for provider-reported work above max_tool_calls, too.
-- Unknown actions are conservatively counted as searches; known open/find
-- actions are not. Missing evidence never releases the original reservation.
alter table private.case_model_calls add column charged_search_calls bigint
  generated always as (greatest(search_calls::bigint,
    coalesce((billing_receipt->>'web_search_calls')::bigint,0)
    +coalesce((billing_receipt->>'web_unknown_calls')::bigint,0))) stored;
comment on column private.case_model_calls.charged_search_calls is
  'Search resource units: max(original reservation, reported searches + unclassified web actions). Computed for historical and new receipts, including late settlement. Not an invoice or a pre-request monetary guarantee.';

-- Both spent usage and the remaining active envelope use the same units.
-- Reservation, settlement and admission already share the policy-row locks.
-- Replacing this private invoker function preserves its revoked EXECUTE grants.
create or replace function private.case_capacity_usage(p_scope text,p_owner uuid,p_job uuid default null)
returns table(calls bigint,output_tokens bigint,request_bytes bigint,search_calls bigint,input_units bigint)
language sql stable set search_path='' as $$
  with spent as (
    select count(*)::bigint as calls,coalesce(sum(c.charged_output_tokens),0)::bigint as output_tokens,
      coalesce(sum(c.request_bytes),0)::bigint as request_bytes,coalesce(sum(c.charged_search_calls),0)::bigint as search_calls,
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
        coalesce(sum(c.request_bytes),0) as request_bytes,coalesce(sum(c.charged_search_calls),0) as search_calls,
        coalesce(sum(c.input_units),0) as input_units from private.case_model_calls c where c.job_id=j.id
    ) u
    where p_scope in ('owner','global') and w.capacity is not null and j.status in ('queued','running')
      and j.expires_at>now() and j.id is distinct from p_job and (p_scope='global' or j.owner_id=p_owner)
  ) select s.calls+h.calls,s.output_tokens+h.output_tokens,s.request_bytes+h.request_bytes,
      s.search_calls+h.search_calls,s.input_units+h.input_units from spent s cross join held h
$$;
