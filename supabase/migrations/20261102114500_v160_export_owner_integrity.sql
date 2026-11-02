-- ASH Workspace Gold: exports must never reference another account's case or document.
-- Additive integrity guard; retains standalone, case-only and document-only exports.
-- Existing production exports were checked for ownership mismatches before this change.

do $preflight$
begin
  if exists (
    select 1
    from public.exports e
    left join public.cases c on c.id = e.case_id
    where e.case_id is not null
      and (c.id is null or c.owner_id is distinct from e.owner_id)
  ) or exists (
    select 1
    from public.exports e
    left join public.documents d on d.id = e.document_id
    where e.document_id is not null
      and (d.id is null or d.owner_id is distinct from e.owner_id)
  ) then
    raise exception 'Existing exports contain foreign-owner references';
  end if;
end;
$preflight$;

create or replace function private.gold_validate_export_owned_relation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if new.case_id is not null
     and not exists (
       select 1 from public.cases c
       where c.id = new.case_id and c.owner_id = new.owner_id
     ) then
    raise exception using
      errcode = '23503',
      message = 'Export case does not belong to row owner';
  end if;

  if new.document_id is not null
     and not exists (
       select 1 from public.documents d
       where d.id = new.document_id and d.owner_id = new.owner_id
     ) then
    raise exception using
      errcode = '23503',
      message = 'Export document does not belong to row owner';
  end if;

  return new;
end;
$body$;

revoke all on function private.gold_validate_export_owned_relation()
  from public, anon, authenticated;

drop trigger if exists exports_validate_owned_relation_v160 on public.exports;
create trigger exports_validate_owned_relation_v160
before insert or update of owner_id, case_id, document_id on public.exports
for each row execute function private.gold_validate_export_owned_relation();
