# Whole-job capacity admission

Added 2026-10-19 after the existing shared allowance was repeatedly exhausted partway through case analysis. This is resource admission, not an invoice ceiling or a promise of successful legal analysis.

## Runtime contract

- The existing authenticated enqueue, consent, ownership, access, daily submission limits and idempotency remain mandatory. No historical failed case is restarted.
- A new job initially has `status=queued`, `stage=capacity`. It may wait at most 24 hours. No worker HTTP request or model reservation is created until its complete current job envelope fits both the owner's and the shared 24-hour allowances.
- Admission snapshots all five existing resource maxima under the same policy locks used by calls and settlement. Aggregate accounting includes previous charges plus the unused envelopes of active jobs. Per-request accounting excludes only its own unused envelope. There is no refund of spent/unknown calls when a job is cancelled, deleted or expires.
- Admitted work is dispatched before new waiting jobs. Up to four HTTP dispatches per sweep and the existing minute scheduler remain. A sweep examines at most 200 candidates. A blocked owner's job does not prevent another fitting owner within that sweep from being considered.
- Cancellation, completion and expiry release unused capacity. The existing cancellation wake or next sweep admits fitting waiting jobs. Consent and access are rechecked. Waiting jobs cannot obtain a lease or call reservation.
- The fixed processing hour starts at admission. The database returns that immutable timestamp as `checkpoint_issued_at`; the worker uses it for sealed checkpoints. Reclaims do not extend it. Existing started jobs retain their original checkpoint timestamp and expiry. `created_at` remains the submission time.
- New call reservations must fit the remaining input-unit budget including the pending request bytes. This closes the former check that inspected only the already-used balance. Request bytes are still a resource surrogate, not an exact count of provider input tokens.
- Search accounting includes provider-reported excess use: each call consumes the greater of its original search reservation and reported searches plus unclassified web actions. Known open/find actions are separate. Missing or smaller receipts never release the original reservation. The derived `charged_search_calls` also applies to existing receipts; both spent usage and unused holds use it, without counting the same search twice. All existing receipt, lease and policy-lock checks remain.
- The UI explains waiting, automatic start, cancellation and the 24-hour maximum in all 11 existing output languages. Existing login and access gates remain.

## Evidence and limits

The real SQL test accepts 20 synthetic owners, admits two under the observed production maxima, and leaves 18 waiting with no model calls. It verifies idempotency, lease replay, usage/hold conservation, cancellation admission, revoked consent, waiting expiry, private RPC denial and checkpoints after two hours in the queue. PGlite serializes database operations: this is a controlled SQL concurrency scenario, not a multi-connection production load test or a promise that 20 analyses finish simultaneously.

The full background suite retains the earlier response-cache expiry purge. Its cache/retention budget regressions now expect waiting before any work when a complete envelope cannot fit. All substantive reviews and correction limits remain unchanged.

The 2026-10-19 search-accounting regression first stores three returned search actions against a two-action reservation using the real receipt RPC. Before the migration the ledger reports two; after it reports three. It checks each job/owner/global boundary, whole-job admission, rolling expiry, active-envelope conservation, late settlement after cancellation, deletion, unknown responses/actions, replay and private access. `--search-accounting-only` runs this focused scenario; `--search-accounting-before` deliberately omits the new migration and must fail at the undercount assertion. Network and provider calls are disabled in both.

The observed production policies are job 48 calls / 160,000 output tokens / 12 MB request bytes / 12 search reservations / 3 million input units; shared 150 calls / 440,000 output tokens / 36 MB / 60 search reservations / 8 million input units per rolling 24 hours. Owner limits remain separate. The migration changes none of these values. Admission is conservative and can delay small or mostly cached jobs; actual provider quota, semantic quality, the job's own envelope and timeouts can still stop an admitted job.

## Automated verification

Run `python3 scripts/verify_case_readiness.py`. It runs five finite local suites, stops at the first failure, removes provider configuration from child environments and preloads the network guard. The PDF test alone has a narrowly restricted local `pdftotext` exception; shells, other subprocesses and network transports remain blocked. Reports and logs are written under `.ash-checks/`. An unchanged previously passed source digest is skipped. A successful report explicitly keeps `live_acceptance=false`.

## Outstanding acceptance

As of 2026-10-21 the operator pause is also checked at the final SQL call-reservation boundary, including leases issued before a pause. This is an on/off stop for new complete-case provider requests, not a positive currency ceiling and not cancellation of requests already sent. The research-cache regression now proves an identical researched restart uses four instead of ten simulated calls while re-fetching source bodies and retaining all four independent reviews.

1. Establish a monetary limit. Counting reported excess searches in subsequent decisions is now implemented; it cannot undo or guarantee the cost of the request already sent. Missing responses still retain their original reservation without proving the provider's actual use. Token, cache-write, actual service-tier and search-content costs must be covered; byte-based resource limits must not be described as dollar limits. Official references checked 2026-10-19: https://developers.openai.com/api/docs/pricing, https://developers.openai.com/api/docs/guides/token-counting and https://developers.openai.com/api/docs/guides/spend-limits. Provider hard limits can also overshoot while enforcement propagates.
2. A new paid test requires the user's specific permission and sufficient provider balance. None is scheduled or started by this change.
3. Complete the real authenticated flow with original upload/OCR, a useful reviewed stored result, Android usability and actual Word/PDF downloads. Internal replies do not prove live content quality.
4. Measure multi-customer throughput and actual cost before pilot readiness. The present aggregate allowance remains a limited pilot budget.
