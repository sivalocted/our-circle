# Implementation roadmap

Priorities combine user value, dependency order, data safety and external access requirements. P0 is required before a family deployment. No live service changes or deployment were made.

## Completed in this reconstruction

- **P0 — Inventory and recovery:** inspected source/config/data/routes, documented no-Git state, confirmed a pre-change backup. No destructive operations.
- **P0 — Product IA and surface:** established direct Home, Memories, Play, Calendar, Chat, Trip Fund and Settings routes; rebuilt responsive editorial landing and navigation; lazy-loaded feature routes.
- **P0 — Remove fabricated claims:** removed demo identities/messages/events/counts/transactions/leaderboard claims; local-only and unavailable states are explicit.
- **P0 — Protect original media:** preserve development sources, compile empty catalogs in production, and keep `public/photos/` out of production output. Fixed image failures so transient outages do not permanently remove data.
- **P0 — Auth/service trust:** Google OAuth and database membership path; no local password/admin bypass; SQL RLS migration prepared; payment writes from browser are rejected.
- **P1 — Calendar and chat structure:** local CRUD and timezone handling; DB CRUD/query/realtime code; production path still unverified.
- **P1 — Media usability:** mode selector, viewer, slideshow, random composition, muted video, offscreen pause, source failure UI and reduced-motion playback affordance.
- **P1 — Testing:** Vitest discovery scoped to project unit tests; Playwright desktop/mobile workflows; source and privacy notes documented.
- **P1 — Build hygiene:** production route splitting, environment template, ignored research/test artifacts, successful Vite production build, dependency audit.

## P0 — Required before any family-facing deployment

| Order | Work | Dependency / owner input | Acceptance |
|---:|---|---|---|
| 1 | Create a dedicated Supabase project and provide its public URL/key through local/host secret settings. Choose region and confirm retention budget. | Account and cost decision by project owner. | No credentials in source; auth health check and `npm run build` pass. |
| 2 | Configure Google OAuth consent screen, callback/redirect URLs and allowed app origins. | Google Cloud project and production domain. | A real allowlisted test account can sign in/out and a non-member is rejected. |
| 3 | Review migration on a fresh staging project; apply membership/data schema; manually seed only the confirmed first admin email. | Project provisioning and correct identity. | Two-account RLS matrix passes; unauthorized writes/reads fail at database layer. |
| 4 | Complete authenticated private media service. Import local album assets only after owner chooses which to migrate; validate MIME, size, decode, ownership, metadata, signed URL expiry and deletion. | Supabase Storage or other chosen private media account; owner-approved migration set. | Members can access allowed assets; anonymous/nonmember cannot; no media URL in public bundle. |
| 5 | Decide what “production-ready” backup means; provision paid tier or tested independent database/media backups and a restore drill. | Retention, budget, data-loss objective. | Restore to isolated project and compare integrity. Free-tier Supabase has no automatic DB backups. |
| 6 | Add server-verified payment only if the family wants contributions: Edge Function, provider signature verification, idempotency key, webhook replay protection, ledger/reconciliation, refund and admin audit path. | Beneficiary and payment account supplied by owner; provider approval. | Test sandbox payment and failed/replayed webhooks; never accept client totals. |
| 7 | Configure SMTP only if email links/invitations are desired; set auth redirect URLs, rate limits, admin alerts and recovery path. | Verified sender/domain, service account. | Delivery, abuse/rate limits, password/session recovery tested. |

## P1 — Staging and quality gates

- Select hosting and domain; deploy only to an owner-controlled staging environment after explicit authorization.
- Add CI that runs unit, lint, build, E2E and production artifact privacy assertions. Save browser traces only when needed and scrub them before external sharing.
- Exercise chat and realtime using two authenticated accounts, including duplicate sends, reversed arrival, reconnect, unauthorized topic, denied RLS, stale session and empty history.
- Test all calendar permissions, dates around timezone/daylight changes, invalid input, offline writes, retry and persisted updates.
- Add private upload progress, failure recovery, video format compatibility, memory/unmount cleanup and mobile data-budget checks.
- Run accessibility review with keyboard, screen reader, contrast calculator and a browser accessibility audit. Add focus trap/return where needed.
- Measure actual production-like routes after backend/staging exists. Add server database timings and media transfer data; set LCP/INP/CLS budgets and regression thresholds.
- Establish error reporting, privacy-safe logs, uptime monitoring, security contact, backup owner, retention and incident recovery procedure.

## P2 — Only after actual need is confirmed

- Add cross-device favorites/profile settings if family members request sync.
- Evaluate query cache/form schema libraries when data complexity warrants them.
- Add multiplayer games only with server-authoritative rooms, membership checks, turn validation, anti-cheat bounds and reconnect semantics.
- Add extra game types (drawing, board games, reaction/pairing) after content quality, licenses, mobile interaction and family use are validated.
- Evaluate R2 if media egress or storage economics justify a second access layer.

## Rollback and recovery

There is no Git history in this project. Current recovery artifact is the verified folder backup `C:\Users\siriv\.gemini\antigravity\scratch\our-circle-backups\before-reconstruction-20261106`. Keep it unchanged until the owner confirms long-term retention. For future service releases, create a Git checkpoint and database/media backup before applying migrations. Rollback must restore prior frontend artifact and database schema/data from a tested backup; do not improvise destructive SQL against production.
