-- An export may reference a case, a document, or both. If both are present,
-- they must describe the same case. Preserve nullable historical references.
create or replace function private.gold_validate_export_owned_relation()
returns trigger language plpgsql security definer set search_path to '' as $function$
begin
  if new.case_id is not null
     and not exists (
       select 1 from public.cases c
       where c.id = new.case_id and c.owner_id = new.owner_id
     ) then
    raise exception using errcode = '23503',
      message = 'Export case does not belong to row owner';
  end if;

  if new.document_id is not null
     and not exists (
       select 1 from public.documents d
       where d.id = new.document_id and d.owner_id = new.owner_id
         and (new.case_id is null or d.case_id = new.case_id)
     ) then
    raise exception using errcode = '23503',
      message = 'Export document does not belong to row owner or export case';
  end if;
  return new;
end;
$function$;

-- Isolated regression using existing relation identifiers only, when available.
-- No persistent rows are created or updated.
do $qa$
declare own uuid; good_case uuid; other_case uuid; doc uuid; blocked boolean; v_scenario text;
begin
  select d.owner_id,d.case_id,c.id,d.id into own,good_case,other_case,doc
    from public.documents d join public.cases c on c.owner_id=d.owner_id and c.id<>d.case_id
    limit 1;
  if not found then return; end if;
  create temp table qa_export_relation(owner_id uuid,case_id uuid,document_id uuid,scenario text) on commit drop;
  create trigger qa_relation before insert or update on qa_export_relation
    for each row execute function private.gold_validate_export_owned_relation();
  foreach v_scenario in array array['Start - Werkstattrechnung','Professional - Vertragsstreit','Business - Nachlass'] loop
    insert into qa_export_relation values(own,good_case,doc,v_scenario);
    insert into qa_export_relation values(own,null,doc,v_scenario);
    insert into qa_export_relation values(own,good_case,null,v_scenario);
    blocked := false;
    begin
      insert into qa_export_relation values(own,other_case,doc,v_scenario);
    exception when foreign_key_violation then blocked := true; end;
    if not blocked then raise exception 'Mismatched export insert accepted: %',v_scenario; end if;
    blocked := false;
    begin
      update qa_export_relation q set case_id=other_case where q.scenario= v_scenario and q.document_id=doc and q.case_id=good_case;
    exception when foreign_key_violation then blocked := true; end;
    if not blocked then raise exception 'Mismatched export update accepted: %',v_scenario; end if;
  end loop;
end
$qa$;