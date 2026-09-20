-- Keep a completed AI response recoverable without promoting it to reviewed data.
-- The existing document ownership policies and deletion lifecycle also apply here.
alter table public.documents add column if not exists analysis_draft jsonb;
alter table public.documents add constraint documents_analysis_draft_object
  check (analysis_draft is null or (jsonb_typeof(analysis_draft) = 'object' and octet_length(analysis_draft::text) <= 1048576));
comment on column public.documents.analysis_draft is
  'Provisional completed AI response for recovery after a lost connection. Not a reviewed source or approval. Cleared on a new analysis or deliberate document save.';
