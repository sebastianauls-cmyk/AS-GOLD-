# Durable complete case analysis

The authenticated `gold-case-roadmap` enqueue action checks case ownership, current access, consent, readable test-data inputs and normalized output settings. It stores one active job per case, without retaining a user session or refresh token. Complete analyses must use this durable path: the old `generate`/`analysis_mode=complete` continuation now returns `background_required`, before any model request. Existing source-only document/roadmap generation is a separate workflow.

Job status and bounded failure findings are owner-readable through RLS. Request settings and encrypted intermediate candidates live in a private table. Immediate dispatch and a scheduled recovery sweep send a random, single-use capability for one authorized job. Its hash expires after two minutes and is consumed atomically when a five-minute processing lease is claimed. The worker disables the gateway JWT check only for this custom authentication. Machine RPCs are not callable by authenticated or anonymous clients.

Each worker invocation advances one stage. Ownership, account state, entitlement, consent and original fingerprint remain required; completion rechecks access and sources. All four content-review scopes and every assigned batch remain mandatory. There is one initial candidate and at most one local content-correction request. Initial component generation has one shared mechanical input repair. Three total transport recoveries, with at most one per interrupted step, remain available. The fixed one-hour job lifetime, 114 stage limit and 117 claim limit remain unchanged; the new resource limits can stop a job earlier. No partial/unreviewed customer result is saved.

## Retained work after a terminal technical interruption

The last successfully advanced unfinished state is also sealed in a separate AES-GCM envelope in `private.retained_case_work`. It is reusable for at most 24 hours, with one snapshot per owner/case. The existing minute dispatcher purges expired snapshots even while processing is paused. End users cannot read the private table or invoke its machine RPCs. Cancellation, successful completion, source/content failures, changed consent/access and case/account deletion discard the retained candidate.

Retention never starts or renews a job. Only an explicitly submitted new job that passes the existing authorization, daily quota and processing-pause checks can load it. The current lease, ownership, source fingerprint, complete request/model context and `DENO_DEPLOYMENT_ID` must match. This includes languages, style, letter permission, model instructions and review date: crossing the review date or deploying changed code prevents reuse. Missing storage/version configuration fails closed before model generation. Invalid ciphertext is never silently replaced with a paid restart.

All correction attempts, evidence, partial generations and completed review receipts remain in the encrypted state; the ordinary state machine still requires all remaining validation/review work. The original job remains terminal and its model ledger is retained. Each additional provider request must reserve against the existing job, owner and global limits. No budget, automatic retry allowance or acceptance criterion is increased.

The real worker/SQL test stops a synthetic job after seven completed provider stages, submits a new authorized job and completes the last stage: eight total simulated calls, with all four grouped reviews covering the eight required sections. It also verifies budget exhaustion, context mismatch, expiry, revoked consent, private access and deletion. Already erased historical checkpoints cannot be recovered. This is a recovery-mechanism test, not a completed live Sarah case.

Rollout: apply `20260924001546_retained_case_work.sql`, then deploy the worker and its relative dependencies. Keep the processing pause in place until a separate authorized live test. The migration does not modify configuration, historical jobs or budget policies. The Supabase-injected deployment identifier is documented at https://supabase.com/docs/guides/functions/secrets.

## Bounded generation after truncated output

Topics are generated in batches of at most two. If the provider ends a topic or calculation response at its output-token limit, its incomplete JSON is discarded and the next worker lease receives half as many assignments, rounded down, with a minimum of one. Topic batches can shrink from two to one; calculation batches from six to three to one. Earlier validated topics, calculations, fetched sources, correction history and the exact next assignment remain in the sealed checkpoint. A single oversized item still stops the job. Outline, roadmap and review failures do not silently enter this recovery path.

Every attempt consumes its normal reservation and actual usage. No output allowance, reasoning effort, review requirement, total job budget or lifetime is increased. This avoids restarting completed research merely because a divisible generation response was too large. The live triggering failure was a three-topic response ending at 8,000 output tokens; the new recovery is verified with simulated truncation and real worker/SQL budget tests before another live run.

## Reusable generation evidence

