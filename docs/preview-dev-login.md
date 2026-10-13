# Preview dev login

Configured previews show **Dev sign in** in the sign-in dialog. One click signs into a shared, disposable test account on that preview, without Google or email redirects. A real Supabase password session is created; the account credentials stay on the server.

The shortcut is disabled by default. Both the button and endpoint stay disabled on production, including when preview settings are accidentally assigned to Production. Preview login also refuses Mizen's production Supabase project (`caalzsewxononwiqlklv`). Local development keeps using `DEV_AUTH_EMAIL` and `DEV_AUTH_PASSWORD`.

## Setup

1. Create a separate [staging Supabase project](https://supabase.com/docs/guides/deployment/managing-environments) and apply the app's database schema and migrations. Create a confirmed test user with an email and password, without admin privileges, and add disposable recipes to that account. Do not copy personal data into it.
2. Enable [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) for the preview project before enabling the shared login. Anyone who can access an enabled preview can enter the test account. Keep preview credentials limited to trusted branches and collaborators.
3. In Vercel, assign the settings below to **Preview only**. Use the staging project's canonical Supabase URL and its own keys for every Supabase setting used by the app, including the server-only service role key required for the shared sign-in limit. Never reuse production keys. If both `parse-n-plate` and `v0-mizen` previews are used, configure each project separately.

| Setting                         | Value                                                           |
| ------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://<staging-project-ref>.supabase.co`                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging project's public anon key                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Staging project's server secret, required for the sign-in limit |
| `PREVIEW_DEV_AUTH_PROJECT_REF`  | Staging project's 20-character project reference                |
| `PREVIEW_DEV_AUTH_EMAIL`        | Dedicated test account's email                                  |
| `PREVIEW_DEV_AUTH_PASSWORD`     | Dedicated test account's password, stored as a server secret    |
| `PREVIEW_DEV_AUTH_ENABLED`      | `true`                                                          |

4. Apply `supabase/migrations/20261013220621_add_preview_dev_signin_limit.sql` to the staging project before deploying this change. It creates a private counter and a server-only function. Preview sign-in permits ten attempts per minute for each shared test account across all deployments; requests beyond that return 429 with a retry interval. A missing migration or an unavailable limit check blocks sign-in with 503. The password sign-in itself still uses the ordinary user session, not the server key.
5. Enable access to [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables). The server must receive `VERCEL_ENV=preview`; this is separate from `NODE_ENV`, which is production for deployed builds. Do not set these system variables manually.
6. Redeploy the preview after configuring the settings. Open **Sign in**, choose **Dev sign in**, and verify that a saved test recipe appears in the staging database. Check that production has no dev button and that POST `/api/auth/dev-signin` returns 404 there.

Missing settings, a mismatched project reference, or the production database keep the shortcut unavailable. Setting `PREVIEW_DEV_AUTH_ENABLED=false` disables it on the next deployment. Existing Supabase sessions last until signed out or revoked.

Dev sign-in POST requests must include an `Origin` matching the requested URL. The button supplies this through normal browser requests. Cross-site requests and requests without an origin are rejected before checking the counter or signing in. Local development uses this origin check but does not require the staging counter.

Regular Google and email login still use the existing callback routes. Configure [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) separately if those flows should work in staging.

## Production project changes

If Mizen moves to another production Supabase project, update `PRODUCTION_SUPABASE_PROJECT_REF` in `src/lib/dev-auth.ts` before enabling preview login against new projects.
