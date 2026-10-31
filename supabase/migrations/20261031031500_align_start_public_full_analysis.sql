-- Reconcile the public Start capability flag with the approved three-tier
-- product contract and private.gold_plans.full_analysis=false.
-- This is idempotent and limited to an existing plan limit; no customer rows,
-- entitlements, payment records, privileges or policy definitions are touched.
UPDATE public.plan_limits
SET full_analysis = false,
    updated_at = now()
WHERE plan_id = 'gold_start'
  AND full_analysis IS DISTINCT FROM false;
