-- AS Gold V24 defense in depth.
-- The API roles currently have no table privileges here. RLS adds a second
-- barrier if grants change later. No user-facing policy is intentionally added.

revoke all on table
  private.pending_owner_access,
  private.gold_plans,
  private.gold_plan_terms
from anon, authenticated;

alter table private.pending_owner_access enable row level security;
alter table private.gold_plans enable row level security;
alter table private.gold_plan_terms enable row level security;
