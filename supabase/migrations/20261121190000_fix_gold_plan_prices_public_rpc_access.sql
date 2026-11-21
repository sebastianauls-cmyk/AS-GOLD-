-- Fix the published read-only Gold price RPC for anon/authenticated callers.
-- Prior SECURITY INVOKER implementation read private.gold_plans and
-- private.gold_plan_terms; those roles cannot SELECT the private tables.
-- Reuse the existing RLS-readable public tariff catalogue instead.
-- Verified before migration: all 20 results match the private catalogue
-- exactly, including cent-rounded totals and savings.
create or replace function public.gold_plan_prices()
returns table(
  plan_key text,
  plan_name text,
  rank integer,
  term_months integer,
  discount_percent numeric,
  regular_total numeric,
  package_total numeric,
  savings numeric
)
language sql
stable
set search_path to ''
as $$
  select regexp_replace(p.plan_id, '^gold_', '') as plan_key,
         p.display_name as plan_name,
         p.sort_order as rank,
         t.term_months,
         t.discount_percent,
         round(p.monthly_price * t.term_months, 2) as regular_total,
         round(p.monthly_price * t.term_months * (1 - t.discount_percent / 100.0), 2) as package_total,
         round(p.monthly_price * t.term_months, 2)
           - round(p.monthly_price * t.term_months * (1 - t.discount_percent / 100.0), 2) as savings
  from public.pricing_plans p
  cross join public.pricing_terms t
  where p.active = true and p.is_free = false and t.active = true
  order by p.sort_order, t.term_months;
$$;

-- Do not silently publish missing or mathematically inconsistent prices.
do $$
begin
  if (select count(*) from public.gold_plan_prices()) <> 20
     or exists (
       select 1 from public.gold_plan_prices()
       where savings is distinct from regular_total - package_total
          or package_total < 0
     ) then
    raise exception 'Public Gold price RPC acceptance check failed';
  end if;
end
$$;
