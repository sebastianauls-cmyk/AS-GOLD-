-- The advertised saving must equal the difference between the two displayed,
-- cent-rounded totals. Rounding the unrounded percentage saving separately can
-- overstate the saving by EUR 0.01 (e.g. Start for three months).
-- Preserve the existing RPC signature, visibility, volatility and search path.
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
set search_path to 'private', 'public', 'auth', 'pg_temp'
as $$
  select p.plan_key, p.plan_name, p.rank, t.term_months, t.discount_percent,
         round(p.price_eur * t.term_months, 2) as regular_total,
         round(p.price_eur * t.term_months * (1 - t.discount_percent / 100.0), 2) as package_total,
         round(p.price_eur * t.term_months, 2)
           - round(p.price_eur * t.term_months * (1 - t.discount_percent / 100.0), 2) as savings
  from private.gold_plans p
  cross join private.gold_plan_terms t
  where p.active = true and p.plan_key <> 'free' and t.active = true
  order by p.rank, t.sort_order;
$$;

-- Abort the migration if any active tariff still advertises an impossible saving.
do $$
begin
  if exists (
    select 1 from public.gold_plan_prices()
    where savings is distinct from regular_total - package_total
  ) then
    raise exception 'Gold price display inconsistency: savings differ from cent-rounded totals';
  end if;
end
$$;
