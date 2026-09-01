# AS Gold module boundaries

This directory is the target ownership structure for the V46 modularization. New behavior belongs to a domain module first; compatibility re-exports under legacy `app/components` and `app/lib` paths are temporary migration adapters only.

## Domains

- `language/` — interface language, output language, flags, language-menu state, explainer-video language and language/translation catalogs.
- `navigation/` — page/back/menu navigation, accessibility and mobile resilience.
- `public/` — public landing surface, case discovery and pricing presentation.
- `tester/` — controlled tester-access state and tester guidance.
- `auth/` — login, registration, password policy and session-facing UI.
- `cases/` — clients, cases, deadlines, timeline, assessments and approvals.
- `documents/` — upload/camera, document processing, analysis and document-facing exports.
- `pricing/` — plans, terms, upgrade calculations, promo-code UI and promo translations.
- `compliance/` — privacy, legal acceptance, AI controls and audit/deletion controls.
- `integrations/` — email/cloud integrations and provider-specific services.
- `services/` — shared Supabase, export and analysis services that contain no presentation logic.
- `workspace/` — temporary application composition boundary while the protected/public workspace is split into smaller domain surfaces.

## Rules

1. A module may expose components, hooks and services through explicit imports/props.
2. A module must not rearrange another module after render with `MutationObserver`, periodic DOM polling, `prepend`, `append`, or synthetic browser-history actions.
3. UI state such as an open language menu stays local or in an explicit state provider; it is not inferred from duplicated DOM controls.
4. Output-language selection is application state and must be passed directly to analysis/export services; global `window.fetch` interception is migration-only and remains a release blocker.
5. Existing functionality is preserved while code moves. Compatibility re-exports may remain temporarily so migration can be incremental and regression-safe.
6. Every removal of a legacy enhancer must be accompanied by a guard that verifies the replacement behavior rather than the old file location.
7. Legacy compatibility files stay intentionally small. Domain implementation must not drift back into `app/components` or `app/lib`.
8. `main` is updated only after the modular branch builds successfully and the relevant navigation/functionality guards pass.

## Migration status — 1 September 2026

- `language/`: owns LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, output-language helpers, the complete language catalog chain and component translation catalogs. V43/V44 DOM correction layers are removed. OutputLanguageBridge no longer performs DOM polling; only its temporary fetch interception remains.
- `navigation/`: owns accessibility hardening and mobile resilience; root layout imports both modules directly.
- `tester/`: owns the paused tester state; public tester access remains closed and has no registration start link.
- `auth/`: owns password policy and password UI; broader login/registration composition is still inside WorkspaceApp.
- `cases/`: owns V24/V25 case workflow surfaces, V38 assessment/deadline/next-step logic, V39 timeline, V40 handoff, V41 consistency, V42 actionable gaps and their engines. Legacy component/lib paths are compatibility adapters.
- `documents/`: owns V26 document-analysis implementation; upload/orchestration remains to be extracted from WorkspaceApp.
- `pricing/`: owns PromoCodeControl and promo translations; plan/quote orchestration remains to be extracted from WorkspaceApp.
- `compliance/`: owns legal documents/footer and privacy controls.
- `integrations/`: IntegrationHub renders OAuth availability directly. The former global V38 integration DOM guard is deleted.
- `services/`: owns Office export implementation; the old `app/lib/officeExports.js` path is only an adapter. Supabase client and OCR orchestration still need extraction.
- `public/`: public enhancers are module-owned and legacy component paths are adapters, but several still use DOM enhancement internally and must be replaced by direct component composition.
- `workspace/`: `app/page.js` is already a thin entry point. The remaining large composition file is `app/modules/workspace/WorkspaceApp.js`, which still needs to be decomposed into public/auth/dashboard/document/pricing/account surfaces.

## Automated boundary guard

`scripts/test_v46_modular_boundaries.mjs` is part of the normal prebuild chain. It verifies the thin root entry, required domain files, direct layout ownership, single language-menu back/close control, absence of browser-history navigation hacks, tester lock, domain-owned language/pricing/services catalogs and thin legacy adapters.

## Remaining release blockers

- Replace the remaining `OutputLanguageBridge` fetch interception with explicit output-language data flow into OCR/document analysis, then remove the bridge from the root layout.
- Replace remaining public/case DOM enhancers with direct React component composition where they still mutate rendered markup.
- Decompose `WorkspaceApp.js` into public, auth, dashboard/cases, documents, pricing and account/compliance composition surfaces.
- Extract Supabase client/data access and OCR orchestration into service boundaries.
- Run the final full preview build plus mobile/navigation regression and functional smoke checks before touching `main` or reopening tester access.

Current gate: latest V46 modular ownership/guard build is green; `main` remains unchanged and tester access remains closed until all release blockers above are cleared.
