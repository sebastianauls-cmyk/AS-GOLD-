# Durable complete case analysis

The authenticated `gold-case-roadmap` enqueue action checks case ownership, current access, consent, readable test-data inputs and normalized output settings. It stores one active job per case, without retaining a user session or refresh token. Complete analyses must use this durable path: the old `generate`/`analysis_mode=complete` continuation now returns `background_required`, before any model request. Existing source-only document/roadmap generation is a separate workflow.

Job status and bounded failure findings are owner-readable through RLS. Request settings and encrypted intermediate candidates live in a private table. Immediate dispatch and a scheduled recovery sweep send a random, single-use capability for one authorized job. Its hash expires after two minutes and is consumed atomically when a five-minute processing lease is claimed. The worker disables the gateway JWT check only for this custom authentication. Machine RPCs are not callable by authenticated or anonymous clients.

Each worker invocation advances one stage. Ownership, account state, entitlement, consent and original fingerprint remain required; completion rechecks access and sources. All four content-review scopes and every assigned batch remain mandatory. There are at most three substantive candidates, one mechanical input repair per candidate, and three total transport recoveries with at most one per interrupted step. The fixed one-hour job lifetime, 114 stage limit and 117 claim limit remain unchanged; the new resource limits can stop a job earlier. No partial/unreviewed customer result is saved.

## Resource reservations

Before each paid Responses request, `reserve_case_model_call` commits a reservation under the current single-use lease. It rechecks access/cancellation and serializes reservations across jobs and owners. One lease cannot reserve twice. Only the server chooses request limits; no client budget fields are trusted. The default policies are:

| Scope | Model requests | Output tokens, including reasoning | Request bytes | Built-in search calls | Reported input-token stop |
|---|---:|---:|---:|---:|---:|
| One job | 40 | 60,000 | 6,000,000 | 12 | 600,000 |
| One owner, rolling 24h | 80 | 120,000 | 12,000,000 | 24 | 1,200,000 |
| All complete-analysis jobs, rolling 24h | 120 | 180,000 | 18,000,000 | 36 | 1,800,000 |

The next request must fit its full `max_output_tokens` reservation. Verified provider usage releases only its unused output allowance. Lost, timed-out, rejected or malformed responses retain the maximum reservation. Cancellation and case/job deletion do not refund spent resources. A later response can settle its reservation after cancellation without restoring work or publishing a result. Duplicate settlement cannot reduce usage twice. Missing usage or unavailable accounting stops processing; there is no automatic budget retry or top-up. Search requests also specify `max_tool_calls=2` to the provider.

The ledger stores identifiers and counters only: no prompts, documents, generated text, provider error messages or keys. Usage includes input, cached input and output tokens. Access is private, RLS is enabled, all table grants are revoked, and only service-role RPC execution is granted. No personal content is copied to this ledger.

These are request/output/byte/tool limits, **not a guaranteed euro or dollar invoice ceiling**. Provider-added search context is not bounded by the request-byte limit. Reported input usage is checked before the *next* request, so one in-flight response (or simultaneous authorized requests across jobs) can cross that input threshold. Unknown responses retain output reservations but may have unknown input charges. Other workflows, API keys, taxes and tariffs are outside this guard. A currency promise requires reconciled pricing and provider-side input-cost bounds. Limits may stop a complex case before a useful result; do not represent that as successful completion.

## Scoped corrections and exact review receipts

When all defects originate in plan/letter reviews, have concrete plan-field locations, and the structural gate passed, the correction regenerates the customer plan while preserving validated topics and calculations. Ambiguous, structural, topical or calculation findings retain the complete correction path. Every corrected result passes the original structural/arithmetic validation again.

An approved review can be reused only if a SHA-256 digest of the **entire serialized provider request** matches: model, reasoning, instructions, original/research texts, candidate section, all supplied dependencies and coverage. Receipts exist only in the encrypted source-bound checkpoint. Failed reviews are never cached. Changed dependencies invalidate the receipt. All required response IDs and coverage remain in the final verification; reused IDs are additionally identified in `reused_review_response_ids`. The v168 structural review contract is unchanged.

## Rollout and verification

Complete-case reviews now use an explicit prompt-cache breakpoint after the shared original/research context. The server-owned review focus follows that boundary in a developer message; related outputs, assignment and candidate remain user data after it. All original/source text, high reasoning, output limits and every required review remain present. A case-specific opaque key separates cache accounting. This affects only the explicitly opted-in complete-case reviewer, not document/source-only reviews. The receipt hash still covers the entire final request, including the focus, candidate, dependencies and cache settings; prompt reuse cannot substitute for an approval. Worker logs include cache-write counts as well as cache reads.

This follows the current OpenAI prompt-caching guide: https://developers.openai.com/api/docs/guides/prompt-caching (checked 2026-09-23). It avoids writing the changing review suffix to cache and makes the shared prefix eligible for reuse. Actual cache hits, runtime and invoice savings still require provider usage from a live run. Request-byte and total-input resource limits are unchanged; cached input still counts toward the existing input threshold. No guaranteed case completion or currency ceiling is implied.

`test_case_review_cache.mjs` checks identical evidence prefixes across changing sections, unchanged source text and instruction/data roles, full-request receipt invalidation, rejection handling, and fail-before-transport behavior. It runs through `test_complete_case.mjs` using a simulated provider.

Apply `20260923120225_bounded_case_model_budget.sql`, deploy the updated worker and roadmap endpoint together, then verify configuration without starting a paid case. Do not raise limits as part of recovery. A worker deployed before the migration fails closed. Existing active jobs would have no accounting for earlier calls: pause dispatch and finish/cancel them before rollout; this migration does not requeue any historical job. Rollback must keep dispatch paused until the worker and policy agree, because older workers do not enforce these reservations.

The UI restores job status and polls saved state. Closing the page does not restart generation. Word/PDF export still uses only the accepted result; no external sending is added.

`test_background_case.mjs` runs the actual SQL migrations, grants/RLS, leases, budget reservations, encrypted checkpoints and worker against PGlite. Model and dispatch transports are simulated. `test_complete_case.mjs` covers exact arithmetic, provenance, required review coverage, preserved calculations, review reuse, dependency invalidation and full-correction fallback. The local letter-repair fixture falls from 25 to 15 model calls; this is not a live Sarah time/cost measurement. No paid model request is needed for these tests.

Provider request-limit reference: https://developers.openai.com/api/reference/cli/resources/responses/methods/create (checked 2026-09-23).
