# V105 Email Recovery Link Status

## Mobile recovery simplification

V105 extends `/reset-reparatur` so the user no longer needs to edit the long localhost URL on Android. The user can long-press the blue `Reset password` link in the newest email, copy the link, paste it into the repair page and continue.

The client accepts only HTTPS verification links for the exact project host `bcvggtnvuesaihqvgisg.supabase.co`, the exact `/auth/v1/verify` path and the `recovery` type. It exchanges the token hash directly with Supabase through `verifyOtp` and then opens the production recovery screen.

No recovery token is submitted to an AS Workspace Gold server endpoint.
