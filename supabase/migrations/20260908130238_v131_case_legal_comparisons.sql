-- V131: Immutable, source-backed legal-jurisdiction comparison drafts per case.
-- Results are written only by the authenticated Edge Function. Customers can
-- read their own comparison history, but cannot forge or overwrite provenance.

create table if not exists public.legal_comparisons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  home_country text not null check (home_country ~ '^[A-Z]{2}$'),
  target_country text not null check (target_country ~ '^[A-Z]{2}$'),
  topic text not null check (topic in (
    'applicable_law_jurisdiction',
    'contract_consumer',
    'employment',
    'rent_property',
    'claims_payments',
    'insurance',
    'administrative_social',
    'travel_residence',
    'data_protection',
    'other'
  )),
  question text not null check (char_length(question) between 12 and 1200),
  output_language text not null check (output_language in ('de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi')),
  data_classification text not null check (data_classification in ('synthetic','anonymized')),
  status text not null default 'research_draft' check (status in ('research_draft','professionally_reviewed','superseded')),
  overall_light text not null default 'white' check (overall_light in ('green','yellow','red','white')),
  result jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  research_method text not null default 'official_primary_sources_web_search',
  model text,
  source_checked_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_comparisons_distinct_countries_v131 check (home_country <> target_country),
  constraint legal_comparisons_result_object_v131 check (jsonb_typeof(result)='object'),
  constraint legal_comparisons_sources_array_v131 check (jsonb_typeof(sources)='array')
);

comment on table public.legal_comparisons is
  'Immutable AI research drafts comparing two case jurisdictions from current official primary sources. A draft is not legal advice or professional approval.';
comment on column public.legal_comparisons.source_checked_at is
  'Time at which the official-source web research was performed; not a guarantee that every source was legally reviewed.';

create index if not exists legal_comparisons_owner_case_created_v131_idx
  on public.legal_comparisons (owner_id,case_id,created_at desc);

alter table public.legal_comparisons enable row level security;

drop policy if exists legal_comparisons_select_own_v131 on public.legal_comparisons;
create policy legal_comparisons_select_own_v131
on public.legal_comparisons for select to authenticated
using (
  (select auth.uid())=owner_id
  and (select private.gold_access_active())
  and exists (
    select 1 from public.cases c
    where c.id=legal_comparisons.case_id and c.owner_id=(select auth.uid())
  )
);

-- No INSERT/UPDATE/DELETE grant is given to authenticated users. The V131
-- Edge Function validates the caller and case through the caller-scoped client,
-- then persists the immutable result with the server secret.
revoke all on public.legal_comparisons from anon, authenticated;
grant select on public.legal_comparisons to authenticated;
grant select, insert, update, delete on public.legal_comparisons to service_role;
