# Internal repairs from the A–Z product test

Base: `b90edee6b491f23df597caf48f5d74c63c961f9f` (V139). This branch contains internal repairs and regression evidence; it is not a production release.

## Behavior changed

- Roadmap generation, evidence review and the single bounded correction now run as separate authenticated requests. Every continuation reloads the caller's originals and access rights. AES-GCM checkpoints bind the candidate to its owner, case, source fingerprint, languages, style and letter permission, with a 15-minute lifetime. No intermediate candidate is rendered or saved.
- The full semantic review remains at high reasoning. Structural findings and semantic findings are collected before the single correction. A failed second check still blocks persistence. Source-backed statements are preserved during correction; language selection and customer translations are explicitly reviewed. Missing translations are flagged structurally, and the correction cannot silently remove the affected letters.
- Roadmap, document and professional-handoff PDFs share embedded Unicode fonts, actual PDF text, line-based pagination and vector traffic-light markers. Original quotations and letters are not rewritten. Technical step references are displayed as numbered titles; ordinary words, numeric IDs, amounts and dates remain unchanged.
- Generic country-profile risk warnings no longer appear as if they were findings about the active case or document. Dedicated case evidence and country comparison remain available.
- Dates detected in original documents appear with source excerpts in both case detail and the deadline overview. Detection does not write or confirm a case deadline, or silently decide that a later date supersedes an earlier one.
- Country-selector and case-status labels follow the interface language. Roadmap progress shows generation, review and correction separately.
- Quote feedback identifies every invalid location and quotation, rather than reporting only a generic first failure. Non-adjacent original passages must be separate evidence entries.
- Integration tokens and roadmap checkpoints reject non-canonical Base64URL aliases. A real release-gate failure exposed that changing unused encoding bits could decode to identical authenticated bytes. The existing negative test is retained and supplemented with an actual ciphertext bit flip; the cryptographic check is not bypassed.

## Verification

`npm run build` includes the existing release gates and the new `test:product-repair` gate. Provider stubs are used for deterministic negative controls, bounded correction, owner/source/language tampering, expired checkpoints, timeout classification and client stage handling. They are not live model acceptance.

`scripts/test_pdf_text_exports.mjs` invokes the real export renderers for roadmap, formal letter, professional handoff and eleven language fixtures. It checks embedded fonts, Unicode mappings and absence of raster page images; when Poppler is available it also extracts text and checks the final content marker after pagination. German, Arabic and handoff output were visually inspected locally. RTL extraction remains viewer-dependent; this is not a complete linguistic certification of eleven languages.

`scripts/build_ai_evaluation.mjs` extracts the actual production prompts and validators, including the staged runner. `scripts/fixtures/roadmapRepairCase.mjs` supplies only fictional invoice data. The temporary evaluation endpoint accepts only these fixed fixtures and sealed continuations, has platform JWT plus a private temporary key, expires automatically, and does not read or write customer tables.

The first live pass (`live-first-pass.json`) demonstrates generation → rejection → automatic correction → review for the updated invoice. The four HTTP calls took 57.98, 39.73, 28.53 and 42.09 seconds, totaling 168.33 seconds without sharing one 130-second budget. The initial output also exposed avoidable uncertainty and the bilingual output lacked a customer translation; these findings drove additional code changes. These early responses are retained as defect evidence, not accepted final examples.

The second and third passes are also retained. They exposed deletion of a letter to avoid translation and concatenation of non-adjacent quotes. The fourth pass corrected the quotes but still found semantic issues afterward. This led to the final staged order: generation, combined structural/semantic findings, one correction, final checks. The final repair reuses the actual failing candidate from the third pass to test that combined flow; it does not disguise a failed first pass as a fresh successful generation.

Final evidence: the explicit false payment assertion was rejected at `opening` (third pass, 47.89 s). The initial German case completed with one formal letter (58.82 + 25.31 s). The final bilingual repair (`live-final-repair.json`) completed through review, automatic correction and final review (26.74 + 24.83 + 24.62 s), retained one German letter and its 759-character English customer translation, and passed exact-quote validation. No manual changes were made to that accepted model output. The final independent review returned `issues=[]`; earlier differing findings remain in the archive and this does not assert universal model correctness.

The temporary endpoint was replaced with a closed response and verified to return HTTP 410 on 2026-09-19 at 23:19:33 UTC (`evaluation-closed.json`). The final complete build succeeded (`local-build.log`).

## Boundaries

The build and targeted repair tests are not a fresh end-to-end sweep of every historic chat, every production account, payment provider, microphone, device or all legal/country combinations. Live model checks use fixed synthetic cases in an isolated endpoint; they do not prove the production UI/auth/database journey of the staged endpoint. The production backend and frontend still require the project's normal release process before customers receive these changes.

Tests detect regressions and gate builds. The code repairs in this branch were made by the development agent during this work; CI does not autonomously rewrite application source. The product's model workflow does automatically correct a rejected candidate once and then reapply the same checks.
