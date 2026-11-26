-- Prevent email event metadata from referencing a case or connection owned by another account.
-- Both references remain optional, including ON DELETE SET NULL for the connection.
create or replace function private.gold_validate_email_event_binding()
returns trigger language plpgsql security definer set search_path to '' as $function$
begin
  if new.case_id is not null and not exists (
    select 1 from public.cases c where c.id=new.case_id and c.owner_id=new.owner_id
  ) then
    raise exception using errcode='23503', message='Email event case does not belong to row owner';
  end if;
  if new.email_connection_id is not null and not exists (
    select 1 from public.email_connections e where e.id=new.email_connection_id and e.owner_id=new.owner_id
  ) then
    raise exception using errcode='23503', message='Email event connection does not belong to row owner';
  end if;
  return new;
end;
$function$;
revoke all on function private.gold_validate_email_event_binding() from public, anon, authenticated;
create trigger case_email_events_validate_binding
before insert or update of owner_id, case_id, email_connection_id on public.case_email_events
for each row execute function private.gold_validate_email_event_binding();
