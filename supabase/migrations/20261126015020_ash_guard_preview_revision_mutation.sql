-- Prevent a caller from rolling a preview revision back and approving unseen content.
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
    if new.preview_revision is distinct from old.preview_revision then
      raise exception using errcode = '23514', message = 'Preview revision is managed by the database';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$function$;

-- Isolated synthetic regression tests against the real trigger functions and constraints.
do $test$
declare x uuid; scenario text; blocked boolean;
begin
  create temp table qa_revision_guard (like public.approvals including defaults including constraints) on commit drop;
  create trigger qa_insert before insert on qa_revision_guard for each row execute function private.gold_require_pending_approval_insert();
  create trigger qa_update before update on qa_revision_guard for each row execute function public.gold_v20_invalidate_approval_on_content_change();
  foreach scenario in array array['Start - Werkstattrechnung','Professional - Vertragsstreit','Business - Nachlass'] loop
    insert into qa_revision_guard(owner_id,case_id,approval_type,subject,body)
      values(gen_random_uuid(),gen_random_uuid(),'letter',scenario,'Fassung A') returning id into x;
    update qa_revision_guard set body='Fassung B' where id=x;
    if not exists(select 1 from qa_revision_guard where id=x and preview_revision=2 and status='pending') then raise exception 'Save failed: %',scenario; end if;
    blocked := false;
    begin
      update qa_revision_guard set preview_revision=1,approved_revision=1,status='approved',approved_at=now() where id=x;
    exception when check_violation then blocked := true; end;
    if not blocked then raise exception 'Stale revision bypass: %',scenario; end if;
    blocked := false;
    begin
      update qa_revision_guard set preview_revision=3 where id=x;
    exception when check_violation then blocked := true; end;
    if not blocked then raise exception 'Manual revision accepted: %',scenario; end if;
    update qa_revision_guard set approved_revision=2,status='approved',approved_at=now() where id=x;
    if not exists(select 1 from qa_revision_guard where id=x and preview_revision=2 and approved_revision=2 and status='approved') then raise exception 'Current approval failed: %',scenario; end if;
    update qa_revision_guard set body='Fassung C' where id=x;
    if not exists(select 1 from qa_revision_guard where id=x and preview_revision=3 and approved_revision is null and approved_at is null and status='pending' and invalidated_at is not null) then raise exception 'Invalidation failed: %',scenario; end if;
  end loop;
end;
$test$;
