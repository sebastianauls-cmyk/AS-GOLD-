# Workspace migration boundary

`WorkspaceApp.js` is the preserved V45 application page moved behind an explicit workspace-module boundary. Its behavior is intentionally unchanged during this migration step.

The small `components/` and `lib/` files in this directory are temporary dependency adapters so the original relative imports continue to resolve while the monolith is split safely. New code must import the owning domain modules directly rather than adding new adapters here.

Next extraction order: public shell -> auth/session -> dashboard -> cases/clients -> documents/approvals -> account/billing -> shared services. After each extraction, the corresponding compatibility adapter is removed when no longer needed.
