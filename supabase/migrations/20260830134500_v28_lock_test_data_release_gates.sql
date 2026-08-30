-- The controlled V28 test does not permit account-side release of real data or
-- special-category data. Keep both environment release gates false at the RLS
-- boundary even if a client calls the Data API directly.

drop policy if exists account_privacy_settings_update_own on public.account_privacy_settings;
create policy account_privacy_settings_update_own
on public.account_privacy_settings
for update
to authenticated
using (
  (select auth.uid())=owner_id
  and private.gold_access_active()
)
with check (
  (select auth.uid())=owner_id
  and private.gold_access_active()
  and real_data_authorized=false
  and special_categories_authorized=false
);

comment on column public.account_privacy_settings.real_data_authorized is
  'Environment release gate. Locked false by RLS throughout the controlled V28 test.';
comment on column public.account_privacy_settings.special_categories_authorized is
  'Environment release gate. Locked false by RLS throughout the controlled V28 test.';
