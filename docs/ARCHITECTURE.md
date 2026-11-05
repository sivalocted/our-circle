# Architecture

## Runtime shape

Our Circle is currently a client-side React/Vite application. The browser is the only runtime present in this checkout; Supabase is an intended external service, not a local or verified backend. Production builds use Supabase’s publishable key only. No service-role key or payment secret belongs in browser configuration.

```text
Browser
├── React Router: Home, Memories, Play, Calendar, Chat, Trip Fund, Settings
├── App shell: access gate, auth state, navigation, notifications, preferences
├── Pages: route-level feature composition (lazy-loaded)
├── Components: page UI, media layouts, forms, dialogs, small games
├── Services: auth, Supabase realtime, calendar, trip state, notifications
└── Development catalogs: local family album data (never copied into production)

Supabase (not configured here)
├── Auth: Google OAuth identity
├── Postgres: family membership, chat messages, calendar events, trip goal
├── Realtime: private member channels / presence / chat updates
├── Storage: planned private family media bucket (not yet implemented)
└── Edge Functions: planned payment and privileged operations (not yet implemented)
```

## Browser boundaries

- `src/main.tsx` provides `BrowserRouter` and the React root.
- `src/App.tsx` owns auth/membership states and the route shell. Direct unauthenticated production visits see an auth gate. A local preview action is only compiled into development builds.
- `HomePage`, `MemoriesPage`, `ChatPage`, arcade, calendar and trip views load on demand. This keeps secondary routes out of the initial route chunk.
- `ReducedMotionContext` and `MotionConfig` synchronize app preference with Motion, canvas, autoplay and slideshow behavior.
- Browser local storage is only used for per-device settings/favorites, local calendar preview, local solo scores, and local video URL drafts. It is never presented as shared server data.
- Service functions centralize Supabase operations. Errors remain visible to callers so a feature can show its unavailable/retry state instead of silently claiming success.

## Supabase schema prepared in SQL

Migration: `supabase/migrations/202611060001_family_access_and_data.sql`.

| Table/function | Purpose and guard |
|---|---|
| `family_members` | Admin-maintained email/role allowlist; members can read their own row, admins can read the table. Client-side insert/update/delete are revoked. There is intentionally no seeded email or browser invitation flow. |
| `is_family_member()` / `is_family_admin()` | `SECURITY DEFINER` membership checks for RLS, with fixed search path. Execution is restricted to authenticated users. |
| `chat_messages` | Member-only reads, authenticated self-sender inserts, bounded message content; a trigger replaces client-supplied name/avatar with Auth profile values. |
| `family_events` | Member reads; create as the signed-in user; owner/admin update/delete; title/date/category/length constraints. |
| `trip_goals` | Member reads, admin writes. |
| `trip_contributions` | Member reads, no client insert/update/delete. An Edge Function/webhook must verify provider payment and insert the trusted state. |
| `trip_payment_settings` | Admin-only server-enforced access. No beneficiary or UPI details are seeded. |
| `realtime.messages` policies | Authenticated family members are limited to `circle:%` topics; channel code uses private auth. Policy behavior remains unverified against a live Supabase project. |

The migration is repeatable for the included object definitions but has not been tested against an existing project/schema. Before rollout: inspect the destination database, test on a fresh non-production project, create the first admin membership through a trusted operator-controlled SQL path, verify each policy with two accounts, and plan backup/rollback.

## Auth and permissions

Google OAuth is the only configured UI path. The server-side membership table is authoritative; email or role fields edited in the browser cannot grant membership/admin. App access waits for a membership check and distinguishes signed-out, checking, denied, and unavailable. Server RLS remains necessary even if the client hides a control.

Admin bootstrap is intentionally manual because there is no trusted admin account or provider project in this workspace. Never add a service-role key to `VITE_*` variables. The first admin must be created by an authorized project operator after the family’s real account identifiers are confirmed.

## Media and privacy boundary

`vite.config.ts` resolves `circleData` and `albumVideos` to empty modules for every build (not the development server) and disables Vite's public-directory copying for build commands. The local catalogs and `public/photos/` remain on disk for development; their provenance/metadata are not independently verified, and they are not copied into `dist/`. Build output also receives SPA fallback, baseline response-header files and noindex metadata. A later authenticated storage feature should query object metadata after membership is verified and issue a user-bound download or short-lived signed URL. Public buckets do not satisfy this private-archive requirement.

The code does not yet upload or index storage objects, generate signed URLs, enforce file-size/MIME/image-decode checks, or revoke leaked URLs. Avoid enabling the archive in production until these pieces and data migration are implemented. The local video source manager accepts direct HTTPS streams and opt-in YouTube/Vimeo embeds; external frames do not load until the user requests the player, and local URL drafts are not shared with the family.

## State ownership

| State | Owner |
|---|---|
| Auth session and membership | Supabase Auth + `family_members`; browser cache mirrors provider state only. |
| Chat history | `chat_messages` when authenticated; never local fake chat. |
| Calendar | Supabase `family_events` for authenticated use; browser storage for local preview only. |
| Favorites/settings/solo game scores | Browser-local and device-specific. |
| Payment ledger | Server-verified provider transactions only; no client-created claim is counted. |
| Media | Development source only until private Storage service exists. |

## Error handling and observability

Feature services expose load/send/save failure rather than converting it into successful empty data. User-facing UI provides retry or unavailable text where implemented. Central logging/monitoring, server audit trail, request correlation, rate limits, and alerts are not configured because no backend/deployment exists. Add them alongside real project provisioning, without sending family message or media payloads to general logs.

## Deployment assumptions

The current output is static Vite `dist/`; a SPA host must serve `index.html` for client routes. Cloudflare Pages is the leading hosting candidate, while Supabase remains the existing data/auth choice. No provider is configured. See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).
