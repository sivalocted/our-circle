# Changelog

## 2026-11-06 — Product reconstruction

- Reorganized the app into direct Home, Memories, Play, Calendar, Chat, Trip Fund and Settings routes with lazy route loading and a consistent responsive navigation shell.
- Rebuilt the landing page as an editorial introduction without unsupported social counts, activity totals or testimonials. Refined the arcade/calendar mobile headers and ensured all five primary destinations remain visible on small screens.
- Removed development login/admin shortcuts and made provider identity plus database membership the intended access authority. Prepared Supabase SQL for membership, messages, events, trip records and private Realtime rules; it remains unapplied and unverified against a live project.
- Kept original media data and local photos in the source checkout while excluding private album catalogs and the `public/` directory from every production build. The production archive therefore remains empty until private storage exists.
- Disabled client-recorded payment confirmations, removed invented trip/payment details, and made trip drafts and solo scores explicitly device-local.
- Replaced undocumented trivia fallback questions with an explicit unavailable state and attribution for Open Trivia DB. Corrected local score and Surprise Wheel descriptions; removed an unconfigured `ourcircle.family` URL from score sharing.
- Added direct HTTPS, YouTube and Vimeo source handling for local video drafts. External player frames remain unloaded until the user chooses to connect; reduced motion disables direct autoplay and provider embeds are muted. Added provider URL parsing and pre-consent network checks.
- Removed unsupported “authentic/verified” claims from local catalog comments and stopped generating capture dates, times, dimensions labels and reel titles for user-added video sources when those details were not supplied.
- Fixed Asia/Kolkata date-key/countdown calculations to use timezone-aware parts independent of the visitor device timezone; added rollover and countdown unit coverage.
- Added self-hosted Latin fonts, reduced-motion behavior, split route bundles, SPA/security header/crawler artifacts and private-output build checks.
- Updated audit, architecture, design/IA, research, feature, implementation, security, performance, deployment, test and release documentation.

### Verification

- `npm run build`: passed.
- `npm run test`: latest verified run 7 files / 22 tests passed.
- `npm run test:e2e`: latest verified run 10 tests passed across desktop Chromium and Pixel 7 emulation; includes calendar local CRUD, mobile navigation visibility, and opt-in provider loading.
- `npm run lint`: exits successfully with 22 React/hook/render/fast-refresh warnings.
- `npm audit --omit=dev`: zero vulnerabilities at the time checked.
- Lighthouse 13.6 on the unauthenticated production gate: mobile Performance/Accessibility/Best Practices 100/100/100; SEO reflects deliberate `noindex`. See `PERFORMANCE_REPORT.md` for exact route and limitations.
- No deployment, live database migration, OAuth setup, media import, or payment action was performed.

There is no Git metadata in this checkout. A pre-change backup was available and is documented in `PROJECT_AUDIT.md`; no destructive Git commands were used.
