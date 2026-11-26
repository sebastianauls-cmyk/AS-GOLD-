-- A modified preview must be saved before it can be explicitly approved.
create or replace function public.gold_v20_invalidate_approval_on_content_change()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if row(new.recipient, new.subject, new.body, new.attachment_names)
     is distinct from row(old.recipient, old.subject, old.body, old.attachment_names) then
    if old.status <> 'approved' and new.status = 'approved' then
      raise exception using errcode = '23514', message = 'Save changed preview before approving it';
    end if;
    new.preview_revision := old.preview_revision + 1;
    new.updated_at := now();
    if old.status = 'approved' then
      new.status := 'pending';
      new.approved_at := null;
      new.approved_revision := null;
      new.invalidated_at := now();
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$function$;

-- Exercise the production trigger and CHECK constraints without touching customer rows.
do $test$
declare
  blocked boolean;
begin
  create temporary table qa_approval_edit
    (like public.approvals including defaults including constraints) on commit drop;
  create trigger qa_guard before update on qa_approval_edit
    for each row execute function public.gold_v20_invalidate_approval_on_content_change();
  insert into pg_temp.qa_approval_edit(owner_id,case_id,approval_type,status,recipient,subject,body,preview_revision)
    values(gen_random_uuid(),gen_random_uuid(),'letter','pending','test@example.invalid','Werkstattrechnung','Entwurf A',1);
  -- 1: simultaneous edit and approval of a pending preview must fail.
  blocked := false;
  begin
    update pg_temp.qa_approval_edit set body='Entwurf B',status='approved',approved_revision=2,approved_at=now();
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'QA1 combined edit/approval accepted'; end if;
  -- 2: failed operation did not alter the draft.
  if not exists(select 1 from pg_temp.qa_approval_edit where status='pending' and body='Entwurf A' and preview_revision=1) then
    raise exception 'QA2 draft changed'; end if;
  -- 3: save a normal edit.
  update pg_temp.qa_approval_edit set body='Entwurf B';
  if not exists(select 1 from pg_temp.qa_approval_edit where status='pending' and preview_revision=2 and approved_revision is null) then
    raise exception 'QA3 edit failed'; end if;
  -- 4: stale revision rejected.
  blocked := false;
  begin
    update pg_temp.qa_approval_edit set status='approved',approved_revision=1,approved_at=now();
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'QA4 stale approval accepted'; end if;
  -- 5: approve the saved current preview without content changes.
  update pg_temp.qa_approval_edit set status='approved',approved_revision=2,approved_at=now();
  if not exists(select 1 from pg_temp.qa_approval_edit where status='approved' and approved_revision=2 and preview_revision=2) then
    raise exception 'QA5 current approval failed'; end if;
  -- 6: changing approved content invalidates existing approval as before.
  update pg_temp.qa_approval_edit set subject='Vertragsstreit';
  if not exists(select 1 from pg_temp.qa_approval_edit where status='pending' and preview_revision=3 and approved_revision is null and approved_at is null and invalidated_at is not null) then
    raise exception 'QA6 approval not invalidated'; end if;
  -- 7: rejected preview cannot be edited and approved in one operation either.
  update pg_temp.qa_approval_edit set status='rejected';
  blocked := false;
  begin
    update pg_temp.qa_approval_edit set attachment_names=array['Nachlass.pdf'],status='approved',approved_revision=4,approved_at=now();
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'QA7 rejected preview bypass accepted'; end if;
end;
$test$;
