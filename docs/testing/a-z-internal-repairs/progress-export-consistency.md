# Progress context and source quotations in customer exports

Date: 2026-09-20. Base: `d1fd57ba8cdb6dac4c38685a4b3afe774120728b`.

## Reproduced gaps

The synthetic four-step roadmap was completed and its second step reopened. The existing progress logic correctly reopened its direct and transitive dependants, while retaining their previous completion notes. The browser showed the old notes and the open status, but did not explain the automatic reopening. Prerequisites were labelled ambiguously as “Danach prüfen”.

The shared Word/PDF document model omitted prerequisites, the blocked-state explanation and the reopening cause. It also omitted the original quotations attached to established facts, even though the browser offered those quotations under each fact. A fact quotation occurring independently in a step did not preserve its association with the fact.

The first failing export assertion is retained in `progress-export-before.log`.

## Correction

- UI, Word and PDF identify prerequisites by step number and title with an explicit prerequisite label.
- Automatically reopened steps identify the original step that caused the reopening, including transitive dependants. Existing notes remain visible as history and are not relabelled as a current completion.
- Word and PDF state when prerequisite steps still block completion.
- Each exported fact retains its exact original quotations and source-document titles next to the claim.
- The new prerequisite and reopening labels are provided in all eleven existing customer languages.

This change does not alter the progress algorithm, confirmed evidence, event history or recipient letters. Reconfirming the required steps removes the obsolete reopening and blocked-state explanations.

## Verification

`scripts/test_v136_customer_roadmap.mjs` checks the actual progress updates and export blocks after direct and transitive reopening, multiple prerequisites, retained prior notes, exact fact quotations, source titles, all eleven label sets, Word XML and successful reconfirmation. Exporting does not mutate the record, and the separate recipient letter remains identical when progress changes.

`scripts/test_pdf_text_exports.mjs` renders the reopened roadmap with the actual PDF exporter and checks the extracted text with Poppler. Both blocked dependants, both reopening explanations, prerequisite references and fact provenance survive the generated PDF. The existing eleven-language and bilingual Word/PDF checks also pass. The PDF page containing the reopening explanation was rendered and visually inspected for readable text and unobstructed layout.

The complete `npm run build`, including all configured regression gates and the final application bundle, passed with exit code 0. Relevant output is retained in `progress-export-after.log`.

The browser reproduction used only the public synthetic fixture. It made no account, provider, database or customer-data changes and is not an authenticated end-to-end acceptance. Verification of the updated deployed preview is recorded on the draft pull request after its build completes.
