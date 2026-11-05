# Project audit

**Audited:** 2026-11-06  
**Project:** Our Circle  
**Status:** Reconstruction in progress; not production-ready

## Scope and evidence

Inspected the application source, routes, configuration, lockfile, Supabase migration, media catalogs, public assets, tests, and build output. The repository has no `.git` directory, so there is no branch or working-tree state to report. Before changes, a byte-for-byte project backup was found at `C:\Users\siriv\.gemini\antigravity\scratch\our-circle-backups\before-reconstruction-20261106`. No destructive Git operations were used.

The project builds locally, but there is no supplied Supabase URL/key, Google OAuth configuration, connected database, private media bucket, mail sender, payment credentials, deployment provider, domain, or staging environment. Consequently, online data flows and production authentication cannot be verified here.

## Stack and structure

- React 19.3, TypeScript 7, Vite 8.3, Tailwind CSS 4, React Router 7; npm lockfile/package manager.
- Supabase JS 2.118 is the intended auth/database/realtime provider. This checkout has no backend project configuration.
- `src/App.tsx` owns route access, session state, realtime lifecycle, and app-wide preferences. Routes are now lazy-loaded; feature UI is grouped in `pages/`, `components/`, and `services/`.
- `src/data/circleData.ts` and `src/data/albumVideos.ts` contain local development catalogs, including personal album links. Their provenance and capture metadata have not been independently verified. `public/photos/` contains local image files. These sources are retained and are deliberately excluded from public production output until private authenticated storage is configured.
- A SQL migration prepares membership, chat, calendar, trip, and private-realtime tables/policies. It has not been run against a real Supabase project.
- Playwright Chromium E2E and Vitest unit tests are configured. Their current coverage is local-preview only.
- No server runtime or application API exists in this checkout. Service-role operations, uploads, payment verification, and admin bootstrap must be implemented as trusted backend operations.

## Routes and functions

| Route | Purpose | Current behavior |
|---|---|---|
| `/` | Editorial landing page | Responsive landing/preview shell; production route remains behind auth gate. Production media catalog is intentionally empty. |
| `/memories` | Photo/video archive | Multiple editorial compositions, lightbox, slideshow, favorites; local development media only. No authenticated storage integration yet. |
| `/play` | Browser game arcade | Local solo games and device-local scores. It does not claim multiplayer or a shared scoreboard. |
| `/calendar` | Family calendar | Create/edit/delete and retrieve events in browser storage; Supabase-backed path is implemented in code but not validated against a live database. Asia/Kolkata date keys/countdown are timezone-aware and have rollover tests. |
| `/chat` | Family conversation | Database-backed history/send/realtime code; unavailable in unauthenticated local preview. Live persistence, reconnect and member privacy policies remain unverified. |
| `/trip-fund` | Trip plan and contributions | Goal draft is browser-local; payment entry and unverified contribution totals are disabled. SQL tables are prepared but the UI is not wired to a live database. No verified destination, beneficiary, or payments are supplied. |
| `/settings` | Profile and preferences | Profile comes from authenticated identity; reduced-motion, sound, feedback preferences persist locally. Account/member administration is intentionally unavailable until protected backend setup exists. |

## Product and visual findings

- The source had an overloaded, media-first experience with weak route ownership and prototype labels. Navigation now separates memories, play, calendar, chat, and settings.
- The home page has an editorial hero, meaningful feature entry points, no fabricated social proof, and responsive compositions. Important actions are reachable without treating the home route as a data dashboard.
- Memories retain distinct cinematic, editorial, spatial, filmstrip, and motion views rather than one generic photo grid. The page uses safe image/video fallbacks, handles empty catalogs, and avoids deleting entries on temporary network failure. Its local video source manager accepts HTTPS streams and opt-in YouTube/Vimeo embeds.
- Chat, calendar, trip-fund, and game pages expose unavailable/empty states. Browser-local game/calendar data is not represented as shared server state.
- Reduced-motion preferences now affect Motion components, the ambient canvas, video autoplay and slideshow camera movement; explicit video playback remains available.
- Visual QA exposed and corrected the post-preview scroll jump and compact mobile arcade/calendar header wrapping. Current Playwright screenshots cover desktop and Pixel 7 emulation, though they are not a substitute for real-device testing or review of every modal/state.

## Integrity and privacy findings

- No seeded sample members, fake chat, fake calendar events, online count, scores, donations, payment totals, or invented destination are used by the production route.
- The development album catalog includes personal context and Google Photos links; its labels and capture metadata are not independently verified. A production alias substitutes empty media catalogs, and Vite no longer copies the local public directory in production builds. This prevents browser bundles or static asset paths from exposing those materials in a public deployment.
- Local preview exposes only a visible development-only entry point. OAuth identity, database membership and RLS are the production access boundary; browser-set roles are not trusted.
- Trips and transactions are sensitive. The browser cannot verify or insert contribution claims; payment buttons remain disabled until server verification exists.
- No API secrets were supplied. `.env.example` contains names only; credentials must be configured outside source control.

## Engineering gaps and known risks

1. **Backend unavailable:** migration has not been applied; OAuth, membership bootstrap, RLS, chat persistence, calendar persistence, and realtime channel authorization are not validated on a project.
2. **Private media missing:** the archive is intentionally empty in production. Upload, metadata, signed delivery, size/MIME validation, revocation policy, and backup/restore remain to be built and tested.
3. **No verified payment path:** no provider account, beneficiary, Edge Function, webhook/signature validation, idempotency, refund flow, reconciliation, or ledger audit trail. Contribution collection is blocked.
4. **No environment/deployment:** no domain, HTTPS host, CI pipeline, staging, response headers, monitoring, error reporting, backup schedule, or rollback rehearsal.
5. **Security and resilience:** the client SQL/RLS design is prepared but unexecuted. Rate limiting, abuse protection, CSRF review for any future server routes, and live multi-account permission tests are outstanding.
6. **Accessibility:** Lighthouse contrast checks were run on the unauthenticated production auth gate and the low-contrast text was corrected. Screen-reader, full keyboard and authenticated-route review are still outstanding.
7. **Performance:** chunk sizes and Lighthouse metrics for the unauthenticated gate are recorded in `PERFORMANCE_REPORT.md`; authenticated routes are blocked by missing credentials and hosting. User-perceived server and media timings are unknown.
8. **Quality:** lint exits successfully with React/hook warnings. Tests do not exercise real Supabase, OAuth, cross-user delivery, media uploads, payment verification, or service outages.

## Dependency review

The project already included Motion, yet-another-react-lightbox, Vitest and Supabase; Playwright was added for browser workflows. No shadcn/Radix, TanStack Query, Zustand, Zod, Storybook, FullCalendar, boardgame.io, or Socket.IO packages were added: the current scope does not need their extra runtime or maintenance cost. Form validation is currently small and manual; revisit schema validation if real upload, event or payment APIs are introduced. Detailed versions and rationale are in `RESEARCH_REGISTER.md`.

## Checkpoint and next actions

Use the verified backup directory for recovery. Since the project is not a Git repository, initialize version control in a separate deliberate step before ongoing collaboration, commit only reviewed material, and do not use destructive reset/clean commands.

The ordered work is in [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md). Release gates and exact external blockers are tracked in [`RELEASE_READINESS.md`](RELEASE_READINESS.md).
