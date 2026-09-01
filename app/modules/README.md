# AS Gold module boundaries

This directory is the target ownership structure for the V46 modularization. New behavior belongs to a domain module first; compatibility re-exports under legacy `app/components`, `app/lib`, or route-local migration paths are temporary adapters only.

## Domains

- `language/` — interface language, output language, flags, language-menu state, explainer-video language and language/translation catalogs.
- `navigation/` — page/back/menu navigation, accessibility and mobile resilience.
- `public/` — public landing surface, case discovery and pricing presentation.
- `tester/` — controlled tester-access state and tester guidance.
- `auth/` — login, registration, password policy and session-facing UI.
- `cases/` — clients, cases, deadlines, timeline, assessments and approvals.
- `documents/` — upload/camera, document processing, analysis and document-facing exports.
- `pricing/` — plans, terms, upgrade calculations, promo-code UI and promo translations.
- `compliance/` — privacy, legal acceptance, withdrawal, AI controls and audit/deletion controls.
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
7. Legacy compatibility files stay intentionally small. Domain implementation must not drift back into `app/components`, `app/lib`, or route-local helper files.
8. Shared provider clients belong in `services/`; page or compliance components should not create their own duplicate Supabase client.
9. `main` is updated only after the modular branch builds successfully and the relevant navigation/functionality guards pass.

## Migration status — 1 September 2026

- `language/`: owns LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, persisted interface/output language preferences, output-language helpers, the complete language catalog chain and component translation catalogs. V43/V44 DOM correction layers are removed. WorkspaceApp no longer owns localStorage/document language synchronization, and output-language transport no longer relies on DOM polling or global fetch interception.
- `navigation/`: owns accessibility hardening and mobile resilience; root layout imports both modules directly.
- `tester/`: owns the paused tester state; public tester access remains closed and has no registration start link.
- `auth/`: owns password policy and password UI; broader login/registration composition is still inside WorkspaceApp.
- `cases/`: owns V24/V25 case workflow surfaces, V38 assessment/deadline/next-step logic, V39 timeline, V40 handoff, V41 consistency, V42 actionable gaps and their engines. The V38 deadline warning is now direct React composition inside case/document detail instead of a global DOM observer. Legacy component/lib paths are compatibility adapters.
- `documents/`: owns V26 document-analysis implementation; upload/orchestration remains to be extracted from WorkspaceApp.
- `pricing/`: owns PromoCodeControl and promo translations; plan/quote orchestration remains to be extracted from WorkspaceApp.
- `compliance/`: owns legal documents/footer/privacy controls plus the privacy-dashboard and withdrawal-flow implementations. The route-local PrivacyDashboard/WithdrawalForm files are thin adapters, while the pages import the compliance module directly.
- `integrations/`: IntegrationHub renders OAuth availability directly. The former global V38 integration DOM guard is deleted.
- `services/`: owns Office export implementation, the shared Supabase client and explicit document-analysis invocation. Workspace and compliance surfaces share the same Supabase client, and OCR receives the selected output language through the service boundary. Remaining CRUD/export orchestration still needs extraction.
- `public/`: public enhancers are module-owned and legacy component paths are adapters, but several still use DOM enhancement internally and must be replaced by direct component composition.
- `workspace/`: `app/page.js` is already a thin entry point. The remaining large composition file is `app/modules/workspace/WorkspaceApp.js`, which still needs to be decomposed into public/auth/dashboard/document/pricing/account surfaces.

## Automated boundary guard

`scripts/test_v46_modular_boundaries.mjs` is part of the normal prebuild chain. It verifies the thin root entry, required domain files, direct layout ownership, single language-menu back/close control, absence of browser-history navigation hacks, tester lock, domain-owned language/public/auth/compliance/pricing/services catalogs, direct compliance-route ownership, shared Supabase service use and thin legacy adapters.

## Remaining release blockers

- Replace remaining public/case DOM enhancers with direct React component composition where they still mutate rendered markup.
- Decompose WorkspaceApp.js into public, auth, dashboard/cases, documents, pricing and account/compliance composition surfaces.
- Move the remaining WorkspaceApp CRUD, upload and export orchestration behind service/domain boundaries.
- Run the final full preview build plus mobile/navigation regression and functional smoke checks before touching main or reopening tester access.

Current gate: latest V46 compliance/service modularization build is green; `main` remains unchanged and tester access remains closed until all release blockers above are cleared.

- `documents/uploadConfig.js`: owns upload limits, accepted file extensions and localized upload validation copy; WorkspaceApp only consumes this domain configuration.

### Workspace catalog boundaries

- `auth/passwordUi.js`: password visibility copy.
- `public/publicUi.js`: public landing and language-control copy.
- `documents/exportUi.js`: export labels and status copy.
- `workspace/workspaceText.js`: protected-workspace application copy.

WorkspaceApp consumes these catalogs; it no longer owns their leading definitions.

### Extracted domain catalogs

- `pricing/catalog.js`: plans, terms, plan journey and recommendation mappings.
- `public/catalog.js`: public discovery, transparency and tester-link copy.
- `compliance/workspaceControlText.js`: account-control, audit and deletion copy.
- `workspace/stateConfig.js`: initial workspace data/case/section state.

These declarations no longer live in `WorkspaceApp.js`; the composition layer consumes them through explicit domain imports.

### Workspace composition components

- `auth/PasswordField.js`: reusable authentication password control.
- `workspace/AppLogo.js`: shared product mark.
- `workspace/ProtectedWorkspaceShell.js`: protected header/language/logout/message/footer composition.

The workspace controller now delegates repeated shell markup to explicit components.

- `auth/AuthSurface.js`: login and registration composition; the workspace controller supplies state and handlers only.

- `workspace/LoadingSurface.js`: isolated loading state. The protected application has a single shell owner in `ProtectedWorkspaceShell.js`.

- `public/PublicLanding.js`: complete public landing, case-discovery, transparency and pricing composition.

- `services/`: transactional pricing, compliance, approval and document storage/database operations are now isolated behind repository/service boundaries; WorkspaceApp retains workflow state and user-facing validation only.

- `services/authRepository.js`: session lookup/subscription, sign-in, reset, test registration and sign-out are isolated from WorkspaceApp; AuthSurface remains presentation-only.

- `services/exportService.js`: workspace and account export artifact generation/download is isolated from WorkspaceApp; the controller only applies permissions, audit logging and user feedback.

- `language/useLanguagePreferences.js`: owns persisted interface language, output language, RTL document direction and the existing output-language event compatibility signal.

- `cases/DeadlineWarningCard`: V38 deadline intelligence now renders from explicit case/document props; the legacy V38 enhancer export is a no-op compatibility adapter and is no longer mounted in the root layout.
