# Our Circle

A private family space for photos, plans, games and conversation. The interface and local behavior are being rebuilt; a production data service has not been provisioned in this checkout. See [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) before enabling family access.

## Local development

Requirements: Node.js 20.19+ or 22.12+; this project was checked with Node 26.13.0 and npm 11.20.0.

```powershell
npm ci
npm run dev
```

When Supabase is not configured, the development auth page provides **Explore local preview**. Local preview is an explicit development-only affordance. Calendar records, favorites, settings, solo scores and video URL drafts remain in that browser. The original development album catalog and `public/photos/` images are private user content; do not expose the dev server to the public internet.

## Environment configuration

Copy `.env.example` to `.env.local` only if you have an authorized Supabase project, then provide:

- `VITE_SUPABASE_URL`: project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key (browser-visible by design; security depends on RLS).
- `VITE_SUPABASE_ANON_KEY`: legacy fallback only.

No live values are included in this repository. The optional Razorpay names in the template are placeholders for future **server-only** function secrets; never prefix a secret with `VITE_` or use it in browser code.

## Commands

```powershell
npm run build      # typecheck and production bundle
npm run lint       # Oxlint (currently exits 0 with React/hook warnings)
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright desktop and mobile Chromium workflows
npm run preview    # serve the built static bundle locally
```

Production build behavior is deliberately privacy preserving: local photo assets are not copied, and album/photo data modules resolve to empty catalogs. Configure authenticated private media storage before expecting production memories to display.

## Backend preparation

`supabase/migrations/202611060001_family_access_and_data.sql` prepares membership, chat, calendar, trip and realtime policies. It has not been applied or tested against a real project. Review it with a dedicated staging project, confirm family identities, back up the target, then test RLS from member/nonmember accounts before production. Never run it against an unknown existing database without a schema review.

## Project documentation

- [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md)
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md)
- [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md)
- [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md)
- [`docs/PERFORMANCE_REPORT.md`](docs/PERFORMANCE_REPORT.md)
- [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)
- [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
