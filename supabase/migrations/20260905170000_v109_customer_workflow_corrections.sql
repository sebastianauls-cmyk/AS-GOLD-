-- V109: persist per-case jurisdiction/test context and the complete reviewed
-- document-analysis handoff used by assessment, approval and export modules.

alter table public.cases
  add column if not exists home_country text not null default 'DE',
  add column if not exists target_country text not null default 'DE',
  add column if not exists test_case_id text,
  add column if not exists test_case_expected_ampel text,
  add column if not exists test_case_language text;

alter table public.cases
  drop constraint if exists cases_home_country_v109_check,
  drop constraint if exists cases_target_country_v109_check,
  drop constraint if exists cases_test_case_id_v109_check,
  drop constraint if exists cases_traffic_light_check;

alter table public.cases
  add constraint cases_home_country_v109_check check (home_country ~ '^[A-Z]{2}$'),
  add constraint cases_target_country_v109_check check (target_country ~ '^[A-Z]{2}$'),
  add constraint cases_test_case_id_v109_check check (test_case_id is null or test_case_id ~ '^ST[0-9]{2}$'),
  add constraint cases_traffic_light_check check (traffic_light = any (array['green','yellow','red','white']));

alter table public.assessments
  drop constraint if exists assessments_traffic_light_check;

alter table public.assessments
  add constraint assessments_traffic_light_check check (traffic_light = any (array['green','yellow','red','white']));

alter table public.documents
  add column if not exists response_letter_de text,
  add column if not exists customer_copy text,
  add column if not exists response_recipient text,
  add column if not exists response_subject text,
  add column if not exists analysis_traffic_light text,
  add column if not exists analysis_reasoning text,
  add column if not exists analysis_confidence text;

alter table public.documents
  drop constraint if exists documents_analysis_traffic_light_v109_check,
  drop constraint if exists documents_analysis_confidence_v109_check;

alter table public.documents
  add constraint documents_analysis_traffic_light_v109_check check (analysis_traffic_light is null or analysis_traffic_light = any (array['green','yellow','red','white'])),
  add constraint documents_analysis_confidence_v109_check check (analysis_confidence is null or analysis_confidence = any (array['hoch','mittel','niedrig']));

create index if not exists cases_owner_target_country_v109_idx
  on public.cases (owner_id, target_country, updated_at desc);

create or replace function public.create_gold_assessment(
  p_case_id uuid,
  p_title text,
  p_traffic_light text,
  p_reasoning text default null,
  p_next_step text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases;
  v_assessment public.assessments;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_case_id is null then
    raise exception using errcode = '22023', message = 'Case is required';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception using errcode = '22023', message = 'Assessment title is required';
  end if;
  if p_traffic_light is null
     or not (p_traffic_light = any (array['green','yellow','red','white'])) then
    raise exception using errcode = '22023', message = 'Invalid traffic light';
  end if;

  select * into v_case
  from public.cases
  where id = p_case_id and owner_id = v_uid
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Case not accessible';
  end if;

  insert into public.assessments (
    owner_id, case_id, title, traffic_light, reasoning, next_step
  ) values (
    v_uid,
    p_case_id,
    btrim(p_title),
    p_traffic_light,
    nullif(btrim(coalesce(p_reasoning, '')), ''),
    nullif(btrim(coalesce(p_next_step, '')), '')
  ) returning * into v_assessment;

  update public.cases
  set traffic_light = p_traffic_light,
      updated_at = now()
  where id = p_case_id and owner_id = v_uid
  returning * into v_case;

  return jsonb_build_object(
    'assessment', to_jsonb(v_assessment),
    'case', to_jsonb(v_case)
  );
end;
$$;

revoke all on function public.create_gold_assessment(uuid,text,text,text,text)
  from public, anon;
grant execute on function public.create_gold_assessment(uuid,text,text,text,text)
  to authenticated;

comment on column public.cases.target_country is
  'Persisted jurisdiction context restored whenever the case or a linked document is opened.';
comment on column public.documents.response_letter_de is
  'Reviewed German response draft transferred into the explicit approval preview.';
