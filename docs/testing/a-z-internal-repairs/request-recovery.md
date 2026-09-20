# Recovery of repeated roadmap requests

Date: 2026-09-20. Base: `933b1a0486ba18f5a6665ed54e6d466339d87c24`.

## Reproduced failure

The actual `gold-case-roadmap` HTTP handler was invoked twice with the same completed continuation. The first invocation saved one roadmap. Replaying that continuation ran the review again and saved a second roadmap under a different ID. The failing assertion is retained in `request-recovery-before.log`.

## Internal correction

Each staged run receives a server-generated UUID inside its encrypted checkpoint. This UUID is retained through generation, review and correction, and becomes the saved roadmap's primary key. A subsequent request checks current identity, case visibility, analysis permissions, AI/privacy acknowledgement, source fingerprint, languages and style before retrieving that result.

The existing primary key permits one insert when two final reviews finish concurrently. A unique-key conflict retrieves the caller-scoped existing row instead of overwriting it. Recorded progress remains intact. A recovered saved result consumes no further roadmap quota or model call; genuinely new runs remain subject to their limits.

The client retries a `FunctionsFetchError` once across the workflow, only when it already holds a sealed checkpoint. The same request body is reused. An initial request, access denial, quota denial or failed evidence check is not automatically retried. Persistent network failure stops after that one retry.

## Verification

`scripts/test_roadmap_request_flow.mjs` compiles the actual TypeScript HTTP handler and runs its real source validators, review workflow and checkpoint encryption. Identity, Supabase transport and model responses are synthetic local doubles. The test never accesses a real account, model provider or customer database.

The assertions cover:

- Sequential replay returns the same saved ID without a further model call.
- Concurrent completion creates one row and returns it to both callers.
- The identity survives a full generation → review finding → correction → final review cycle; an earlier checkpoint recovers the completed corrected result.
- Existing progress survives replay; a saved result remains recoverable at quota and without model-provider configuration.
- Missing session, another owner, expired access, revoked analysis permission and disabled AI processing remain blocked.
- Original-text changes before or during review prevent stale persistence.
- A failed final review saves nothing and remains bounded to four model calls.
- A simulated lost completion response is recovered by the actual client continuation runner: three HTTP invocations, two synthetic model calls and exactly one saved roadmap.
- Persistent transport failure is retried once; a server access denial and an initial transport failure are not retried.

The post-fix handler output is retained in `request-recovery-after.log`. The handler checks run automatically within `npm run test:product-repair` and the existing full build gate.

The complete `npm run build`, including all configured regression gates and the final production bundle, passed with exit code 0 after the client recovery change.

## Limits

This is internal request-flow verification, not an authenticated browser or real-provider acceptance. Two truly concurrent final reviews may still perform duplicate review work before the primary key resolves persistence; only one result is stored. Quota admission for separate new runs is unchanged. No schema, production endpoint, access rights or customer data was changed in this continuation. The staged backend still requires the normal release process.
