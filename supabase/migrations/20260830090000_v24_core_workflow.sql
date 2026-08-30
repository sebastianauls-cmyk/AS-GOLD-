-- AS Gold V24: Persist the reviewable customer -> case -> document workflow.
-- Prepared for the gated database rollout; this migration is not applied by a
-- UI-only preview deployment.

alter table public.cases
  add column if not exists deadline_at timestamptz,
  add column if not exists goal text,
  add column if not exists evidence_status text default 'yellow',
  add column if not exists next_action text;

alter table public.documents
  add column if not exists extracted_text text,
  add column if not exists analysis_summary text,
  add column if not exists analysis_next_step text;

comment on column public.cases.deadline_at is
  'Optionale Arbeits- oder Verfahrensfrist für die priorisierte V24-Fallsteuerung.';

create index if not exists cases_owner_deadline_v24_idx
  on public.cases (owner_id, deadline_at)
  where deadline_at is not null;

-- RLS protects each row owner. These triggers additionally prevent a user from
-- linking an owned row to another owner's client, case or document UUID.
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
  end if;

  return new;
end;
$$;

revoke all on function private.gold_validate_owned_relation()
  from public, anon, authenticated;

drop trigger if exists cases_validate_owned_client_v24 on public.cases;
create trigger cases_validate_owned_client_v24
before insert or update of owner_id, client_id on public.cases
for each row execute function private.gold_validate_owned_relation();

drop trigger if exists documents_validate_owned_case_v24 on public.documents;
create trigger documents_validate_owned_case_v24
before insert or update of owner_id, case_id on public.documents
for each row execute function private.gold_validate_owned_relation();

drop trigger if exists assessments_validate_owned_case_v24 on public.assessments;
create trigger assessments_validate_owned_case_v24
before insert or update of owner_id, case_id on public.assessments
for each row execute function private.gold_validate_owned_relation();

drop trigger if exists source_status_validate_owned_case_v24 on public.source_status;
create trigger source_status_validate_owned_case_v24
before insert or update of owner_id, case_id on public.source_status
for each row execute function private.gold_validate_owned_relation();
