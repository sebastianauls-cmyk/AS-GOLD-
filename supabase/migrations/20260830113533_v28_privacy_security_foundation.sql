-- V28 source parity for the privacy foundation already applied to production.
-- The test environment permits only synthetic or effectively anonymized data.

create table if not exists public.account_privacy_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  privacy_notice_version text,
  privacy_notice_acknowledged_at timestamptz,
  terms_version text,
  terms_acknowledged_at timestamptz,
  real_data_authorized boolean not null default false,
  ai_processing_enabled boolean not null default false,
  special_categories_authorized boolean not null default false,
  retention_days integer not null default 90 check (retention_days in (30,60,90,180,365)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.account_privacy_settings is
  'User-scoped privacy controls. Environment release gates remain authoritative.';

alter table public.documents add column if not exists data_classification text not null default 'unclassified';
alter table public.documents add column if not exists processing_basis text;
alter table public.documents add column if not exists privacy_notice_version text;
alter table public.documents add column if not exists ai_processing_allowed boolean not null default false;
alter table public.documents add column if not exists ai_last_processed_at timestamptz;
alter table public.documents add column if not exists ai_notice_version text;
alter table public.documents add column if not exists ai_provider text;
alter table public.documents add column if not exists retention_until timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='documents_data_classification_v28_check') then
    alter table public.documents add constraint documents_data_classification_v28_check
      check (data_classification in ('unclassified','synthetic','anonymized','personal','special'));
  end if;
  if not exists (select 1 from pg_constraint where conname='documents_processing_basis_v28_check') then
    alter table public.documents add constraint documents_processing_basis_v28_check
      check (processing_basis is null or processing_basis in ('contract','legal_obligation','legitimate_interest','consent','legal_claims'));
  end if;
end $$;

comment on column public.documents.data_classification is
  'unclassified, synthetic, anonymized, personal or special; required before AI processing.';
comment on column public.documents.ai_processing_allowed is
  'Per-document user choice. Account choice and server release gates are additionally required.';

alter table public.account_privacy_settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='account_privacy_settings' and policyname='account_privacy_settings_select_own') then
    create policy account_privacy_settings_select_own on public.account_privacy_settings for select to authenticated
      using ((select auth.uid())=owner_id and private.gold_access_active());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='account_privacy_settings' and policyname='account_privacy_settings_insert_own') then
    create policy account_privacy_settings_insert_own on public.account_privacy_settings for insert to authenticated
      with check ((select auth.uid())=owner_id and private.gold_access_active() and real_data_authorized=false and special_categories_authorized=false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='account_privacy_settings' and policyname='account_privacy_settings_update_own') then
    create policy account_privacy_settings_update_own on public.account_privacy_settings for update to authenticated
      using ((select auth.uid())=owner_id and private.gold_access_active())
      with check ((select auth.uid())=owner_id and private.gold_access_active());
  end if;
end $$;

create or replace function private.gold_set_updated_at_v28()
returns trigger language plpgsql set search_path=pg_catalog,public,private as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists account_privacy_settings_updated_at_v28 on public.account_privacy_settings;
create trigger account_privacy_settings_updated_at_v28 before update on public.account_privacy_settings
for each row execute function private.gold_set_updated_at_v28();

revoke all on public.account_privacy_settings from anon;
grant select,insert,update on public.account_privacy_settings to authenticated;
