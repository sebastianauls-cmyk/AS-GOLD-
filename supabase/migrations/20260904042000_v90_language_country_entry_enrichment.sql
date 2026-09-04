alter table public.country_legal_modules
  add column if not exists entry_sources jsonb not null default '[]'::jsonb,
  add column if not exists residence_sources jsonb not null default '[]'::jsonb,
  add column if not exists entry_requirements_verified boolean not null default false,
  add column if not exists residence_requirements_verified boolean not null default false,
  add column if not exists entry_checked_at timestamptz,
  add column if not exists residence_checked_at timestamptz;

comment on column public.country_legal_modules.entry_sources is 'Verified official sources for entry and border requirements.';
comment on column public.country_legal_modules.residence_sources is 'Verified official sources for residence/immigration requirements.';
comment on column public.country_legal_modules.entry_requirements_verified is 'True only after official entry sources have been reviewed.';
comment on column public.country_legal_modules.residence_requirements_verified is 'True only after official residence/immigration sources have been reviewed.';
