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

Browser acceptance of the new revision is recorded below after deployment.
