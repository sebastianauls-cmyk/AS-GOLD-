-- An approved preview must point at an actual approved revision.
-- SQL CHECK accepts UNKNOWN, so equality alone did not reject a NULL revision.
alter table public.approvals
  add constraint approvals_approved_revision_required_check
  check (status <> 'approved' or approved_revision is not null);

-- Verify actual constraints on an isolated temporary clone, not customer records.
do $test$
declare
  sample record;
  accepted boolean;
begin
  create temporary table ash_approval_revision_regression
    (like public.approvals including defaults including constraints)
    on commit drop;
  for sample in
    select * from (values
      ('start_pending', 'pending', true, 1, null::integer, false, true),
      ('professional_null_revision', 'approved', true, 1, null, true, false),
      ('business_current_revision', 'approved', true, 2, 2, true, true),
      ('business_stale_revision', 'approved', true, 2, 1, true, false),
      ('missing_timestamp', 'approved', true, 1, 1, false, false),
      ('rejected_with_revision', 'rejected', true, 1, 1, false, false),
      ('preview_bypass', 'approved', false, 1, 1, true, false),
      ('rejected_clean', 'rejected', true, 1, null, false, true)
    ) as s(label, state, required, revision, approved, timestamp_present, expected)
  loop
    accepted := true;
    begin
      insert into pg_temp.ash_approval_revision_regression
        (owner_id, case_id, approval_type, status, preview_required, preview_revision, approved_revision, approved_at)
      values
        (gen_random_uuid(), gen_random_uuid(), 'letter', sample.state, sample.required, sample.revision, sample.approved,
         case when sample.timestamp_present then now() else null end);
    exception when check_violation then
      accepted := false;
    end;
    if accepted is distinct from sample.expected then
      raise exception 'Approval revision regression: %', sample.label;
    end if;
  end loop;
end;
$test$;
