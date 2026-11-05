# Feature matrix

Statuses distinguish implemented code from verified service behavior. **Verified local** means a local browser/unit workflow passed; it does not imply production data persistence.

| Feature | UI/code | Verified locally | Real service verified | Honest current representation |
|---|---|---|---|---|
| Home / responsive navigation | Implemented | Playwright desktop + Pixel 7 | Not applicable | Product overview; no social proof or totals. |
| Google OAuth | Client flow implemented | Not configured | **No** | Auth gate explains missing Supabase/OAuth configuration. |
| Member allowlist / roles | Client lookup + SQL/RLS prepared | Unit role-injection guard | **No** (migration not applied) | Server table is intended authority; no browser admin shortcut. |
| Memories layouts / lightbox | Implemented; multiple editorial modes | Responsive route; source-failure state | **No** private storage | Local preview uses original local/development media; production catalog empty. |
| Direct and external video URL drafts | Implemented in browser storage; HTTPS direct streams plus YouTube/Vimeo embeds | URL parsing covered by unit tests; E2E verifies external player is not loaded before an explicit click | **No** shared catalog or provider playback verification | Local browser catalog only. External player loads are opt-in and muted; users are told the provider is contacted. |
| Calendar CRUD | Implemented | Create/edit/delete and invalid-input unit/E2E | **No** live database | Local events are identified as device-local; real calendar table path awaits migration. |
| Shared chat | Supabase history/send/realtime code | Empty/unavailable local state only | **No** | No fake chat or online members. Live delivery, ordering, retry and privacy are unverified. |
| Arcade | Six solo games plus Surprise Wheel | Navigation and no-score empty state; trivia source failure is covered by unit test | Not applicable for solo mode | Local browser games; scores are not shared. Trivia uses Open Trivia DB with attribution and same-day local cache; source failure does not substitute an undisclosed question bank. Multiplayer omitted. |
| Game wishlist | Not implemented | No | No | Draw & Guess, tic tac toe, Connect Four, reaction race, memory match and social party games remain roadmap candidates. |
| Trip goal | Local browser draft store/UI | Honest empty/local state | **No** | No invented destination or target; draft is device-local and not shared. |
| Payments/contributions | No trusted verification flow | Guard tests confirm client cannot record/verify | **No** | Contribution collection and totals are disabled. |
| Preferences | Local browser persistence, sound and reduced motion | Covered by app build and route visibility | Not applicable | Device-specific controls; no profile sync. |
| Media upload and private delivery | Not implemented | No | No | Original files retained locally and excluded from production build. |
| Notifications/presence | Client integration code exists | Not verified against provider | **No** | UI avoids fabricated online state; browser permission is contextual. |

## Product boundary

The codebase is ready for a private service to be configured and tested; it is not a complete production application. The highest-priority work is provisioning/auth/membership and private media, not adding more decorative surfaces or games. See [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) and [`RELEASE_READINESS.md`](RELEASE_READINESS.md).
