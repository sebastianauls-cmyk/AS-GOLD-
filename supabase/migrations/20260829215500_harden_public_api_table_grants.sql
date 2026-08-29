-- AS Gold V23: Align API table grants with the operations exposed by RLS.

revoke truncate, references, trigger on all tables in schema public
  from anon, authenticated;

-- Export creation is user-scoped by exports_insert_own and owner_id defaults
-- to auth.uid(). Selection and updates are likewise restricted by RLS.
grant select, insert, update on table public.exports
  to authenticated;
