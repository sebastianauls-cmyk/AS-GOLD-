-- Repair a production 403 on authenticated gold_available_upgrades().
-- The security-invoker RPC used private.gold_plans, which intentionally has
-- neither authenticated SELECT privilege nor RLS read policies.
-- Reuse the already public, active pricing catalog; do not broaden private grants
-- or turn this RPC into a SECURITY DEFINER function.
create or replace function public.gold_available_upgrades()
returns table(plan_key text, plan_name text, price_eur numeric, rank integer, upgrade_difference numeric)
language sql
stable
set search_path to ''
as $$
  with access_row as (
    select coalesce(permissions->>'tier','free') as tier
    from public.current_gold_access()
    limit 1
  ),
  plans as (
    select
      case pp.plan_id
        when 'free' then 'free'
        when 'gold_start' then 'start'
        when 'gold_professional' then 'professional'
        when 'gold_business' then 'business'
      end::text as plan_key,
      pp.display_name::text as plan_name,
      pp.monthly_price::numeric as price_eur,
      pp.sort_order::integer as rank
    from public.pricing_plans pp
    where pp.active is true
      and pp.plan_id in ('free','gold_start','gold_professional','gold_business')
  ),
  current_plan as (
    select
      coalesce((select rank from plans where plan_key=(select tier from access_row)),0) as rank,
      coalesce((select price_eur from plans where plan_key=(select tier from access_row)),0) as price_eur
  )
  select p.plan_key,p.plan_name,p.price_eur,p.rank,
         round(greatest(p.price_eur-c.price_eur,0),2)
  from plans p cross join current_plan c
  where auth.uid() is not null
    and p.rank>c.rank
  order by p.rank;
$$;
