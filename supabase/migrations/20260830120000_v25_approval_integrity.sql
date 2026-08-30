-- AS Gold V25: Bind every approval to rows owned by the same account and keep
-- an approved state tied to the exact preview revision. Prepared only; applying
-- this migration remains a separate database release decision.

create or replace function private.gold_validate_owned_relation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'cases' and new.client_id is not null
     and not exists (
       select 1 from public.clients
       where id = new.client_id and owner_id = new.owner_id
     ) then
    raise exception using errcode = '23503', message = 'Client does not belong to row owner';
  elsif tg_table_name = 'documents' and new.case_id is not null
     and not exists (
       select 1 from public.cases
       where id = new.case_id and owner_id = new.owner_id
     ) then
    raise exception using errcode = '23503', message = 'Case does not belong to row owner';
  elsif tg_table_name = 'assessments'
     and not exists (
       select 1 from public.cases
       where id = new.case_id and owner_id = new.owner_id
     ) then
    raise exception using errcode = '23503', message = 'Assessment case does not belong to row owner';
  elsif tg_table_name = 'source_status'
     and not exists (
       select 1 from public.cases
       where id = new.case_id and owner_id = new.owner_id
     ) then
    raise exception using errcode = '23503', message = 'Source case does not belong to row owner';
  elsif tg_table_name = 'approvals'
     and not exists (
       select 1 from public.cases
       where id = new.case_id and owner_id = new.owner_id
     ) then
    raise exception using errcode = '23503', message = 'Approval case does not belong to row owner';
  elsif tg_table_name = 'approvals' and new.document_id is not null
     and not exists (
       select 1 from public.documents
       where id = new.document_id
         and owner_id = new.owner_id
         and case_id = new.case_id
     ) then
    raise exception using errcode = '23503', message = 'Approval document does not belong to approval case and row owner';
  end if;

  return new;
end;
$$;

revoke all on function private.gold_validate_owned_relation()
  from public, anon, authenticated;

drop trigger if exists approvals_validate_owned_relation_v25 on public.approvals;
create trigger approvals_validate_owned_relation_v25
before insert or update of owner_id, case_id, document_id on public.approvals
for each row execute function private.gold_validate_owned_relation();

update public.approvals
set preview_required = true
where preview_required is null;

alter table public.approvals
  alter column preview_required set default true,
  alter column preview_required set not null;

alter table public.approvals
  drop constraint if exists approvals_revision_state_v25_check;

alter table public.approvals
  add constraint approvals_revision_state_v25_check check (
    preview_required = true
    and (
      (
        status = 'approved'
        and approved_at is not null
        and approved_revision = preview_revision
      )
      or
      (
        status <> 'approved'
        and approved_at is null
        and approved_revision is null
      )
    )
  );
