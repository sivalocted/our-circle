# Deployment and staging guide

## Current deployment status

This checkout is prepared to produce a static SPA bundle, but no hosting account, domain, Supabase project, OAuth client, private media bucket, or production secrets were provided. No deployment was made. The application is **not ready for family data or financial use**: media delivery is intentionally empty in production; database migration/RLS and OAuth are not live-verified; chat and shared calendar have no verified service; contribution/payment flows are disabled.

Use a dedicated, disposable staging Supabase project first. Do not upload genuine family photos or enter production data until the release gates in [`RELEASE_READINESS.md`](RELEASE_READINESS.md) pass.

## Static build

The current Cloudflare Pages candidate configuration is:

- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Node: 22.12+ or 20.19+ (the local run used Node 26.13.0)
- SPA route fallback: emitted `dist/_redirects`
- Security/indexing rules: emitted `dist/_headers`
- Public crawler policy: emitted `dist/robots.txt`; the page and response header request `noindex, nofollow`.

The `_headers` format is supported by Cloudflare Pages. If using another static host, translate the SPA fallback and response headers to that host's format and verify the deployed responses. Vite preview does not apply hosting response headers, so a successful local preview is not proof of deployed header behavior.

Before uploading `dist`, inspect it for family names, known album URL IDs, `photos/`, `.env` values and server-only secrets. The current build configuration aliases private media catalogs to empty modules and excludes the `public/` directory from all build modes; keep this invariant. Do not upload `.research/`, local catalogs, tests, screenshots, or environment files.

## Supabase staging sequence

1. Create a new non-production Supabase project under the owner's account; record region, plan, project URL and recovery owner.
2. Review `supabase/migrations/202611060001_family_access_and_data.sql` against the empty staging schema and current Supabase SQL/RLS behavior. The migration is a prepared artifact and has not been applied or tested against a live database.
3. Back up the staging database, apply the migration only there, and verify table grants, RLS policies, `SECURITY DEFINER` search paths and Realtime authorization.
4. Configure Google OAuth redirect URIs and allowed origins for the staging hostname. Add only the authorized staging callback and test an allowed member and a denied identity.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as build-time variables. The publishable key is browser-visible; access must rely on correct RLS. Never add service-role, SMTP, webhook, or payment secrets to `VITE_*` variables.
6. Deploy a preview build. Test sign-in/sign-out, membership denial, calendar create/edit/delete, chat ordering/reconnect, private Realtime access and all failure states with separate accounts.
7. Verify HTTPS, redirects, security headers, noindex policy, media privacy, logs, backup/restore and rollback before any family user is invited.

`.env.example` lists names only. Copy it to a local ignored `.env.local` only for an authorized project; never commit credentials. Razorpay variables are reserved for future server-side work and are not used by the current browser app.

## Media and payments

Do not route original Google Photos URLs directly through the public app. A future media implementation must use an authenticated private bucket, member-authorized listing/downloads, short-lived URLs where needed, upload MIME/size/decode validation, deletion policy, and denial tests for anonymous/nonmembers. Local photos and private catalogs are retained in the source checkout but excluded from `dist`.

Do not enable contributions. There is no trusted order creation, webhook signature check, replay/idempotency handling, reconciliation, refund path, or beneficiary configuration. Any eventual payment integration must run verification server-side and be tested with a provider sandbox before a separately authorized launch.

## Rollback and recovery

- Static frontend: retain the prior successful hosting deployment and restore it through the host's deployment rollback facility; test rollback on staging first.
- Database: take and verify a backup before each schema migration. Maintain a reviewed down/forward-recovery procedure; do not assume a SQL rollback restores deleted data.
- Media: establish object retention/versioning and a restore drill before importing private media.
- Credentials: document the owner and rotation path for Supabase/OAuth/SMTP/payment credentials. Rotate leaked secrets and revoke active sessions as appropriate.

No backup or restore drill has been performed in this workspace. Assign an accountable project owner and test each recovery path before release.
