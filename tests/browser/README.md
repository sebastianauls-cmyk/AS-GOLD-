# Independent public browser check

This suite runs real Chromium and WebKit processes on GitHub-hosted runners. It
does not use the ChatGPT Work cloud-browser connection. Tests target the currently
published public application at `https://app-gold-workspace.vercel.app`.

Coverage:

- Public product explanation in all eleven languages, including RTL layout and
  horizontal overflow checks.
- Desktop Chromium, Android-sized Chromium emulation and iPhone-sized WebKit
  emulation. These are not physical-device tests.
- All eight feature panels and the public plan details.
- Independent interface/output languages and country-example choices.
- Explicit country/language handoff into registration/login, reload persistence
  and cancellation.
- Uncaught JavaScript errors; console errors are retained for diagnosis.

The suite does not enter credentials, submit registration, create cases, upload
documents, start paid or AI operations, or test the authenticated backend. A green
result applies to this public scope, not to the entire application. A PR run checks
the live URL, not the PR's preview deployment.

Run from this directory:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm test
```

Use `ASH_BROWSER_BASE_URL` to target another explicitly chosen test deployment.
The committed workflow uses the public production address and requires no secrets.

The **ASH Public Browser Check** workflow runs when this suite changes and can also
be started from GitHub Actions using **Run workflow**. Each run uploads a report,
screenshots and diagnostic files retained for fourteen days. Failed tests also
retain traces and videos. Public pages are captured without account credentials.
