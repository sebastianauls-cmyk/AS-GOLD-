alter table public.improvement_proposals
  add column if not exists owner_notified_at timestamptz,
  add column if not exists owner_acknowledged_at timestamptz,
  add column if not exists audience_notified_at timestamptz;

drop policy if exists improvement_proposals_update_own on public.improvement_proposals;
create policy improvement_proposals_update_owner_only
on public.improvement_proposals
for update
to authenticated
using (
  (select auth.uid()) = owner_id
  and private.gold_is_owner()
)
with check (
  (select auth.uid()) = owner_id
  and private.gold_is_owner()
  and (
    status = 'pending'
    or (
      status in ('approved','rejected','implemented')
      and owner_notified_at is not null
      and owner_acknowledged_at is not null
    )
  )
  and (
    audience_notified_at is null
    or owner_acknowledged_at is not null
  )
);

create or replace function public.mark_improvement_proposal_owner_notified(p_id uuid)
returns public.improvement_proposals
language plpgsql
security invoker
set search_path = public, private, auth, pg_temp
as $$
declare
  v_row public.improvement_proposals;
begin
  if not private.gold_is_owner() then
    raise exception 'Only the primary app owner may receive/acknowledge approval proposals';
  end if;
  update public.improvement_proposals
  set owner_notified_at = coalesce(owner_notified_at, now()), updated_at = now()
  where id = p_id and owner_id = auth.uid()
  returning * into v_row;
  if v_row.id is null then raise exception 'Proposal not found'; end if;
  return v_row;
end;
$$;

create or replace function public.acknowledge_improvement_proposal(p_id uuid)
returns public.improvement_proposals
language plpgsql
security invoker
set search_path = public, private, auth, pg_temp
as $$
declare
  v_row public.improvement_proposals;
begin
  if not private.gold_is_owner() then
    raise exception 'Only the primary app owner may acknowledge proposals';
  end if;
  update public.improvement_proposals
  set owner_notified_at = coalesce(owner_notified_at, now()), owner_acknowledged_at = coalesce(owner_acknowledged_at, now()), updated_at = now()
  where id = p_id and owner_id = auth.uid()
  returning * into v_row;
  if v_row.id is null then raise exception 'Proposal not found'; end if;
  return v_row;
end;
$$;

create or replace function public.mark_improvement_proposal_audience_notified(p_id uuid)
returns public.improvement_proposals
language plpgsql
security invoker
set search_path = public, private, auth, pg_temp
as $$
declare
  v_row public.improvement_proposals;
begin
  if not private.gold_is_owner() then
    raise exception 'Only the primary app owner may release proposal information';
  end if;
  update public.improvement_proposals
  set audience_notified_at = coalesce(audience_notified_at, now()), updated_at = now()
  where id = p_id and owner_id = auth.uid() and owner_acknowledged_at is not null
  returning * into v_row;
  if v_row.id is null then raise exception 'Owner acknowledgement required before notifying others'; end if;
  return v_row;
end;
$$;

revoke all on function public.mark_improvement_proposal_owner_notified(uuid) from public, anon;
revoke all on function public.acknowledge_improvement_proposal(uuid) from public, anon;
revoke all on function public.mark_improvement_proposal_audience_notified(uuid) from public, anon;
grant execute on function public.mark_improvement_proposal_owner_notified(uuid) to authenticated;
grant execute on function public.acknowledge_improvement_proposal(uuid) to authenticated;
grant execute on function public.mark_improvement_proposal_audience_notified(uuid) to authenticated;
