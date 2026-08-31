-- V31: cover the promo-code foreign key used by validation and future cleanup.
create index if not exists upgrade_requests_promo_code_id_v31_idx
  on public.upgrade_requests(promo_code_id)
  where promo_code_id is not null;
