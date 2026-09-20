# V140: corrections following the September 20 A–Z retest

The published V139 retest found intermittent two-document roadmap failures, stale payment-date priority, handoff headings tied to interface language, repeated originals in explanations, informal business-letter salutations, and empty source research recorded as a result.

## Changes

- Original evidence is retained in full. Old AI summaries stay in the freshness fingerprint but are not recycled as new model evidence. Bilingual letters explicitly translate the subject, and formal signatures use source-supported identities. Generation, mandatory independent review, one correction and final review remain separate requests; only a checked result can be saved. Individual staged calls use at most 135 seconds within a 140-second request budget.
- Unresolved reviews return concrete authenticated-user findings. Unknown authorship of a compiled document no longer erases a reply when the sender role has a verbatim original quote and named parties; independent review still checks what the quote actually supports.
- Invoice issue dates and decimal punctuation no longer corrupt deadline excerpts. Original invoice due dates stay in history when a later request relates to the same invoice. Explicit replaced dates are marked across matching references; unrelated, unconfirmed or merely later dates cannot cancel deadlines. Stored case dates are never rewritten. Case and document warnings use the same case context.
- Handoff headings use the selected output language. Explanations appear first, including legacy saved summaries; originals and letters keep their separate fields. Du coaching does not set the business recipient's salutation. Guest quota text describes the test limit. Empty verified-source sets fail without saving a comparison. V140 identifies the release.

## Verification

`test:retest-corrections` reproduces the exact fictional two-document fixture from the retest, including 24 September changing to 2 October, independent urgent dates, other owners/invoice references, conditional replacements, original quotations, legacy summaries, role evidence and guest limits. Existing model, HTTP continuation, source isolation, progress, PDF/Word, language and database guards are retained.

Live fixture evaluation used the actual model blocks extracted from the production files, without changing prompts in the adapter. The temporary evaluator accepts only fixed synthetic fixtures, has a separate access token and expires; it performs no customer-table writes. The final initial and two-document roadmaps passed the structural and semantic review with one correction. The corrected document-role flow passed on its first attempt. Actual browser and production acceptance will be recorded separately after deployment. These model results are not a blanket guarantee of every future generated text.
