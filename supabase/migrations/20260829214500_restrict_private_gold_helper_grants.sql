-- AS Gold V23: Restrict privileged private helper execution.
-- Internal plan permission changes are reserved for trusted backend operations.

alter default privileges in schema private
  revoke execute on functions from public;

revoke all on function private.gold_apply_plan_permissions(uuid, text)
  from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.gold_apply_plan_permissions(uuid, text)
  to service_role;

-- RLS policies call this user-scoped helper during authenticated uploads.
revoke all on function private.gold_document_upload_allowed()
  from public, anon;

grant execute on function private.gold_document_upload_allowed()
  to authenticated;
