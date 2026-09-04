# V103 Direct Password Reset Status

Date: 4 September 2026

## Observed mobile behavior

After the owner reported pressing the reset control, the authentication logs showed two password sign-in attempts and a repeated registration, but no recovery request. The installed mobile surface therefore still allowed the wrong auth action to be triggered.

## Correction

- `?start=reset` opens a dedicated password-reset request screen.
- The screen contains only the email field and the reset submit button.
- No password field, sign-in submit or registration action is present in that reset form.
- The existing V102 production relay remains the only reset delivery path.

## Owner recovery entry

`https://app-gold-workspace.vercel.app/?start=reset&release=V103`
