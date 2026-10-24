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

## Fixed: a blocked original tab was recorded as opened

The mobile-safe original-file action reserves a new tab before requesting its
short-lived signed URL. If the browser blocks that tab, the app exposes the URL
as an explicit fallback link. The workflow previously wrote `document_opened`
as soon as it produced that link, even if the user never followed it. This
could falsely satisfy the evidence trail for reviewing the original.

The workflow now records an immediately opened tab at once, but treats a
fallback URL only as an opportunity to open the file. The fallback link records
the event on its first actual click, with duplicate clicks suppressed. Signed
URL failures still record nothing. The production-workflow regression first
reproduces the premature event, then verifies no event before the fallback
click and exactly one afterwards. It uses fictional content and blocked
external network; it does not claim a real Android or live-case acceptance.

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

## Fixed: an older result read could hide a completed answer

The opening result request and the job-status request previously ran in
separate effects. When a completed job loaded its saved answer first, a
delayed opening response could overwrite it with an empty or older snapshot,
or leave an obsolete read error on screen. The new regression fails against
that implementation: the expected completed record disappears.

A single cancellable read sequence now owns status and result loading. Its
existing bounded recovery also covers opening a saved result with no
background job. A failed result read cannot consume upload authorization;
after two automatic retries the existing status-refresh button can retry the
reads. A completed job's referenced result must actually be present before
the read succeeds. No result is fabricated and no model request is replayed.

The production-component regression covers delayed empty/older/error
responses, temporary and persistent result-read failures, manual reopening,
exactly one authorized start after recovery and leaving before a read
finishes. These are internal controlled transport tests, not proof of a new
successful live AI case or of Android downloads.

## Fixed: an unavailable document draft read could authorize another AI request

The document workflow treated a failed recovery SELECT as an absent completed
draft. A repeated document-analysis action (including case preparation) could
therefore authorize and invoke AI despite an existing recoverable draft. The
production-workflow regression fails before this fix: one authorization instead
of zero after a controlled read failure. This is distinct from the previously
fixed case-job status and saved-roadmap races.

Recovery now distinguishes an unavailable, missing or source-mismatched row
from a successful matching read with no reusable draft. In the former case the
action stops before authorization, audit writes or model invocation and reports
the existing localized recovery message. It does not automatically retry the
read. A later explicit action can restore the existing draft without new AI.
A successful matching read without a reusable draft can still proceed through
the unchanged consent, authorization and substantive document-review gates.

`test_document_recovery.mjs` checks returned/thrown read failures, missing and
changed sources, explicit recovery, persistent failures, the case-preparation
path and silent/manual feedback in eleven languages. It retains the real SQL
authorization/RLS and save/recovery tests and is included in the result-access
suite. Controlled transports and blocked external network only; no paid API
request, provider balance claim or new real single-case acceptance is implied.

## Fixed: the German review day lagged behind after local midnight

The live German single-case job started on 21 October 2026 at 00:26
Europe/Berlin, but the worker derived `review_date=2026-10-20` by slicing its
UTC timestamp. Date-sensitive urgency, research and independent review could
therefore use yesterday during the first one or two hours of the German
business day. The changing UTC date also changed the protected reuse binding
inside the same local day.

The worker now derives one Europe/Berlin review date from the persisted job
start and passes that same date through the roadmap prompt, research context,
complete analysis and every independent review. Direct roadmap requests use
the same German business-date function. The real production start instant is
an explicit regression; winter midnight, invalid instants and prompt/review
propagation are checked too.

The five bounded offline readiness suites passed with external network blocked
and controlled model answers. This correction makes no provider request and
does not claim that the failed live job produced a reviewed customer result or
that Word/PDF downloads have passed the live single-case acceptance.
