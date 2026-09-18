-- Additive: V134 continues to use its existing RPC unchanged.
alter table public.assessments
  add column source_document_id uuid references public.documents(id) on delete set null,
  add column source_document_updated_at timestamptz,
  add column source_title_snapshot text,
  add column source_locator text,
  add column source_excerpt text,
  add column statement_kind text not null default 'unknown'
    check (statement_kind in ('unknown','content','party','inference')),
  add column source_reviewed_at timestamptz,
  add column supersedes_assessment_id uuid references public.assessments(id) on delete set null;

create index assessments_source_document_v135_idx on public.assessments(source_document_id);
create unique index assessments_supersedes_v135_idx on public.assessments(supersedes_assessment_id)
  where supersedes_assessment_id is not null;

create function public.validate_assessment_evidence_v135()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_document public.documents;
begin
  if tg_op = 'UPDATE' and new.supersedes_assessment_id is not null
    and new.supersedes_assessment_id is distinct from old.supersedes_assessment_id then
    raise exception using errcode = '22023', message = 'Assessment history links are immutable';
  end if;
  if new.supersedes_assessment_id is not null and not exists (
    select 1 from public.assessments previous
    where previous.id = new.supersedes_assessment_id and previous.id <> new.id
      and previous.owner_id = new.owner_id and previous.case_id = new.case_id
      and (tg_op = 'INSERT' or previous.created_at <= new.created_at)
  ) then
    raise exception using errcode = '42501', message = 'Previous assessment not accessible in this case';
  end if;
  if new.source_document_id is null then
    new.source_reviewed_at := null;
    return new;
  end if;
  select * into v_document from public.documents
    where id = new.source_document_id and owner_id = new.owner_id and case_id = new.case_id
    for share;
  if not found then
    raise exception using errcode = '42501', message = 'Source document not accessible in this case';
  end if;
  if new.source_reviewed_at is not null then
    if nullif(btrim(new.source_locator), '') is null
      or nullif(btrim(new.source_excerpt), '') is null
      or position(regexp_replace(btrim(new.source_excerpt), '\s+', ' ', 'g')
        in regexp_replace(coalesce(v_document.extracted_text, ''), '\s+', ' ', 'g')) = 0 then
      raise exception using errcode = '22023', message = 'A checked source requires a location and an exact quote from the document text';
    end if;
    new.source_reviewed_at := now();
  end if;
  new.source_document_updated_at := v_document.updated_at;
  new.source_title_snapshot := v_document.title;
  return new;
end;
$$;
create trigger assessments_validate_evidence_v135
  before insert or update on public.assessments
  for each row execute function public.validate_assessment_evidence_v135();

create function public.create_gold_assessment_v135(
  p_case_id uuid, p_title text, p_traffic_light text,
  p_reasoning text default null, p_next_step text default null,
  p_source_document_id uuid default null, p_source_locator text default null,
  p_source_excerpt text default null, p_statement_kind text default 'inference',
  p_source_reviewed boolean default false, p_supersedes_assessment_id uuid default null
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases;
  v_assessment public.assessments;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if nullif(btrim(p_title), '') is null or p_traffic_light is null
    or not (p_traffic_light = any(array['green','yellow','red','white'])) then
    raise exception using errcode = '22023', message = 'Assessment title and valid traffic light required';
  end if;
  if p_source_reviewed and p_source_document_id is null then
    raise exception using errcode = '22023', message = 'Checked source document required';
  end if;
  select * into v_case from public.cases where id = p_case_id and owner_id = v_uid for update;
  if not found then
    raise exception using errcode = '42501', message = 'Case not accessible';
  end if;
  insert into public.assessments(
    owner_id, case_id, title, traffic_light, reasoning, next_step,
    source_document_id, source_locator, source_excerpt, statement_kind,
    source_reviewed_at, supersedes_assessment_id
  ) values (
    v_uid, p_case_id, btrim(p_title), p_traffic_light,
    nullif(btrim(p_reasoning), ''), nullif(btrim(p_next_step), ''),
    p_source_document_id, nullif(btrim(p_source_locator), ''), nullif(btrim(p_source_excerpt), ''),
    p_statement_kind, case when p_source_reviewed then now() else null end, p_supersedes_assessment_id
  ) returning * into v_assessment;
  update public.cases set traffic_light = p_traffic_light, updated_at = now()
    where id = p_case_id and owner_id = v_uid returning * into v_case;
  return jsonb_build_object('assessment', to_jsonb(v_assessment), 'case', to_jsonb(v_case));
end;
$$;
revoke all on function public.validate_assessment_evidence_v135() from public, anon;
revoke all on function public.create_gold_assessment_v135(uuid,text,text,text,text,uuid,text,text,text,boolean,uuid) from public, anon;
grant execute on function public.create_gold_assessment_v135(uuid,text,text,text,text,uuid,text,text,text,boolean,uuid) to authenticated;
comment on column public.assessments.source_reviewed_at is 'User confirmed quote and location against the original; not a legal accuracy or success claim.';
