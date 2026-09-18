-- Generated content is immutable to clients. The authenticated function records
-- confirmed progress separately, preserving the original plan and its sources.
create table public.case_roadmaps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  output_language text not null check (output_language in ('de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi')),
  reference_language text not null check (reference_language in ('de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi')),
  style jsonb not null check (jsonb_typeof(style)='object'),
  result jsonb not null check (jsonb_typeof(result)='object'),
  source_fingerprint text not null check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  source_documents jsonb not null check (jsonb_typeof(source_documents)='array'),
  progress jsonb not null default '{}'::jsonb check (jsonb_typeof(progress)='object'),
  events jsonb not null default '[]'::jsonb check (jsonb_typeof(events)='array'),
  model text not null,
  workflow_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index case_roadmaps_owner_case_created_idx on public.case_roadmaps(owner_id,case_id,created_at desc);
alter table public.case_roadmaps enable row level security;
create policy case_roadmaps_select_own on public.case_roadmaps for select to authenticated
using (
  (select auth.uid())=owner_id and (select private.gold_access_active())
  and exists(select 1 from public.cases c where c.id=case_roadmaps.case_id and c.owner_id=(select auth.uid()))
);
revoke all on public.case_roadmaps from anon, authenticated;
grant select on public.case_roadmaps to authenticated;
grant select,insert,update,delete on public.case_roadmaps to service_role;
comment on table public.case_roadmaps is 'Case-wide customer roadmaps, separate formal draft letters, source snapshots and confirmed step history. No automatic external sending.';
