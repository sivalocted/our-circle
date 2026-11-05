# Release readiness

**Assessment: not ready for family-facing production or financial use.** This reconstruction prepared the code and staging instructions. It did not provision, migrate, upload, or deploy to any external service.

## Acceptance status

| Requirement | Status | Evidence / remaining action |
|---|---|---|
| Inspect project and preserve a recovery copy | **Done locally** | Source, routes, dependencies, data, tests, SQL and configuration reviewed. The project has no `.git`; an existing byte-for-byte pre-change backup is recorded in `PROJECT_AUDIT.md`. |
| Improve information architecture and navigation | **Implemented** | Direct Home, Memories, Play, Calendar, Chat, Trip Fund and Settings destinations; mobile navigation now keeps all five primary links visible. |
| Redesign landing page and core surfaces | **Implemented / locally reviewed** | Editorial Home and responsive pages; Playwright captures reviewed at desktop/mobile. Remote memory sources are deliberately blocked in tests and production media remains empty. |
| Remove fabricated production content | **Implemented for audited surfaces** | No demo account, fake activity/chat/calendar/payment records, invented destination, or seeded leaderboard is exposed as genuine. Trivia fallback was removed; source failure is explicit. Continue reviewing content additions. |
| Preserve genuine data and protect media | **Build protection verified; delivery incomplete** | Original files and catalogs are retained in source/dev. Public build excludes them and uses empty catalogs. Authenticated private storage/upload/restore is not implemented. |
| Authentication and permission enforcement | **Not verified** | Google OAuth and membership code plus SQL/RLS are prepared, but credentials are absent and the migration was not applied. Test member/nonmember/admin behavior in staging. |
| Calendar | **Local behavior verified; shared behavior not verified** | Browser create/edit/delete tested. Asia/Kolkata key generation and midnight rollover now have unit tests. Supabase persistence/RLS remain untested live. |
| Chat and presence | **Not verified** | Supabase history/send/realtime code exists; no configured service or two-account delivery/reconnect/privacy tests. |
| Photos and video | **Private production delivery incomplete** | Local layouts/viewer/playback behavior exist. No private bucket, upload validation, signed access, or restore workflow. Production archive is empty by design. |
| Games and multiplayer | **Local solo only** | Six games plus Surprise Wheel. Scores are device-local. No synchronized rooms or shared leaderboard. Trivia credits Open Trivia DB and does not fabricate fallback questions. |
| Trip fund and payments | **Financial use blocked** | Goal draft is browser-local; contributions are disabled. No beneficiary, order creation, server verification, webhook, ledger or reconciliation path. |
| Mobile/responsive and visual review | **Local Chromium checks passed** | Ten Playwright tests at desktop and Pixel 7 emulation; screenshots reviewed. No real-device/browser matrix or full keyboard/screen-reader session. |
| Accessibility | **Automated gate improved; manual review outstanding** | Lighthouse reports 100 accessibility for the unauthenticated production auth gate after contrast fixes. This is not a full audit and does not represent authenticated routes. |
| Performance | **Measured on auth gate only** | Lighthouse mobile/desktop Performance 100, Accessibility 100, Best Practices 100, SEO 63 by design; timings/limitations in `PERFORMANCE_REPORT.md`. No protected route, server, field data or media transfer measured. |
| Security | **Source review only** | See `SECURITY_AUDIT.md`. No penetration test, live RLS review, secret rotation, rate-limit test or provider-side review. |
| Automated tests and builds | **Pass locally** | Final production and staging builds passed. Vitest: 7 files / 22 tests. Playwright: 10 desktop/mobile tests. Production dependency audit: 0 vulnerabilities. Production and staging bundles each contain 24 files; private media path/name scans found no hits. SPA route and robots requests returned 200. |
| Lint | **Exits 0 with 22 warnings** | React effect/state, hook dependency, render purity and fast-refresh warnings remain. They should be resolved or individually reviewed before sustained maintenance. |
| Deployment, backup and rollback | **Prepared only** | Cloudflare Pages guide, route fallback, baseline header file, robots metadata and release checklist are present. No host, domain, CI, backup or restore drill has been configured. |

## Must pass before any private-data staging test

1. Provision owner-controlled staging host and isolated Supabase project. Configure Google OAuth callbacks and build variables without committing credentials.
2. Review and apply the SQL migration only to the isolated project. Verify RLS from at least two members, a nonmember and an administrator, including private Realtime topics.
3. Implement private media storage and safe delivery before importing any family images. Verify anonymous/nonmember denial and backup/restore.
4. Run cross-account chat/calendar tests, retry/reconnect and permission tests; verify the deployed SPA fallback, HTTPS and response headers.
5. Clear or explicitly accept the lint warnings and conduct keyboard, focus, screen-reader and authenticated-route accessibility review.
6. Re-run unit/E2E/build/audit/privacy scans, Lighthouse on representative staging routes, and a rollback/backup-restore drill.

Only after those gates pass should the owner invite family members. Payment collection requires a separate server-side implementation and provider sandbox/replay testing. No production deployment or data migration is authorized by this work.
