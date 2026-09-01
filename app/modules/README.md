# AS Gold module boundaries

This directory is the target ownership structure for the V46 modularization. New behavior belongs to a domain module first; compatibility re-exports under legacy `app/components`, `app/lib`, or route-local migration paths are temporary adapters only.

## Domains

- `language/` — interface language, output language, flags, language-menu state, explainer-video language and translation catalogs.
- `navigation/` — page/back/menu navigation, accessibility and mobile resilience.
- `public/` — public landing, public header, case discovery, first-action/problem entry, explainer and public product presentation.
- `tester/` — controlled tester-access state, tester guidance and staged share UI.
- `auth/` — login, registration, password policy and session-facing UI.
- `cases/` — clients, cases, deadlines, timeline, assessments, completion guidance and approvals.
- `documents/` — upload/camera configuration, document processing, analysis and document-facing exports.
- `pricing/` — plans, terms, upgrade calculations, promo-code UI and promo translations.
- `compliance/` — privacy, legal acceptance, withdrawal, AI controls and audit/deletion controls.
- `integrations/` — email/cloud integrations and provider-specific services.
- `services/` — shared Supabase, repositories, export and analysis services with no presentation logic.
- `workspace/` — application composition/controller boundary while remaining workflow orchestration is moved behind domain/service APIs.

## Rules

1. A module exposes behavior through explicit imports, props, hooks or service functions.
2. A module must not rearrange another module after render with `MutationObserver`, periodic DOM polling, `prepend`, `append`, synthetic browser-history actions or global click interception.
3. UI state such as an open language menu stays local or in an explicit state provider; it is not inferred from duplicated DOM controls.
4. Output-language selection is application state and is passed directly to analysis/export services; global `window.fetch` interception is forbidden.
5. Existing functionality is preserved while code moves. Compatibility re-exports may remain temporarily so migration can be incremental and regression-safe.
6. Every removal of a legacy enhancer is accompanied by a guard that verifies the replacement behavior rather than the old file location.
7. Legacy compatibility files stay intentionally small. Domain implementation must not drift back into `app/components`, `app/lib`, or route-local helper files.
8. Shared provider clients belong in `services/`; page or compliance components must not create duplicate Supabase clients.
9. `main` is updated only after the modular branch builds successfully and all release/navigation/functionality guards pass.

## Migration status — 1 September 2026

- `language/`: complete domain owner for LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, persisted interface/output-language preferences and all language/translation catalogs. V43/V44 DOM correction layers are gone. Output-language transport is explicit and no longer uses DOM polling or fetch interception.
- `navigation/`: owns accessibility hardening and mobile resilience; root layout imports both modules directly. Current guards verify one localized back/close control per language menu, Escape handling and no browser-history hacks.
- `public/`: direct React composition is now split across `PublicLanding`, `PublicHeader`, `PublicCaseDiscoverySection`, `PublicLanguageModules`, `V37FirstAction`, `ProblemNavigator`, `ExplainerVideo` and `ProductIntroCompact`. The former public DOM-enhancer behavior has been replaced by explicit component ownership and direct callbacks. Public case navigation is owned by `caseNavigation` and invoked from the case-discovery component.
- `tester/`: owns paused tester state and staged tester-share UI. Public tester access remains closed until final release gates are satisfied.
- `auth/`: `AuthSurface`, PasswordField, password policy/UI and `authRepository` own authentication presentation/service boundaries. WorkspaceApp supplies workflow state and handlers.
- `cases/`: V24/V25 case workflow plus V38 deadline/assessment/next-step, V39 timeline, V40 handoff, V41 consistency and V42 actionable gaps render directly from React-owned case state. Legacy global enhancer exports are compatibility adapters/no-ops.
- `documents/`: owns document surfaces, V26 analysis UI, upload configuration and export UI. Database/file operations and analysis invocation are behind services/repositories; some workflow sequencing still lives in WorkspaceApp.
- `pricing/`: owns pricing catalogs, pricing surface, upgrade panel, promo-code control/translations and pricing repository boundaries. Remaining workflow sequencing is controller-level only.
- `compliance/`: owns legal documents/footer, privacy controls/dashboard, withdrawal flow, account surface/control panel and compliance repository text/operations.
- `integrations/`: IntegrationHub renders availability/OAuth paths directly; no global post-render integration enhancer remains.
- `services/`: owns shared Supabase client, document analysis, office/export services plus auth/workspace/pricing/compliance/approval/document repositories. Presentation modules do not create duplicate provider clients.
- `workspace/`: `app/page.js` is a thin entry point. `WorkspaceApp.js` is now primarily a controller/composition layer delegating to PublicLanding, AuthSurface, DashboardSurface, WorkspaceCaseSurfaces, DocumentsSurface, UpgradePanel, AccountSurface and ProtectedWorkspaceShell, but it remains large and still contains workflow orchestration that should be reduced before final release.

## Public-surface split completed in this phase

`PublicLanding.js` no longer owns all public markup itself. Header/language navigation moved to `PublicHeader.js`; audience/case chooser/result/process moved to `PublicCaseDiscoverySection.js`. Existing customer-flow, V44 language-order, V56 parity and V69 public-parity guards were updated to validate the new ownership boundaries rather than requiring markup to remain in one file.

The preview build for commit `fe9f45d6747edf9379116b7b25e2f0327aac7235` completed the full prebuild chain and Next.js production build successfully. The V38 mobile-resilience guard, accessibility guard, V43 navigation replacement guard, V44 language-order guard, V45 output-language guard, V46 modular-boundary guard, V56 parity guard, V69 public-parity guard and V70 tester-lock guard all passed. The tester route remains closed.

## Automated boundary guards

The normal prebuild chain includes dedicated guards for customer flow, language/menu navigation, mobile resilience, accessibility, output-language transport, modular boundaries, current public parity and tester staging. `scripts/test_v46_modular_boundaries.mjs` verifies the thin root entry, required domain files, direct layout ownership, single language-menu back/close control, absence of browser-history navigation hacks, tester lock, domain-owned catalogs/services, direct compliance ownership, shared Supabase service use and thin legacy adapters.

## Remaining release blockers

- Reduce the remaining `WorkspaceApp.js` controller by moving workflow orchestration (especially CRUD/upload/analysis/export sequencing) behind explicit domain/service functions where practical without changing behavior.
- Remove or retire workspace-local compatibility adapter imports once no runtime code depends on them; canonical domain imports should be used directly.
- Run a final preview smoke pass against the fully reduced controller, including mobile language-menu/back navigation, public problem entry, auth entry/back path, protected cases/documents flows and export entry points.
- Compare/synchronize latest `main` immediately before release, rerun the complete regression/build gate, and only then merge.
- Reopen tester access only after the final synchronized release candidate is green; until then `/testen` stays paused.

Current gate: the modular branch is green after the public-surface split, `main` remains unchanged, and tester access remains closed. The next work is controller/orchestration reduction rather than further public DOM cleanup.

### Controller reduction — session/audit boundary (2 September 2026)

The active controller now delegates local activity persistence and server audit recording to `workspace/useWorkspaceAudit.js`, and delegates Supabase session bootstrap/auth-state subscription cleanup to `workspace/useWorkspaceSession.js`. `WorkspaceAppV2.js` keeps only composition state and explicit signed-out reset intent; it no longer imports `recordAuditEvent`, `getAuthSession` or `watchAuthState`. A dedicated guard verifies these boundaries before the full prebuild/build gate.

