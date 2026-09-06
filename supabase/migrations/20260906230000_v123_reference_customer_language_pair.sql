alter table public.documents
  add column if not exists reference_copy text,
  add column if not exists reference_copy_language text;

alter table public.documents
  drop constraint if exists documents_reference_copy_language_v123_check;

alter table public.documents
  add constraint documents_reference_copy_language_v123_check
  check (
    reference_copy_language is null
    or reference_copy_language = any (array['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])
  );

update public.documents
set
  reference_copy = coalesce(nullif(btrim(reference_copy), ''), nullif(btrim(response_letter_de), '')),
  reference_copy_language = coalesce(reference_copy_language, case when nullif(btrim(response_letter_de), '') is not null then 'de' end)
where
  reference_copy is null
  or reference_copy_language is null;

comment on column public.documents.reference_copy is
  'Reviewed reference version of the response letter in reference_copy_language. Replaces the German-only response_letter_de field for V123 and later.';

comment on column public.documents.reference_copy_language is
  'Language code of the reviewed reference response. Paired independently with customer_copy_language.';

comment on column public.documents.response_letter_de is
  'Legacy German response field retained for backward compatibility. Use reference_copy and reference_copy_language for V123 and later.';
