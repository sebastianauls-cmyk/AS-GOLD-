-- V132: dedicated internal change-control module for the shared team account.
-- Password 1 opens the shared internal account. Team members may submit complete
-- whole-product change drafts. Only the server-side Password-2 route may release
-- one immutable draft as a new live version.

-- The one-time setup keeps the shared access password in Supabase Auth and only
-- a salted scrypt hash of Sebastian's separate programming master password here.
-- This table has no browser policies and is readable only with the server secret.
create table if not exists public.team_account_security (
  singleton_key text primary key default 'primary' check (singleton_key = 'primary'),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  master_password_hash text not null check (
    master_password_hash ~ '^scrypt:[0-9a-f]{48}:[0-9a-f]{128}$'
  ),
  setup_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.team_account_security is
  'Server-only singleton for the shared team account and Sebastian live-version master verification.';
comment on column public.team_account_security.master_password_hash is
  'Salted scrypt hash only. The plain master password is never stored.';

alter table public.team_account_security enable row level security;
revoke all on table public.team_account_security from public, anon, authenticated;
grant all on table public.team_account_security to service_role;

create table if not exists public.internal_change_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null check (char_length(btrim(requester_name)) between 2 and 120),
  product_area text not null check (char_length(btrim(product_area)) between 2 and 120),
  title text not null check (char_length(btrim(title)) between 4 and 180),
  requested_change text not null check (char_length(btrim(requested_change)) between 10 and 5000),
  reason text not null check (char_length(btrim(reason)) between 4 and 3000),
  preparation_notes text check (preparation_notes is null or char_length(preparation_notes) <= 5000),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'requested' check (status in ('requested','released','rejected','published')),
  released_by text,
  released_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  published_at timestamptz,
  publication_ref text check (
    publication_ref is null or char_length(btrim(publication_ref)) between 2 and 500
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_change_requests_decision_state_check check (
    (status = 'requested'
      and released_by is null and released_at is null
      and rejected_by is null and rejected_at is null
      and published_at is null and publication_ref is null)
    or (status = 'released'
      and released_by is not null and released_at is not null
      and rejected_by is null and rejected_at is null
      and published_at is null and publication_ref is null)
    or (status = 'rejected'
      and rejected_by is not null and rejected_at is not null
      and released_by is null and released_at is null
      and published_at is null and publication_ref is null)
    or (status = 'published'
      and released_by is not null and released_at is not null
      and rejected_by is null and rejected_at is null
      and published_at is not null and publication_ref is not null)
  )
);

comment on table public.internal_change_requests is
  'Shared-team drafts for changes to any part of AS Workspace. Browser sessions can submit and read; Password-2 live release and publication recording are server-only.';
comment on column public.internal_change_requests.requester_name is
  'Required human name because all internal team members deliberately use one shared authentication account.';

alter table public.internal_change_requests enable row level security;

drop policy if exists internal_change_requests_select_team on public.internal_change_requests;
create policy internal_change_requests_select_team
on public.internal_change_requests
for select
to authenticated
using (
  (select auth.uid()) = owner_id
  and (select private.gold_is_owner())
  and (select private.gold_access_active())
);

drop policy if exists internal_change_requests_insert_team on public.internal_change_requests;
create policy internal_change_requests_insert_team
on public.internal_change_requests
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and (select private.gold_is_owner())
  and (select private.gold_access_active())
  and status = 'requested'
  and released_by is null and released_at is null
  and rejected_by is null and rejected_at is null
  and published_at is null and publication_ref is null
);

revoke all on table public.internal_change_requests from public, anon, authenticated;
grant select, insert on table public.internal_change_requests to authenticated;
grant all on table public.internal_change_requests to service_role;

create index if not exists internal_change_requests_owner_status_created_idx
  on public.internal_change_requests(owner_id,status,created_at desc);

-- Server-only brute-force lock state for the separate master password.
create table if not exists public.internal_master_auth_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  failed_attempts integer not null default 0 check (failed_attempts between 0 and 1000),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.internal_master_auth_state enable row level security;
revoke all on table public.internal_master_auth_state from public, anon, authenticated;
grant all on table public.internal_master_auth_state to service_role;

