-- V107: save an assessment and its current case traffic light atomically.

create or replace function public.create_gold_assessment(
  p_case_id uuid,
  p_title text,
  p_traffic_light text,
  p_reasoning text default null,
  p_next_step text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases;
  v_assessment public.assessments;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_case_id is null then
    raise exception using errcode = '22023', message = 'Case is required';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception using errcode = '22023', message = 'Assessment title is required';
  end if;
  if p_traffic_light is null
     or not (p_traffic_light = any (array['green','yellow','red'])) then
    raise exception using errcode = '22023', message = 'Invalid traffic light';
  end if;

  select * into v_case
  from public.cases
  where id = p_case_id and owner_id = v_uid
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Case not accessible';
  end if;

  insert into public.assessments (
    owner_id, case_id, title, traffic_light, reasoning, next_step
  ) values (
    v_uid,
    p_case_id,
    btrim(p_title),
    p_traffic_light,
    nullif(btrim(coalesce(p_reasoning, '')), ''),
    nullif(btrim(coalesce(p_next_step, '')), '')
  ) returning * into v_assessment;

  update public.cases
  set traffic_light = p_traffic_light,
      updated_at = now()
  where id = p_case_id and owner_id = v_uid
  returning * into v_case;

  return jsonb_build_object(
    'assessment', to_jsonb(v_assessment),
    'case', to_jsonb(v_case)
  );
end;
$$;

revoke all on function public.create_gold_assessment(uuid,text,text,text,text)
  from public, anon;
grant execute on function public.create_gold_assessment(uuid,text,text,text,text)
  to authenticated;

comment on function public.create_gold_assessment(uuid,text,text,text,text) is
  'Atomically stores an owned assessment and makes its traffic light the current case status.';

-- Client edits are recorded by the database so audit history cannot be skipped
-- by a browser or future client implementation.
create or replace function private.gold_audit_client_update_v107()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_events (
    owner_id, event_type, entity_type, entity_id, event_data, source
  ) values (
    new.owner_id, 'client_updated', 'client', new.id, '{}'::jsonb, 'database'
  );
  return new;
end;
$$;

revoke all on function private.gold_audit_client_update_v107()
  from public, anon, authenticated;

drop trigger if exists clients_audit_update_v107 on public.clients;
create trigger clients_audit_update_v107
after update of name, email, phone, notes on public.clients
for each row
when (
  old.name is distinct from new.name
  or old.email is distinct from new.email
  or old.phone is distinct from new.phone
  or old.notes is distinct from new.notes
)
execute function private.gold_audit_client_update_v107();
