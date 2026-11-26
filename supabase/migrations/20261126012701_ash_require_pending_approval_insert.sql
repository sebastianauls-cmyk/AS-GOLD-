-- New approval records must begin as drafts; approval is a separate update.
create or replace function private.gold_require_pending_approval_insert()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if new.status is distinct from 'pending' then
    raise exception using errcode = '23514', message = 'Create pending preview before approval';
  end if;
  return new;
end;
$function$;

create trigger gold_approval_require_pending_insert
before insert on public.approvals
for each row execute function private.gold_require_pending_approval_insert();

-- Synthetic regression: actual production trigger functions and constraints,
-- no customer records or external calls.
do $test$
declare
  scenario text;
  blocked boolean;
  draft_id uuid;
begin
  create temporary table qa_initial_approval
    (like public.approvals including defaults including constraints) on commit drop;
  create trigger qa_insert before insert on qa_initial_approval
    for each row execute function private.gold_require_pending_approval_insert();
  create trigger qa_update before update on qa_initial_approval
    for each row execute function public.gold_v20_invalidate_approval_on_content_change();
  foreach scenario in array array['Start - Werkstattrechnung','Professional - Vertragsstreit','Business - Nachlass'] loop
    blocked := false;
    begin
      insert into pg_temp.qa_initial_approval(owner_id,case_id,approval_type,status,recipient,subject,body,preview_revision,approved_revision,approved_at)
      values(gen_random_uuid(),gen_random_uuid(),'letter','approved','qa@example.invalid',scenario,'Synthetischer Entwurf',1,1,now());
    exception when check_violation then blocked := true;
    end;
    if not blocked then raise exception 'Direct approved insert accepted: %',scenario; end if;
    insert into pg_temp.qa_initial_approval(owner_id,case_id,approval_type,recipient,subject,body)
    values(gen_random_uuid(),gen_random_uuid(),'letter','qa@example.invalid',scenario,'Synthetischer Entwurf')
    returning id into draft_id;
    if not exists(select 1 from pg_temp.qa_initial_approval where id=draft_id and status='pending' and approved_revision is null)
    then raise exception 'Draft creation failed: %',scenario; end if;
    update pg_temp.qa_initial_approval set status='approved',approved_revision=preview_revision,approved_at=now() where id=draft_id;
    if not exists(select 1 from pg_temp.qa_initial_approval where id=draft_id and status='approved' and approved_revision=preview_revision)
    then raise exception 'Separate approval failed: %',scenario; end if;
  end loop;
  blocked := false;
  begin
    insert into pg_temp.qa_initial_approval(owner_id,case_id,approval_type,status)
    values(gen_random_uuid(),gen_random_uuid(),'letter','rejected');
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Direct rejected insert accepted'; end if;
end;
$test$;
