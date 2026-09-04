create table if not exists public.improvement_proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  monitor_kind text not null check (monitor_kind in ('legal_monitor','competitor_monitor')),
  country_code text,
  title text not null,
  finding text not null,
  impact text,
  recommendation text not null,
  source_urls jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','implemented')),
  implementation_scope jsonb not null default '[]'::jsonb,
  implementation_ref text,
  approved_at timestamptz,
  rejected_at timestamptz,
  implemented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.improvement_proposals enable row level security;

drop policy if exists improvement_proposals_select_own on public.improvement_proposals;
create policy improvement_proposals_select_own on public.improvement_proposals
for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists improvement_proposals_insert_own on public.improvement_proposals;
create policy improvement_proposals_insert_own on public.improvement_proposals
for insert to authenticated with check ((select auth.uid()) = owner_id and status = 'pending');

drop policy if exists improvement_proposals_update_own on public.improvement_proposals;
create policy improvement_proposals_update_own on public.improvement_proposals
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create index if not exists improvement_proposals_owner_status_idx on public.improvement_proposals(owner_id,status,created_at desc);
create index if not exists improvement_proposals_monitor_idx on public.improvement_proposals(monitor_kind,country_code,created_at desc);
