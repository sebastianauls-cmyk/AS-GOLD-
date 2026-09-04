# V102 Password Reset Delivery Status

Date: 4 September 2026

## Observed failure

The owner account was active and confirmed, but no `/recover` request reached Supabase after the reset button was used from the installed app. Authentication traffic from that installation identified its origin as `http://localhost:3000`.

## Correction

- Password reset requests now go through the production endpoint `/api/auth/password-reset`.
- The client always contacts the canonical production deployment, including when the installed shell reports a localhost origin.
- The endpoint accepts only the production origin and the known installed-app origin.
- Redirect targets are fixed server-side and cannot be supplied by callers.
- Provider errors are sanitized and account existence is never disclosed.

## Verification

The V102 guard verifies the production relay, fixed redirect, origin restriction and release marker. The full build remains the release gate.
