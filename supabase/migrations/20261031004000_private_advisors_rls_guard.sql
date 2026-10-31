-- Close the two remaining private-table RLS gaps without broadening access.
-- Neither table grants DML to anon/authenticated/service_role; both are owned by
-- postgres. Existing postgres-owned SECURITY DEFINER functions continue to run
-- with owner privileges (RLS is deliberately not FORCEd).
-- No data, policies, role grants or product behavior are changed.
ALTER TABLE private.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.advisor_referrals ENABLE ROW LEVEL SECURITY;
