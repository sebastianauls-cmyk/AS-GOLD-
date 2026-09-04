create table if not exists public.country_legal_modules (
  country_code text primary key,
  jurisdiction_label text not null,
  status text not null default 'setup_required' check (status in ('setup_required','source_review','baseline_review','ready','suspended')),
  official_sources jsonb not null default '[]'::jsonb,
  court_sources jsonb not null default '[]'::jsonb,
  authority_sources jsonb not null default '[]'::jsonb,
  covered_topics jsonb not null default '[]'::jsonb,
  affected_workflows jsonb not null default '[]'::jsonb,
  baseline_checked_at timestamptz,
  delta_checked_at timestamptz,
  next_delta_due_at timestamptz,
  source_reviewed_at timestamptz,
  source_reviewed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.country_legal_checks (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.country_legal_modules(country_code) on delete cascade,
  check_type text not null check (check_type in ('baseline','delta')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running','completed','failed','needs_review')),
  source_snapshot jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  affected_workflows jsonb not null default '[]'::jsonb,
  owner_notified_at timestamptz,
  owner_acknowledged_at timestamptz,
  proposal_id uuid references public.improvement_proposals(id),
  created_at timestamptz not null default now()
);

alter table public.country_legal_modules enable row level security;
alter table public.country_legal_checks enable row level security;

drop policy if exists country_legal_modules_owner_select on public.country_legal_modules;
drop policy if exists country_legal_modules_owner_write on public.country_legal_modules;
drop policy if exists country_legal_checks_owner_select on public.country_legal_checks;
drop policy if exists country_legal_checks_owner_write on public.country_legal_checks;

create policy country_legal_modules_owner_select on public.country_legal_modules for select to authenticated using ((select private.gold_is_owner()));
create policy country_legal_modules_owner_write on public.country_legal_modules for all to authenticated using ((select private.gold_is_owner())) with check ((select private.gold_is_owner()));
create policy country_legal_checks_owner_select on public.country_legal_checks for select to authenticated using ((select private.gold_is_owner()));
create policy country_legal_checks_owner_write on public.country_legal_checks for all to authenticated using ((select private.gold_is_owner())) with check ((select private.gold_is_owner()));

grant select, insert, update, delete on public.country_legal_modules to authenticated;
grant select, insert, update, delete on public.country_legal_checks to authenticated;

insert into public.country_legal_modules(country_code,jurisdiction_label,status)
values
('DE','Deutschland / deutsches Recht','source_review'),
('PL','Polen / polnischer Rechtsraum','setup_required'),
('FR','Frankreich / französischer Rechtsraum','setup_required'),
('TR','Türkei / türkischer Rechtsraum','setup_required'),
('GB','Vereinigtes Königreich','setup_required'),
('US','USA','setup_required'),
('RU','Russland / russischer Rechtsraum','setup_required'),
('RO','Rumänien / rumänischer Rechtsraum','setup_required'),
('BG','Bulgarien / bulgarischer Rechtsraum','setup_required'),
('VN','Vietnam / vietnamesischer Rechtsraum','setup_required'),
('SA','Saudi-Arabien','setup_required'),
('AE','Vereinigte Arabische Emirate','setup_required'),
('IR','Iran','setup_required'),
('AF','Afghanistan','setup_required')
on conflict (country_code) do nothing;
