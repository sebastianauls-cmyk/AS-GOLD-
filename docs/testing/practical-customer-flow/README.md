# Practical customer workflow: current next step

Base: production `a1fcfdba9ab771dfc7cd3a68720d069cc2303105`.

## Reproduced defect

The browser test used the unchanged synthetic V136 preview at
`https://app-gold-workspace-93qsew9b8-auls.vercel.app/vorschau/v136?frame=1`.
After confirming **Empfangsbestätigung prüfen und einreichen** with a note,
step 1 became green. The top-level **Nächster Schritt** still said:
“Prüfe zuerst die Empfangsbestätigung und die ausdrücklich genannte Frist.”
The export reproduced the same incorrect navigation; `before.log` records
the failing assertion against the actual export block generator.

## Changes

- One shared presentation helper derives the next action from the existing,
  confirmed progress and prerequisite rules. Completed or blocked actions
  cannot be recommended as the next action. Urgent work precedes other work;
  available actions precede waiting while the original order is preserved
  within those groups.
- The short view shows the traffic light and confirmed-step count. Its new
  action opens and focuses the corresponding detailed step. The action obeys
  the existing plan restriction.
- Waiting identifies the expected response and preserves the existing
  follow-up instruction. Elapsed time never confirms that a reply arrived.
- Completing all steps reports **confirmed completion of these steps**, not
  a new factual or legal conclusion. Reopening returns the summary to the
  reopened prerequisite. Changed sources remove the current recommendation.
- After progress changes, the original assessment is labelled and folded in
  the UI. Word/PDF put current progress first, followed by the labelled original
  assessment. Original facts, quotations and separate letters are unchanged.
- Status and control labels cover all eleven existing output languages.
- PDF heading pagination also reserves its top/bottom spacing so the heading
  does not become separated from the start of its paragraph.

## Verification

`scripts/test_practical_roadmap.mjs` walks completion → waiting → completion →
reopening → changed source; checks prerequisites, urgency and eleven-language
status labels; and invokes the actual Word and PDF renderers. Word XML and
Poppler-extracted PDF text confirm current navigation and preserved quotations.
The complete build runs this check inside the existing product-repair gate,
alongside the existing HTTP-handler, evidence and database/RLS regression tests.

The synthetic browser preview performs real component interactions and
downloads but does not persist to production. No new user sign-in, live model
generation, purchase or customer communication is represented by this test.
It does not establish a higher factual accuracy rate than another AI product.
The production model prompts, backend functions, access controls and database
schema are unchanged by this repair.

## Deployed browser acceptance

Verified on 2026-09-20 against commit
`b62d98e4a6c5ad816571cc870a17256a91e82229`, whose tree
`74dd140d35cdb401758ed9613a84b7f60b2a34c8` is identical to the local
build-tested tree. Preview deployment: `dpl_7E2VN77KghXxz6Ymq8rKv74sw9V3`.

`https://app-gold-workspace-aqthisixu-auls.vercel.app/vorschau/v136?frame=1`

| Interaction | Observed result |
| --- | --- |
| Open the initial suggested step | Step 1 opens and receives keyboard focus; 0 / 4 confirmed. |
| Confirm step 1 with a synthetic receipt note | Summary advances to step 2; 1 / 4 confirmed; the original assessment is folded and labelled. The direct action focuses step 2. |
| Confirm both requests were sent | Waiting state; 2 / 4 confirmed; expected documents and follow-up shown. |
| Confirm the replies were checked | Summary advances to step 4. |
| Confirm the final check | 4 / 4 confirmed; completion and document-retention advice; no active-step shortcut. |
| Reopen step 2 with a correction reason | Summary returns to step 2; 1 / 4 confirmed; dependent steps 3 and 4 reopen and are blocked. Their prior notes and reopening reasons remain visible. |
| Download Word and PDF in that reopened state | Both real browser downloads contain step 2, 1 / 4, the labelled original assessment, unchanged source quotations and the correction reason. The initial next-step instruction is absent. Verified through Word XML and Poppler PDF text. |
| Simulate a changed document | Stale state; reread/regenerate instruction; no current-step shortcut; all Word/PDF buttons disabled. |
| Restore current sources and select the free plan | The new direct-step shortcut is absent; the existing upgrade explanation remains. |
| Use the 390 px phone preview | Text and controls wrap within the phone frame. The direct action opens the correct detailed step with visible focus. |

Both GitHub checks (`verify`, `synthetic-testers`) and the Vercel deployment
status passed for the tested commit. The only change after that code revision
is this acceptance record; no application code changed during acceptance.
