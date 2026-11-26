-- Bind the preview revision to its case, source document and approval type as well as visible text.
create or replace function public.gold_v20_invalidate_approval_on_content_change()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if row(new.owner_id,new.case_id,new.document_id,new.approval_type,new.recipient,new.subject,new.body,new.attachment_names)
     is distinct from row(old.owner_id,old.case_id,old.document_id,old.approval_type,old.recipient,old.subject,old.body,old.attachment_names) then
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
    if new.preview_revision is distinct from old.preview_revision then
      raise exception using errcode = '23514', message = 'Preview revision is managed by the database';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$function$;

-- Isolated regressions, no customer records or external calls.
do $test$
declare x uuid; scenario text; c uuid; d uuid; blocked boolean;
begin
  create temp table qa_approval_binding (like public.approvals including defaults including constraints) on commit drop;
  create trigger qa_insert before insert on qa_approval_binding for each row execute function private.gold_require_pending_approval_insert();
  create trigger qa_update before update on qa_approval_binding for each row execute function public.gold_v20_invalidate_approval_on_content_change();
  foreach scenario in array array['Start - Werkstattrechnung','Professional - Vertragsstreit','Business - Nachlass'] loop
    c := gen_random_uuid(); d := gen_random_uuid();
    insert into qa_approval_binding(owner_id,case_id,document_id,approval_type,subject,body)
      values(gen_random_uuid(),c,d,'letter',scenario,'Fassung A') returning id into x;
    blocked := false;
    begin
      update qa_approval_binding set case_id=gen_random_uuid(),document_id=null,status='approved',approved_at=now(),approved_revision=2 where id=x;
    exception when check_violation then blocked := true; end;
    if not blocked then raise exception 'Combined reassignment and approval accepted: %',scenario; end if;
    update qa_approval_binding set status='approved',approved_at=now(),approved_revision=1 where id=x;
    if not exists(select 1 from qa_approval_binding where id=x and status='approved' and approved_revision=1) then raise exception 'Normal approval failed: %',scenario; end if;
    update qa_approval_binding set case_id=gen_random_uuid(),document_id=null where id=x;
    if not exists(select 1 from qa_approval_binding where id=x and status='pending' and preview_revision=2 and approved_revision is null and approved_at is null and invalidated_at is not null) then raise exception 'Case rebind retained approval: %',scenario; end if;
    update qa_approval_binding set status='approved',approved_at=now(),approved_revision=2 where id=x;
    update qa_approval_binding set document_id=gen_random_uuid() where id=x;
    if not exists(select 1 from qa_approval_binding where id=x and status='pending' and preview_revision=3 and approved_revision is null) then raise exception 'Document rebind retained approval: %',scenario; end if;
    update qa_approval_binding set status='approved',approved_at=now(),approved_revision=3 where id=x;
    update qa_approval_binding set document_id=null where id=x;
    if not exists(select 1 from qa_approval_binding where id=x and status='pending' and preview_revision=4 and approved_revision is null) then raise exception 'Document unlink retained approval: %',scenario; end if;
    update qa_approval_binding set status='approved',approved_at=now(),approved_revision=4 where id=x;
    update qa_approval_binding set approval_type='review' where id=x;
    if not exists(select 1 from qa_approval_binding where id=x and status='pending' and preview_revision=5 and approved_revision is null) then raise exception 'Type change retained approval: %',scenario; end if;
    update qa_approval_binding set status='approved',approved_at=now(),approved_revision=5 where id=x;
    if not exists(select 1 from qa_approval_binding where id=x and status='approved' and approved_revision=5) then raise exception 'Reapproval failed: %',scenario; end if;
  end loop;
end;
$test$;
