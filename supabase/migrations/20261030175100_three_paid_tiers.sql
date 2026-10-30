-- Keep the public and entitlement model aligned with the three paid ASH Workspace Gold tiers.
-- Legacy tier rows remain inactive for historical references.

update private.gold_plans set rank=20,active=false,updated_at=now() where plan_key='klar';
update private.gold_plans set rank=30,active=false,updated_at=now() where plan_key='analyse';
update private.gold_plans set rank=40,active=false,updated_at=now() where plan_key='komplett';

insert into private.gold_plans(
  plan_key,plan_name,rank,price_eur,term_days,document_limit,full_analysis,draft_letters,business_mode,active,
  export_word,export_pdf,export_excel,export_pptx,export_csv,export_txt
) values (
  'professional','Gold Professional',2,89.90,30,null,true,true,false,true,
  true,true,true,true,true,true
)
on conflict (plan_key) do update set
  plan_name=excluded.plan_name,rank=excluded.rank,price_eur=excluded.price_eur,term_days=excluded.term_days,
  document_limit=excluded.document_limit,full_analysis=excluded.full_analysis,draft_letters=excluded.draft_letters,
  business_mode=excluded.business_mode,active=true,export_word=true,export_pdf=true,export_excel=true,
  export_pptx=true,export_csv=true,export_txt=true,updated_at=now();

update private.gold_plans set rank=3,price_eur=499.90,active=true,updated_at=now() where plan_key='business';

update public.pricing_plans set active=false,sort_order=20,updated_at=now() where plan_id='gold_klar';
update public.pricing_plans set active=false,sort_order=30,updated_at=now() where plan_id='gold_analyse';
update public.pricing_plans set active=false,sort_order=40,updated_at=now() where plan_id='gold_komplett';

insert into public.pricing_plans(plan_id,display_name,monthly_price,sort_order,is_free,active)
values('gold_professional','Gold Professional',89.90,2,false,true)
on conflict(plan_id) do update set display_name=excluded.display_name,monthly_price=excluded.monthly_price,
sort_order=excluded.sort_order,is_free=false,active=true,updated_at=now();

update public.pricing_plans set sort_order=3,monthly_price=499.90,active=true,updated_at=now() where plan_id='gold_business';

insert into public.plan_limits(plan_id,max_uploaded_documents,full_analysis,matrix_result)
values('gold_professional',null,true,true)
on conflict(plan_id) do update set max_uploaded_documents=null,full_analysis=true,matrix_result=true,updated_at=now();

create or replace function public.gold_available_upgrades()
returns table(plan_key text, plan_name text, price_eur numeric, rank integer, upgrade_difference numeric)
language sql
stable
set search_path to 'public','auth','pg_temp'
as $$
  with access_row as (
    select coalesce(permissions->>'tier','free') as tier
    from public.current_gold_access()
    limit 1
  ),
  plans as (
    select gp.plan_key,gp.plan_name,gp.price_eur,gp.rank
    from private.gold_plans gp
    where gp.active=true and gp.plan_key in ('free','start','professional','business')
  ),
  current_plan as (
    select
      coalesce((select rank from plans where plan_key=(select tier from access_row)),0) as rank,
      coalesce((select price_eur from plans where plan_key=(select tier from access_row)),0) as price_eur
  )
  select p.plan_key,p.plan_name,p.price_eur,p.rank,round(greatest(p.price_eur-c.price_eur,0),2)
  from plans p, current_plan c
  where auth.uid() is not null and p.rank>c.rank
  order by p.rank;
$$;