create or replace function public.record_internal_master_failure(p_owner_id uuid)
returns table(failed_attempts integer, locked_until timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
begin
  insert into public.internal_master_auth_state as state (
    owner_id, failed_attempts, window_started_at, locked_until, updated_at
  ) values (
    p_owner_id, 1, v_now, null, v_now
  )
  on conflict (owner_id) do update set
    failed_attempts = case
      when state.window_started_at < v_now - interval '15 minutes' then 1
      else state.failed_attempts + 1
    end,
    window_started_at = case
      when state.window_started_at < v_now - interval '15 minutes' then v_now
      else state.window_started_at
    end,
    locked_until = case
      when (
        case when state.window_started_at < v_now - interval '15 minutes' then 1 else state.failed_attempts + 1 end
      ) >= 5 then v_now + interval '15 minutes'
      else state.locked_until
    end,
    updated_at = v_now;

  return query
    select state.failed_attempts,state.locked_until
    from public.internal_master_auth_state state
    where state.owner_id=p_owner_id;
end;
$$;

create or replace function public.clear_internal_master_failures(p_owner_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.internal_master_auth_state where owner_id=p_owner_id;
$$;

create or replace function public.apply_internal_change_decision(
  p_request_id uuid,
  p_owner_id uuid,
  p_action text,
  p_actor_label text
)
returns public.internal_change_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.internal_change_requests;
  v_now timestamptz := now();
begin
  if p_actor_label is null or char_length(btrim(p_actor_label)) not between 2 and 120 then
    raise exception using errcode='22023',message='Invalid approving person';
  end if;

  select * into v_row
  from public.internal_change_requests
  where id=p_request_id and owner_id=p_owner_id
  for update;

  if v_row.id is null then
    raise exception using errcode='P0002',message='Change request not found';
  end if;

  if p_action='release' and v_row.status='requested' then
    update public.internal_change_requests
    set status='released',released_by=btrim(p_actor_label),released_at=v_now,updated_at=v_now
    where id=v_row.id
    returning * into v_row;
  elsif p_action='reject' and v_row.status='requested' then
    update public.internal_change_requests
    set status='rejected',rejected_by=btrim(p_actor_label),rejected_at=v_now,updated_at=v_now
    where id=v_row.id
    returning * into v_row;
  else
    raise exception using errcode='22023',message='Invalid change-request transition';
  end if;

  return v_row;
end;
$$;

-- Called only by the trusted deployment process after a real production
-- publication succeeds. Password 1 cannot mark a request as published.
create or replace function public.record_internal_change_publication(
  p_request_id uuid,
  p_owner_id uuid,
  p_publication_ref text
)
returns public.internal_change_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.internal_change_requests;
  v_now timestamptz := now();
begin
  if p_publication_ref is null or char_length(btrim(p_publication_ref)) not between 2 and 500 then
    raise exception using errcode='22023',message='Invalid publication reference';
  end if;

  select * into v_row
  from public.internal_change_requests
  where id=p_request_id and owner_id=p_owner_id
  for update;

  if v_row.id is null then
    raise exception using errcode='P0002',message='Change request not found';
  end if;

  if v_row.status<>'released' then
    raise exception using errcode='22023',message='Change request is not released for publication';
  end if;

  update public.internal_change_requests
  set status='published',published_at=v_now,publication_ref=btrim(p_publication_ref),updated_at=v_now
  where id=v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_internal_master_failure(uuid) from public, anon, authenticated;
revoke all on function public.clear_internal_master_failures(uuid) from public, anon, authenticated;
revoke all on function public.apply_internal_change_decision(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.record_internal_change_publication(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.record_internal_master_failure(uuid) to service_role;
grant execute on function public.clear_internal_master_failures(uuid) to service_role;
grant execute on function public.apply_internal_change_decision(uuid,uuid,text,text) to service_role;
grant execute on function public.record_internal_change_publication(uuid,uuid,text) to service_role;
