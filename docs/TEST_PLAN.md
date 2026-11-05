# Test plan and current results

**Last run:** 2026-11-06, local Windows environment  
**Node/npm:** Node 26.13.0, npm 11.20.0

## Commands and latest results

| Command | Result | Scope / caveat |
|---|---|---|
| `npm run build` | **Pass** | TypeScript project build plus production Vite build. Production output was inspected for private photo catalogs and local photo assets. |
| `npm run test` | **Pass: 7 files, 22 tests** | Auth identity mapping, local calendar CRUD/date validation, trip/payment safety guards, no undocumented trivia fallback, IST date/countdown rollover, HTTPS/YouTube/Vimeo source validation, and no synthetic capture metadata for user-added videos. Unit test discovery limited to `src/tests/**/*.test.ts`. |
| `npm run test:e2e` | **Pass: 10 tests** | Chromium on 1440×1000 desktop and Pixel 7 emulation. Local preview navigation (all primary mobile links in viewport), chat unavailable state, arcade/local score state, calendar CRUD, memories layout/overflow, opt-in video provider networking, profile and trip empty/payment states. Third-party Google album URLs are blocked in tests. |
| `npm run lint` | **Exit 0 with 22 warnings** | Oxlint reports React effect/state, hook dependency, render purity and fast-refresh warnings. No lint errors. Review and clear before accepting ongoing maintenance without review. |
| `npm audit --omit=dev` | **Pass: 0 vulnerabilities** | Production dependency tree only. Audit is point-in-time and must be repeated before release. |

## Browser coverage

Playwright configuration starts Vite on `127.0.0.1:4177`, uses Chromium, and captures screenshots under ignored `test-results/`. Tests enter preview only using the development-only button. Each test blocks Google Photos host requests so original family media URLs are not sent to a third party during the local run. Test screenshots contain local family images and must be treated as private artifacts.

Responsive checks assert no horizontal overflow on Home and Memories. Home and Memories screenshots were inspected manually at desktop/mobile sizes; the current screenshots use local development photos and are private artifacts. After a preview-scroll issue was found, the app now returns to the top on entering local preview. Full-page screenshots require manually scrolling through lazy media first to force network/decode states into view.

## Unit coverage

- User-provided metadata cannot set administrator role; actual membership role is resolved from the database query.
- No seeded fake events; local calendar create/edit/delete and invalid dates/empty title are tested.
- No exposed beneficiary details; browser cannot record or verify contributions; unverified browser totals remain zero.
- India Standard Time date keys, midnight rollover, countdown and puzzle numbering are tested with fixed UTC instants independent of the developer's local offset.
- Direct HTTPS stream, YouTube share/watch and Vimeo public/unlisted links are parsed; E2E confirms the YouTube frame is not requested before the user opts in.

## Not tested and not implied to work

- OAuth with a real Google client; auth session restoration/expiry across provider environments.
- Database migration execution, SQL syntax/privileges on the intended Supabase version, or RLS across two real accounts.
- Cross-device calendar CRUD, chat delivery/order/deduplication/reconnect, presence, private Realtime authorization.
- Storage upload/download limits, private object policies, signed URL expiry, EXIF/privacy handling, deletion and restore.
- Payment provider orders/webhooks/signature/replay/idempotency/refunds/reconciliation.
- Screen-reader sessions, keyboard-only modal focus trapping/restoration, contrast measurements, full cross-browser matrix, real mobile hardware/network, concurrent user load.
- Production Lighthouse route metrics until a representative protected application route can be served with a configured test project.

## Before staging sign-off

1. Add RLS tests using at least one active member, one non-member, and two members with different roles.
2. Add integration tests against an isolated Supabase project (never seed production).
3. Add media upload/download, file-validation, payment webhook replay and realtime reconnect tests after those functions exist.
4. Continue accessibility work using the current Lighthouse contrast findings and perform keyboard/screen-reader review; automated scores are not certification.
5. Run Lighthouse on a representative protected staging route; record route, viewport, network/CPU profile, warm/cold cache, browser version and field Core Web Vitals when they exist. Lab INP is not available from a single Lighthouse trace; use TBT only as a diagnostic.
6. Test successful deploy, rollback, backup restore and configuration rotation on staging before family access.
