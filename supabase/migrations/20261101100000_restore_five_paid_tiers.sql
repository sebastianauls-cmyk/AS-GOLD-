-- Restore the approved five-tier ASH Workspace Gold ladder.
-- Enterprise / White-Label is contact-only and intentionally has no database plan.
-- Gold Professional remains inactive for historical references only.

update private.gold_plans
set rank=1,price_eur=19.90,term_days=30,document_limit=null,
    full_analysis=false,draft_letters=false,business_mode=false,active=true,updated_at=now()
where plan_key='start';

update private.gold_plans
set rank=2,price_eur=39.90,term_days=30,document_limit=null,
    full_analysis=false,draft_letters=false,business_mode=false,active=true,updated_at=now()
where plan_key='klar';

update private.gold_plans
set rank=3,price_eur=89.90,term_days=30,document_limit=null,
    full_analysis=true,draft_letters=false,business_mode=false,active=true,updated_at=now()
where plan_key='analyse';

update private.gold_plans
set rank=4,price_eur=249.90,term_days=30,document_limit=null,
    full_analysis=true,draft_letters=true,business_mode=false,active=true,updated_at=now()
where plan_key='komplett';

update private.gold_plans
set rank=5,price_eur=499.90,term_days=30,document_limit=null,
    full_analysis=true,draft_letters=true,business_mode=true,active=true,updated_at=now()
where plan_key='business';

update private.gold_plans
set rank=90,active=false,updated_at=now()
where plan_key='professional';

update public.pricing_plans
set display_name='Gold Start',monthly_price=19.90,sort_order=1,is_free=false,active=true,updated_at=now()
where plan_id='gold_start';

update public.pricing_plans
set display_name='Gold Klar',monthly_price=39.90,sort_order=2,is_free=false,active=true,updated_at=now()
where plan_id='gold_klar';

update public.pricing_plans
set display_name='Gold Analyse',monthly_price=89.90,sort_order=3,is_free=false,active=true,updated_at=now()
where plan_id='gold_analyse';

update public.pricing_plans
set display_name='Gold Komplett',monthly_price=249.90,sort_order=4,is_free=false,active=true,updated_at=now()
where plan_id='gold_komplett';

update public.pricing_plans
set display_name='Gold Business',monthly_price=499.90,sort_order=5,is_free=false,active=true,updated_at=now()
where plan_id='gold_business';

update public.pricing_plans
set sort_order=90,active=false,updated_at=now()
where plan_id='gold_professional';

insert into public.plan_limits(plan_id,max_uploaded_documents,full_analysis,matrix_result)
values
  ('gold_start',null,false,true),
  ('gold_klar',null,false,true),
  ('gold_analyse',null,true,true),
  ('gold_komplett',null,true,true),
  ('gold_business',null,true,true)
on conflict(plan_id) do update set
  max_uploaded_documents=excluded.max_uploaded_documents,
  full_analysis=excluded.full_analysis,
  matrix_result=excluded.matrix_result,
  updated_at=now();

create or replace function public.gold_available_upgrades()
returns table(plan_key text, plan_name text, price_eur numeric, rank integer, upgrade_difference numeric)
language sql
stable
security invoker
set search_path = ''
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
        when 'gold_klar' then 'klar'
        when 'gold_analyse' then 'analyse'
        when 'gold_komplett' then 'komplett'
        when 'gold_business' then 'business'
      end::text as plan_key,
      pp.display_name::text as plan_name,
      pp.monthly_price::numeric as price_eur,
      pp.sort_order::integer as rank
    from public.pricing_plans pp
    where pp.active is true
      and pp.plan_id in ('free','gold_start','gold_klar','gold_analyse','gold_komplett','gold_business')
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

revoke all on function public.gold_available_upgrades() from public;
revoke all on function public.gold_available_upgrades() from anon;
grant execute on function public.gold_available_upgrades() to authenticated;
