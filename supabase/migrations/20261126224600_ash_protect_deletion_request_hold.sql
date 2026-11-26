-- Preserve operator-controlled deletion holds and request metadata.
-- The customer repository only updates status and updated_at to cancel a request.
alter policy deletion_requests_update_own_cancel_only on public.deletion_requests
using (
  (select auth.uid()) = owner_id
  and status = 'requested'
  and legal_hold = false
  and confirmed_at is null
  and completed_at is null
)
with check (
  (select auth.uid()) = owner_id
  and status = 'cancelled'
  and legal_hold = false
  and confirmed_at is null
  and completed_at is null
);
revoke update on public.deletion_requests from authenticated;
grant update (status, updated_at) on public.deletion_requests to authenticated;
