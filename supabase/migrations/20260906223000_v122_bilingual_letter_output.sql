alter table public.documents
  add column if not exists customer_copy_language text;

alter table public.documents
  drop constraint if exists documents_customer_copy_language_v122_check;

alter table public.documents
  add constraint documents_customer_copy_language_v122_check
  check (
    customer_copy_language is null
    or customer_copy_language = any (array['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])
  );

comment on column public.documents.customer_copy_language is
  'Language code of customer_copy. Required by the V122 bilingual approval and export workflow.';
