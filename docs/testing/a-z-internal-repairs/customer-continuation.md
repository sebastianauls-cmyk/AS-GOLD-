# Customer-facing continuation

The browser continuation used preview `app-gold-workspace-7yw70k71o-auls.vercel.app` at commit `a5b2d7070bf07e15c9987e925cc8ddb5d266b651`. It does not represent a production release or a fresh authenticated A–Z acceptance.

## Browser observations

- The public **Fall starten** action opens free registration. The consent checkboxes start unchecked and registration stays disabled.
- The previous anonymous production test session is no longer signed in. A fresh authenticated journey has not yet been completed.
- In `/vorschau/v136`, the synthetic roadmap opens its detailed steps. Steps depending on incomplete prerequisites cannot be marked complete.
- A completion requires an explanatory note. Saving a synthetic completion shows the note, the confirmed status and the reopen action.
- Simulating an additional source changes the roadmap to **Grundlage geändert – neu erstellen**. All step confirmations and Word/PDF exports are disabled; previously green steps lose that status.
- Clicking PDF generates a three-page text PDF with embedded Unicode fonts. The downloaded file was inspected with `pdfinfo`, `pdftotext` and a rendered page. The browser tool's download-event waiter timed out although the files arrived; this was not recorded as an application-export failure.

## Additional defect and repair

A bilingual letter's customer translation was rendered on screen but omitted by `roadmapExportBlocks`, so both Word and PDF lost the translation. Reproduction before the repair returned `screenTranslationExists: true`, `exportContainsTranslation: false`, `referenceLetterRetained: true`.

Letter exports now keep the recipient letter intact and append the available customer translation on a separate, explicitly labelled page. Paragraph direction follows each part's language, including German/Arabic and Arabic/German combinations.

The actual Word and PDF renderers were exercised for German/English, German/Arabic and Arabic/German synthetic samples. Word archive content, translation page breaks and paragraph direction passed. PDF text extraction confirmed the complete translation on a separate page. Both mixed-direction PDF translation pages were visually inspected. The existing eleven-language PDF checks and the full `npm run build` also passed. These export checks do not certify translation quality or replace the authenticated document/AI/database flow.

## Remaining work

The complete customer journey still needs an authenticated test session and a preview backend matching the staged frontend. The public preview currently points to the existing production roadmap endpoint; the staged backend has not been released. No production function, access grant, customer record or live release was changed during this continuation.
