-- AS Gold V23 test configuration.
-- This is a temporary technical ceiling, not a final product or tariff limit.
-- Supabase Free currently permits at most 50 MB per file globally.

update storage.buckets
set file_size_limit = 52428800
where id = 'goldstandard-private';
