-- V38: keep the exposed audit RPC non-privileged while retaining the validated
-- SECURITY DEFINER implementation behind the non-exposed private schema.

grant execute on function private.record_gold_audit_event_impl(text,text,uuid,jsonb) to authenticated;
revoke execute on function private.record_gold_audit_event_impl(text,text,uuid,jsonb) from anon;

create or replace function public.record_gold_audit_event(
  p_event_type text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path to ''
as $$
  select private.record_gold_audit_event_impl(
    p_event_type, p_entity_type, p_entity_id, p_metadata
  );
$$;

revoke all on function public.record_gold_audit_event(text,text,uuid,jsonb) from public;
revoke execute on function public.record_gold_audit_event(text,text,uuid,jsonb) from anon;
grant execute on function public.record_gold_audit_event(text,text,uuid,jsonb) to authenticated;
