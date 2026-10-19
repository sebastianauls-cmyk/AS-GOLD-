# Single-case completion first

User priority, 2026-10-19: finish a working case from original documents to a
useful stored result and downloadable Word/PDF files. Multi-user capacity can
be sized afterwards. Existing resource policies and substantive review gates
remain unchanged. Paid model tests, automatic failed-case restarts, balance
top-ups and budget increases are not authorized.

## Acceptance boundary

1. Enter through normal authentication and the current consent/access checks.
2. Upload the original documents and recover their readable contents without
   losing evidence or silently resubmitting a model request.
3. Process one authorized job through the existing complete analysis and review
   stages. A rejected or incomplete candidate must not become a customer result.
4. Persist the reviewed result, reopen it through the normal application and
   download the actual report and letters as Word/PDF.
5. Check content, figures, source attribution, missing information, readability
   and the Android flow against the originals. Record actual runtime and usage.

An offline controlled answer is useful for verifying program behaviour. It
does not establish live AI quality or a passed customer case. Do not run the
same unchanged successful checks repeatedly. A later paid run needs specific
user authorization, provider balance and an agreed bounded test scope.

## Fixed: upload handoff lost after a status read error

The production panel consumed the one-time upload authorization before
checking whether the saved job status had been read successfully. After a
temporary read failure, even a successful status-only refresh could leave
the authorized automatic run permanently unstarted.

The panel now waits for a successful status read before claiming the handoff.
It retries only status/result reads, at most twice after an error (after three
and six seconds). A persistent failure leaves the explicit status-refresh
control available. No enqueue, document analysis or model request is retried
by this recovery. Existing jobs are observed; changed originals, cancelled
handoffs and denied access do not gain another authorization. Leaving the
panel cancels pending refresh timers.

`scripts/test_automatic_case_status_recovery.mjs` compiles the real production
panel and runs its effects with controlled hooks and service responses. The
previous implementation fails the restored-status assertion (zero starts
instead of one). The corrected implementation preserves exactly one start,
checks bounded retries and manual recovery, and rejects duplicate starts,
changed inputs, cancelled handoffs and restored access after refusal.
The test is part of `test_case_result_access.mjs` and the existing readiness
runner. It is not an authenticated browser or live model test.
