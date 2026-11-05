# Research register

**Reviewed:** 2026-11-06. Provider limits and pricing change; verify again before selecting a plan or deploying.

## Architecture and implementation references

| Reference | What was inspected | Application to this project |
|---|---|---|
| [Bulletproof React](https://github.com/alan2207/bulletproof-react) | Repository README, docs, React/Vite app structure, feature boundaries, API, auth, error handling, tests, and license. A shallow reference clone is retained under ignored `.research/`; no scripts were executed. | Adapt route/feature boundaries and keep server operations behind services. The existing app is smaller and static; adopting its entire structure would add ceremony. |
| [React Router](https://reactrouter.com/) | Route, navigation, and SPA patterns. | Separate user tasks into direct routes and lazy-load heavier pages. |
| [Motion](https://motion.dev/) | React API and accessibility/reduced-motion behavior. | Continue using installed `motion/react`; central `MotionConfig` and the user preference context now cover UI motion. |
| [Yet Another React Lightbox](https://github.com/igordanchenko/yet-another-react-lightbox) | Viewer capabilities, keyboard/touch behavior, video plugin integration, package/license. | Keep the existing package for fullscreen media rather than rebuilding zoom/navigation. |
| [Playwright](https://playwright.dev/) and [Vitest](https://vitest.dev/) | Official test configuration and browser/unit test practices. | Use Chromium at desktop and Pixel 7 emulated viewports; isolate unit discovery to `src/tests`. |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | Version 5.0.0 scope and control families, alongside [OWASP cheat sheets](https://cheatsheetseries.owasp.org/). | Record implementation status and unverified controls in `SECURITY_AUDIT.md`; this is not an ASVS certification. |
| [Open Trivia DB](https://opentdb.com/api_config.php) | Public API configuration, response format, and attribution/license terms. | Trivia uses this source, credits it in the game UI, caches only successful same-day results locally, and shows an unavailable state on source failure; no fabricated offline question set is shipped. The API and content attribution/license must be rechecked if source usage changes. |
| [YouTube embed parameters](https://developers.google.com/youtube/player_parameters) and [YouTube developer privacy policy](https://developers.google.com/youtube/terms/developer-policies) | Official iframe URL parameters and data-sharing notes for embedded players. | Build YouTube embeds with the privacy-enhanced host, controls, inline playback and muted settings. External player loading requires an explicit user action because embeds send basic data when loaded and autoplay increases pre-interaction data sharing. |
| [Vimeo player embed options](https://developer.vimeo.com/player/sdk/embed) | Official iframe embed parameters, DNT, muted/inline playback, and unlisted-link hash behavior. | Support Vimeo share links, preserve an unlisted hash, set DNT/muted/inline options, and load only after an explicit user action. Provider playback still needs browser/device verification. |
| [Free-for.dev](https://freefor.dev/) | Current categories for hosting, backend, storage, realtime, email, monitoring and testing. | Discovery index only. Provider claims below are based on their own official plan pages, not the directory. |

The prompt’s other references (shadcn/ui, Magic UI, Radix, React Aria, TanStack Query, Zustand, Zod, React Hook Form, FullCalendar, boardgame.io, Socket.IO, Storybook and Lighthouse CI) were evaluated for fit. None was added without a concrete need: the current project has no complex forms, server cache, multiplayer engine, or reusable component library that justifies the extra dependency. The calendar is small enough to remain first-party; games are intentionally local solo activities.

## Package inventory and selection

Versions are from the checked-in `package-lock.json` / `package.json` at audit time; package ranges are not a promise of future versions.

| Package | Version range | License family | Decision |
|---|---:|---|---|
| React / React DOM | 19.3.1 | MIT | Existing UI runtime. |
| React Router | 7.18.5 | MIT | Existing client routing. |
| Vite / React plugin | 8.3.5 / 6.1.2 | MIT | Existing build and dev server. |
| TypeScript | 7.0.2 | Apache-2.0 | Typed application and build checks. |
| Tailwind CSS / Vite integration | 4.3.3 | MIT | Existing styling system. |
| Motion | 14.9.0 | MIT | Existing animation system; supports the chosen React version. |
| `yet-another-react-lightbox` | 3.33.0 | MIT | Existing accessible gallery/lightbox. |
| `@fontsource-variable/fraunces`, `@fontsource/instrument-serif`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/jetbrains-mono` | 5.3.0 | SIL Open Font License 1.1 | Newly added, self-hosted only the Latin subsets used by the interface to remove third-party font requests. |
| `@supabase/supabase-js` | 2.118.0 | MIT | Existing intended hosted auth/data/realtime client. |
| `lucide-react` | 1.66.0 | ISC | Existing icon set. |
| `canvas-confetti` | 1.9.4 | ISC | Existing optional shuffle celebration; suppressed when reduced motion is enabled. |
| Vitest | 5.1.0 | MIT | Existing project unit runner; test discovery now excludes reference repos and E2E files. |
| `@playwright/test` | 1.64.1 | Apache-2.0 | Browser workflows and viewport checks. |
| Oxlint | 1.89.0 | MIT | Existing lint runner; it exits successfully with warnings documented below. |

No package was installed from a cloned repo, no cloned code was copied wholesale, and no dependency audit scripts were run from `.research`. `npm audit --omit=dev` reported zero production dependency vulnerabilities in this run. Full `npm audit` had also reported zero at the preceding check; repeat after dependency updates.

## Infrastructure comparison

| Need | Considered service | Verified current constraints | Project decision |
|---|---|---|---|
| Static frontend | Cloudflare Pages | Free static asset requests are unlimited; free plan supports 20,000 files/site and 25 MiB per asset. Pages Functions count against Workers Free’s 100,000 requests/day. See [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/). | Good candidate for this static Vite build. No account or domain exists here, so not configured. |
| Backend, Postgres, auth, realtime, private media | Supabase (current code already depends on it) | Free currently lists 50k MAU, 500 MB database, 5 GB egress, 1 GB storage, 2M realtime messages/month, 200 peak realtime connections and 500k Edge Function invocations. Free project pauses after a week of inactivity; automatic backups are not included. Pro starts at $25/month and currently includes 8 GB DB, 250 GB egress, 100 GB storage and 7-day daily backups. See [pricing](https://supabase.com/pricing), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [backups](https://supabase.com/docs/guides/platform/backups). | Keep the existing integration and RLS model. Free is suitable for a private trial, but a sleeping project/no included backups is a poor fit for a family archive unless an independent backup process is operating. Cost and account choice require owner review. |
| Object/media storage | Supabase private Storage or Cloudflare R2 | Supabase private buckets apply Storage RLS to downloads and support expiring signed URLs; signed URLs remain shareable until expiry. See [bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [access control](https://supabase.com/docs/guides/storage/security/access-control). R2’s current Standard free tier includes 10 GB-month, 1M Class A and 10M Class B operations/month, and free egress; overage is billed and account/bucket setup is required. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/). | Prefer Supabase private Storage first to reuse authenticated access and RLS. Evaluate R2 only if media egress becomes material and a server worker can mint short-lived upload/download access. No media bucket currently exists. |
| Transactional email | Supabase default sender / custom SMTP | Supabase’s default sender currently allows 2 messages/hour, sends only to project team addresses, has no delivery SLA, and is explicitly for non-production. [Custom SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp). | Current sign-in path is Google OAuth. If invites or email links are added, configure a verified custom sender and test abuse/rate limits first. |
| Alternate static host | Vercel Hobby | Hobby is restricted to personal, non-commercial use under its [plan terms](https://vercel.com/docs/plans/hobby). | Not recommended without confirming the project qualifies; Cloudflare Pages is a clearer static-host candidate. |

Credit-card requirements, regional taxes, support coverage, current R2 account billing prerequisites, and the user’s commercial-use classification were not verified for a specific account; no claim is made about them. No service was signed up for or changed.

## Design decisions

- Favor a restrained warm editorial system over dashboard cards: serif display type, neutral paper background, restrained bronze accents, distinct dark media stage.
- Give high-frequency tasks direct routes and retain calendar as its own destination.
- Use real empty/unavailable states instead of invented family activity.
- Treat development photo/video sources as private input and strip both URL catalogs and local image files from production output until private authenticated storage is ready.
- Keep solo games simple. Do not introduce Socket.IO or boardgame.io until synchronized rooms are a real requirement and a secure server has been provisioned.
- Don’t install TanStack Query while only a few direct Supabase operations exist. Reconsider if retries, cache invalidation, optimistic updates or query fan-out grow.
- Avoid Storybook for now; isolated component stories are valuable later, but the current app has no Storybook configuration or design-system library. Current browser E2E covers route composition instead.
