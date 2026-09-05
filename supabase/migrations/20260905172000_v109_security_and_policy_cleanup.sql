-- V109: keep the privileged advisor lookup outside the exposed API schema and
-- remove overlapping SELECT policies from country-maintenance tables.

create or replace function private.recommend_advisor_impl(
  p_case_id uuid,
  p_topic text,
  p_region text default null,
  p_language text default 'de',
  p_requested_by_user boolean default true,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_advisor private.advisors%rowtype;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.cases c where c.id = p_case_id and c.owner_id = v_uid) then
    raise exception 'case_not_found_or_forbidden';
  end if;

  select a.* into v_advisor
  from private.advisors a
  where a.active = true
    and a.accepts_new_clients = true
    and (cardinality(a.languages) = 0 or lower(coalesce(p_language,'de')) = any (select lower(x) from unnest(a.languages) x) or 'de' = any (select lower(x) from unnest(a.languages) x))
    and (cardinality(a.regions) = 0 or p_region is null or exists (select 1 from unnest(a.regions) r where lower(coalesce(p_region,'')) like '%' || lower(r) || '%' or lower(r) like '%' || lower(coalesce(p_region,'')) || '%'))
    and (cardinality(a.specialties) = 0 or exists (select 1 from unnest(a.specialties) s where lower(coalesce(p_topic,'')) like '%' || lower(s) || '%' or lower(s) like '%' || lower(coalesce(p_topic,'')) || '%') or exists (select 1 from unnest(a.keywords) k where lower(coalesce(p_topic,'')) like '%' || lower(k) || '%'))
  order by a.priority asc, a.created_at asc
  limit 1;

  if v_advisor.id is null then return jsonb_build_object('found',false,'message','Derzeit ist kein passender Berater hinterlegt.'); end if;
  v_result := jsonb_build_object('found',true,'name',v_advisor.display_name,'type',v_advisor.advisor_type,'organization',v_advisor.organization,'email',v_advisor.email,'phone',v_advisor.phone,'website',v_advisor.website,'city',v_advisor.city);
  insert into private.advisor_referrals(owner_id,case_id,advisor_id,topic,region,language,requested_by_user,trigger_reason,recommendation_snapshot)
  values(v_uid,p_case_id,v_advisor.id,coalesce(p_topic,''),p_region,coalesce(p_language,'de'),p_requested_by_user,p_reason,v_result);
  return v_result;
end;
$$;

revoke all on function private.recommend_advisor_impl(uuid,text,text,text,boolean,text) from public, anon;
grant execute on function private.recommend_advisor_impl(uuid,text,text,text,boolean,text) to authenticated;

create or replace function public.recommend_advisor(
  p_case_id uuid,
  p_topic text,
  p_region text default null,
  p_language text default 'de',
  p_requested_by_user boolean default true,
  p_reason text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.recommend_advisor_impl(p_case_id,p_topic,p_region,p_language,p_requested_by_user,p_reason)
$$;

revoke all on function public.recommend_advisor(uuid,text,text,text,boolean,text) from public, anon;
grant execute on function public.recommend_advisor(uuid,text,text,text,boolean,text) to authenticated;

drop policy if exists country_legal_modules_owner_write on public.country_legal_modules;
create policy country_legal_modules_owner_insert on public.country_legal_modules for insert to authenticated with check ((select private.gold_is_owner()));
create policy country_legal_modules_owner_update on public.country_legal_modules for update to authenticated using ((select private.gold_is_owner())) with check ((select private.gold_is_owner()));
create policy country_legal_modules_owner_delete on public.country_legal_modules for delete to authenticated using ((select private.gold_is_owner()));

drop policy if exists country_legal_checks_owner_write on public.country_legal_checks;
create policy country_legal_checks_owner_insert on public.country_legal_checks for insert to authenticated with check ((select private.gold_is_owner()));
create policy country_legal_checks_owner_update on public.country_legal_checks for update to authenticated using ((select private.gold_is_owner())) with check ((select private.gold_is_owner()));
create policy country_legal_checks_owner_delete on public.country_legal_checks for delete to authenticated using ((select private.gold_is_owner()));

create index if not exists country_legal_checks_country_code_v109_idx on public.country_legal_checks(country_code);
create index if not exists country_legal_checks_proposal_id_v109_idx on public.country_legal_checks(proposal_id) where proposal_id is not null;
create index if not exists country_legal_modules_reviewed_by_v109_idx on public.country_legal_modules(source_reviewed_by) where source_reviewed_by is not null;
create index if not exists advisor_referrals_advisor_v109_idx on private.advisor_referrals(advisor_id);
