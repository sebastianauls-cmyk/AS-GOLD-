-- pg_net's SQL objects use its own net schema, but its extension registration
-- should also be outside the exposed public namespace. It is non-relocatable.
-- This one-time rollout correction refuses to discard any queued work/logs.
-- Supabase's documented empty-queue repair: drop/recreate without CASCADE.
do $$
begin
  if exists(select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pg_net' and n.nspname='public') then
    lock table public.case_analysis_jobs in share row exclusive mode;
    if exists(select 1 from public.case_analysis_jobs) or exists(select 1 from net.http_request_queue) or exists(select 1 from net._http_response) then
      raise exception 'Refusing to reinstall pg_net while jobs or HTTP history exist';
    end if;
    drop extension pg_net;
    create extension pg_net with schema extensions;
  end if;
end $$;
