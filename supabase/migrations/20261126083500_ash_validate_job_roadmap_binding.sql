-- A case analysis job may reference only a roadmap belonging to its own case and owner.
-- NULL is allowed for jobs without a result and ON DELETE SET NULL.
create or replace function private.gold_validate_job_roadmap_binding()
returns trigger language plpgsql security definer set search_path to '' as $function$
begin
  if new.roadmap_id is not null and not exists (
    select 1 from public.case_roadmaps r
    join public.cases c on c.id=r.case_id and c.owner_id=r.owner_id
    where r.id=new.roadmap_id and r.case_id=new.case_id and r.owner_id=new.owner_id
  ) then
    raise exception using errcode='23503', message='Analysis roadmap does not belong to job case and owner';
  end if;
  return new;
end;
$function$;
revoke all on function private.gold_validate_job_roadmap_binding() from public, anon, authenticated;
create trigger case_analysis_jobs_validate_roadmap_binding
before insert or update of owner_id, case_id, roadmap_id on public.case_analysis_jobs
for each row execute function private.gold_validate_job_roadmap_binding();

-- Regression: exercise the same trigger function on isolated temporary rows.
do $qa$
declare a record; scenario_name text; blocked boolean;
begin
  select r.id as roadmap_id,r.owner_id,r.case_id,c.id as other_case into a
  from public.case_roadmaps r join public.cases c on c.owner_id=r.owner_id and c.id<>r.case_id limit 1;
  if not found then return; end if;
  create temp table qa_job_roadmap_binding(owner_id uuid,case_id uuid,roadmap_id uuid,scenario text) on commit drop;
  create trigger qa_binding before insert or update on qa_job_roadmap_binding
  for each row execute function private.gold_validate_job_roadmap_binding();
  foreach scenario_name in array array['Start - Werkstattrechnung','Professional - Vertragsstreit','Business - Nachlass'] loop
    insert into qa_job_roadmap_binding values(a.owner_id,a.case_id,a.roadmap_id,scenario_name);
    insert into qa_job_roadmap_binding values(a.owner_id,a.other_case,null,scenario_name);
    blocked:=false;
    begin
      insert into qa_job_roadmap_binding values(a.owner_id,a.other_case,a.roadmap_id,scenario_name);
    exception when foreign_key_violation then blocked:=true; end;
    if not blocked then raise exception 'Wrong case accepted'; end if;
    blocked:=false;
    begin
      update qa_job_roadmap_binding set case_id=a.other_case where roadmap_id=a.roadmap_id and scenario=scenario_name;
    exception when foreign_key_violation then blocked:=true; end;
    if not blocked then raise exception 'Wrong case update accepted'; end if;
    blocked:=false;
    begin
      update qa_job_roadmap_binding set owner_id=gen_random_uuid() where roadmap_id=a.roadmap_id and scenario=scenario_name;
    exception when foreign_key_violation then blocked:=true; end;
    if not blocked then raise exception 'Wrong owner update accepted'; end if;
  end loop;
end
$qa$;
