alter table public.documents
  add column if not exists source_language text,
  add column if not exists voice_context text,
  add column if not exists voice_language text,
  add column if not exists intake_quality jsonb not null default '{}'::jsonb;

comment on column public.documents.source_language is 'Detected or user-confirmed language of the source document.';
comment on column public.documents.voice_context is 'User-confirmed spoken context captured separately from extracted document text.';
comment on column public.documents.voice_language is 'BCP-47/browser locale used for the confirmed spoken context.';
comment on column public.documents.intake_quality is 'Client-side intake checks such as image dimensions, file type and review state.';
