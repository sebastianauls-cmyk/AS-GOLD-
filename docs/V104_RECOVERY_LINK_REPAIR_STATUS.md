# V104 Recovery Link Repair Status

## Problem

Supabase currently falls back to `localhost:3000` after a password-recovery email link is opened, even though the application requests the production redirect. This leaves a valid recovery session in the URL fragment but opens an unreachable host on mobile devices.

## Safe recovery bridge

V104 adds `/reset-reparatur` as a temporary, client-only repair route. A user copies the complete localhost recovery URL and pastes it into the route. The route verifies the localhost host, recovery type, access token and refresh token, then changes only the destination host to the production application.

The recovery URL is never submitted to an application endpoint. Processing uses browser state only, and the page contains no `fetch` request.

## Permanent configuration follow-up

The hosted Supabase Auth URL configuration must use `https://app-gold-workspace.vercel.app` as the Site URL and allow `https://app-gold-workspace.vercel.app/**` as an additional redirect URL. V104 preserves user access until that account-level setting is corrected.
