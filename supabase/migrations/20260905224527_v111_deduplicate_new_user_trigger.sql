-- V111: A legacy V27 trigger and the canonical access trigger both invoke
-- private.handle_new_gold_user() after an auth user is inserted. The handler's
-- ON CONFLICT clause prevents duplicate rows, but each registration still
-- performs the same work twice and produces ambiguous audit evidence.
-- Keep the canonical trigger and remove only the obsolete V27 duplicate.

drop trigger if exists gold_v27_new_user_pending on auth.users;
