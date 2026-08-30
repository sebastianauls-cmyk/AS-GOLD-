-- V29: cover foreign-key columns reported by the Supabase performance advisor.
-- These indexes reduce lookup and referential-action cost as the test data grows.

create index if not exists exports_case_id_v29_idx
  on public.exports (case_id);

create index if not exists exports_document_id_v29_idx
  on public.exports (document_id);

create index if not exists user_access_periods_plan_id_v29_idx
  on public.user_access_periods (plan_id);

create index if not exists user_access_periods_term_months_v29_idx
  on public.user_access_periods (term_months);