The live ledger showed zero cached reads across the thematic generation batches. Those requests changed their JSON output schema for each assignment, even though their full evidence prefix was otherwise common. The current OpenAI cache guide explicitly includes `text.format` in the rendered prefix (https://developers.openai.com/api/docs/guides/prompt-caching, checked 2026-09-23).

Topic and numerical generation now use one stable schema per case/component, containing the complete allowed ID registry and a bounded list size. The server still requires the exact assigned IDs, count, order, topic mapping, quotes and arithmetic before retaining a response; a different valid case ID is not accepted for the current assignment. Explicit breakpoints follow the unchanged original/scope block and complete supplied source block. Variable assignments, prior generated work, correction feedback and module-selection metadata follow those boundaries. No original or fetched source text is removed. Model, reasoning, quality gates and all budgets are unchanged. Cache eligibility is covered by request comparisons and negative validation tests; actual savings require subsequent measured provider usage.

## Resource reservations

Before each paid Responses request, `reserve_case_model_call` commits a reservation under the current single-use lease. It rechecks access/cancellation and serializes reservations across jobs and owners. One lease cannot reserve twice. Only the server chooses request limits; no client budget fields are trusted. The default policies are:

| Scope | Model requests | Output tokens, including reasoning | Request bytes | Built-in search calls | Reported input-unit stop |
|---|---:|---:|---:|---:|---:|
| One job | 40 | 60,000 | 6,000,000 | 12 | 600,000 |
| One owner, rolling 24h | 80 | 120,000 | 12,000,000 | 24 | 1,200,000 |
| All complete-analysis jobs, rolling 24h | 120 | 180,000 | 18,000,000 | 36 | 1,800,000 |

The next request must fit its full `max_output_tokens` reservation. Verified provider usage releases only its unused output allowance. Lost, timed-out, rejected or malformed responses retain the maximum reservation. Cancellation and case/job deletion do not refund spent resources. A later response can settle its reservation after cancellation without restoring work or publishing a result. Duplicate settlement cannot reduce usage twice. Missing usage or unavailable accounting stops processing; there is no automatic budget retry or top-up. Search requests also specify `max_tool_calls=2` to the provider.

The ledger stores identifiers and counters only: no prompts, documents, generated text, provider error messages or keys. Usage includes raw input, cached input and output tokens. Input units count non-cached input plus `ceil(cached_tokens / 10)` per response. Only provider-confirmed cache reads qualify; writes, predicted hits and merely identical requests do not. Missing responses reserve their request bytes as input units as well as their full output allowance. The numerical input allowances and every call/output/byte/search limit remain unchanged. At the currently configured GPT-5.6 Sol rates, cache reads cost 10% of ordinary input or 8% of cache writes in both context tiers. This resource weighting is conservative relative to those published ratios, not an invoice calculation. See https://developers.openai.com/api/docs/pricing (checked 2026-09-23). Access is private, RLS is enabled, all table grants are revoked, and only service-role RPC execution is granted. No personal content is copied to this ledger.

These are request/output/byte/tool limits, **not a guaranteed euro or dollar invoice ceiling**. Provider-added search context is not bounded by the request-byte limit. Reported input units are checked before the *next* request, so one in-flight response (or simultaneous authorized requests across jobs) can cross that input threshold. Unknown responses retain output and request-byte input reservations, but provider-added search input charges may still be unknown. Other workflows, API keys, taxes and tariffs are outside this guard. A currency promise requires reconciled pricing and provider-side input-cost bounds. Limits may stop a complex case before a useful result; do not represent that as successful completion.

## Grouped reviews and one local correction (v170)

The item-level review coverage remains unchanged: every topic, calculation, overview field, fact, question, action and letter needs its assigned audit. Empty calculations and empty letters still receive completeness checks. Adjacent sections within the same scope now share one request, with at most four sections and 16,000 UTF-8 bytes of candidate content. An individual legacy section exceeding that size stays alone and is never truncated. This is a candidate-size bound, not a bound on the full original/research context or provider runtime. Independent high-reasoning review settings remain unchanged.

Verification records the complete `review_coverage`, ordered `review_groups`, one distinct approval ID per group, and the group's scope. The private SQL validator independently reconstructs every required section. Missing, duplicate, reordered, mixed-scope, oversized or malformed groups cannot publish a result. Completed older versions retain their original contract.

Precisely located non-source findings select existing fields for one bounded replacement request. `completeCaseRepair.mjs` resolves original IDs/indices, rejects ambiguous mappings, deduplicates assignments, includes transitive numerical consumers, and limits the request to eight existing parts and 20,000 characters of prior assigned content. The schema locks item IDs. The server preserves every unassigned field verbatim.

The correction receives every original, all fetched sources, the full candidate and current findings. There is no whole-case or whole-plan regeneration fallback. A source objection, ambiguous location, required new/deleted item, larger dependent change, invalid patch or second substantive rejection ends the job with its findings. A structurally invalid assembled candidate stops before paid review. A finding that cannot fit the local pass also stops before remaining audits are purchased. No unreviewed result is saved.

An approved review can be reused only when a SHA-256 digest of the **entire serialized provider request** matches: model, reasoning, instructions, originals, research, candidate, dependencies, assignments and coverage. Receipts live only in the encrypted checkpoint. Failed reviews are never cached; changed dependencies invalidate approvals. Every final group must have a current approval. Reused IDs and successful local correction IDs remain explicit in verification.

Offline regression measurements (simulated provider transport, real engine and validators):

| Fixture | Previous requests | Current requests |
|---|---:|---:|
| Small non-numerical worker case | 12 | 8 |
| Maximum-size case: 10 topics, 24 calculations, 25 review sections, no research | 37 | 20 |
| Same maximum-size case, then one calculation explanation correction | 39 | 22 |

The maximum-size case retains all 25 required sections in eight approved review groups. The worker/SQL fixture verifies encrypted continuation, cancellation, access, accounting and persistence. A separate large fixture exercises three transport interruptions without regenerating already completed work. These tests establish request counts and enforcement, **not live model correctness, Sarah acceptance, runtime or invoice savings**.

Rollout: apply `20260924005032_grouped_case_reviews.sql`, then deploy the matching worker and roadmap bundles. Keep processing paused. No paid run, increased budget or automatic requeue is part of this change. The migration changes only the private coverage validator and its version dispatch in completion; quotas, leases, consent, resource policies and stored historical results are unchanged.

## Rollout and verification

### Module research context

`caseResearchContext.mjs` routes complete fetched texts to numerical generation and selected topic/calculation/action reviews. It follows cited topics, transitive numerical dependencies and action prerequisites. It retains every fetched provision of a selected statutory act and its configured implementing-act dependencies. Unassigned source families and unrecognized publishers remain in every request. Missing/ambiguous links, uncited topics, cycles or unavailable citations restore the entire source set. This is routing, not a legal finding that excluded law is irrelevant. No original document or source text is shortened or replaced by a model summary; quotation IDs keep their original positions.

The first topical completeness review, whole-case overview, factual/question reviews and all letter reviews retain all sources. The overview now receives the full topic conclusions and citations, with an explicit independent check for uncited exceptions and cross-topic applicability. An initial mechanical repair restores full research. Every local content correction receives all sources and preserves existing routing for subsequent reviews; a source objection stops the job. Every original review section is still mandatory, with high reasoning and the same resource caps.

Scoped requests carry a catalogue whose hashes bind the actual complete source objects, including omitted texts, to the exact-request approval receipt. A source change cannot preserve an old approval merely because its text was omitted from this module. Original documents have their own cache breakpoint before the module research; identical module context has a second breakpoint. This preserves a reusable original prefix while source sets differ.

The fully simulated 10-topic/24-calculation/25-section fixture, beginning after planning, uses 19 requests, five with scoped sources. Grouping accounts for the request reduction from the previous 36-call fixture. A separate within-current-workflow comparison restores full research in otherwise identical requests and measures the routing overhead as well. This is not a replay of Sarah. A negative-control whole-case source objection stops before any automatic regeneration or customer publication. These tests prove routing, source retention and workflow gates, not real model correctness, token savings or invoice cost. This measured reduction alone does **not** establish that a real case fits its limits. The subsequent cache-aware budget migration credits only measured provider cache reads; a live run must establish its benefit.

Complete-case reviews use explicit prompt-cache breakpoints after the common originals and the supplied original/research context. The server-owned review focus follows those boundaries in a developer message; related outputs, assignment and candidate remain user data after them. Supplied texts are complete; high reasoning, output limits and every required review remain unchanged. A case-specific opaque key separates cache accounting. This affects only the explicitly opted-in complete-case reviewer, not document/source-only reviews. The receipt hash still covers the entire final request, including the focus, candidate, dependencies and cache settings; prompt reuse cannot substitute for an approval. Worker logs include cache-write counts as well as cache reads.

This follows the current OpenAI prompt-caching guide: https://developers.openai.com/api/docs/guides/prompt-caching (checked 2026-09-23). It avoids writing the changing review suffix to cache and makes the shared prefix eligible for reuse. Actual cache hits, runtime and invoice savings still require provider usage from a live run. Request-byte limits are unchanged. The cache-aware budget migration changes input accounting to the explicit units above; raw usage remains in the ledger. No guaranteed case completion or currency ceiling is implied.

`test_case_review_cache.mjs` checks identical evidence prefixes across changing sections, unchanged source text and instruction/data roles, full-request receipt invalidation, rejection handling, and fail-before-transport behavior. It runs through `test_complete_case.mjs` using a simulated provider.

Apply `20260923120225_bounded_case_model_budget.sql` and `20260923134458_cache_aware_case_input_budget.sql`, then verify configuration before starting a paid case. The cache-aware migration preserves both worker RPC signatures and grants, so the existing budget-aware worker remains compatible. Do not raise call/output/byte/search or input-unit allowances as part of recovery. Configure a provider hard spend limit as an additional backstop for an authorized live test; enforcement can lag slightly (https://developers.openai.com/api/docs/guides/spend-limits). A worker deployed before the migration fails closed. Existing active jobs would have no accounting for earlier calls: pause dispatch and finish/cancel them before rollout; this migration does not requeue any historical job. Rollback must keep dispatch paused until the worker and policy agree, because older workers do not enforce these reservations.

The UI restores job status and polls saved state. Closing the page does not restart generation. Word/PDF export still uses only the accepted result; no external sending is added.

`test_background_case.mjs` runs the actual SQL migrations, grants/RLS, leases, budget reservations, encrypted checkpoints and worker against PGlite. Model and dispatch transports are simulated. `test_complete_case.mjs` covers exact arithmetic, provenance, required review coverage, preserved calculations, review reuse, dependency invalidation and rejection of wider/repeated corrections. The local letter-repair fixture now uses 11 model calls; this is not a live Sarah time/cost measurement. No paid model request is needed for these tests.

Provider request-limit reference: https://developers.openai.com/api/reference/cli/resources/responses/methods/create (checked 2026-09-23).
