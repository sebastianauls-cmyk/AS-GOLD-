-- AS Gold V76: keep the controlled tester cohort at the agreed maximum.
-- The bearer code is deliberately not stored in migration source.
update private.gold_promo_codes
set max_redemptions = 10,
    updated_at = now()
where label = 'AS Gold Tester-Vollzugang 2026'
  and grant_plan_key = 'business'
  and grant_days = 30
  and active = true
  and (max_redemptions is null or max_redemptions > 10);
