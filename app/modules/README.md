# AS Gold module boundaries

This directory is the target ownership structure for the V46 modularization. New behavior belongs to a domain module first; compatibility re-exports under `app/components` are temporary migration adapters only.

## Domains

- `language/` — interface language, output language, flags, language-menu state, explainer-video language.
- `navigation/` — page/back/menu navigation and mobile navigation state.
- `public/` — public landing surface, case discovery and pricing presentation.
- `tester/` — controlled tester-access state and tester guidance.
- `auth/` — login, registration, password policy and session-facing UI.
- `cases/` — clients, cases, deadlines, timeline, assessments and approvals.
- `documents/` — upload/camera, document processing, analysis and exports.
- `pricing/` — plans, terms, upgrade calculations and promo-code UI.
- `compliance/` — privacy, legal acceptance, AI controls and audit/deletion controls.
- `integrations/` — email/cloud integrations and provider-specific services.
- `services/` — shared Supabase, export and analysis services that contain no presentation logic.

## Rules

1. A module may expose components, hooks and services through explicit imports/props.
2. A module must not rearrange another module after render with `MutationObserver`, periodic DOM polling, `prepend`, `append`, or synthetic browser-history actions.
3. UI state such as an open language menu stays local or in an explicit state provider; it is not inferred from duplicated DOM controls.
4. Output-language selection is application state and must eventually be passed directly to analysis/export services; global `window.fetch` interception is a migration-only mechanism.
5. Existing functionality is preserved while code moves. Compatibility re-exports may remain temporarily so migration can be incremental and regression-safe.
6. Every removal of a legacy enhancer must be accompanied by a guard that verifies the replacement behavior rather than the old file location.
7. `main` is updated only after the modular branch builds successfully and the relevant navigation/functionality guards pass.
