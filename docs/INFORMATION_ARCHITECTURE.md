# Information architecture

## Primary navigation

```text
Our Circle
├── Home          entry point and feature index
├── Memories      family photo/video archive
├── Play          local browser games
├── Calendar      family dates and plans
├── Chat          shared conversation (authenticated)
└── Profile       signed-in identity and preferences
    └── Trip Fund trip goal and verified-contribution status
```

The persistent navigation follows the five most frequent destinations. Profile/settings is an account utility; trip fund is a contextual plan reached from settings and can also be reached by direct route. Calendar remains a distinct destination. The home page highlights memories, games, and calendar as first-use actions and avoids a dashboard of unverified counts.

## Route inventory

| Route | Audience | Primary action | Access / state |
|---|---|---|---|
| `/` | All | Open a destination | Auth gate in production; visibly labeled local preview in development. |
| `/memories` | Family members | Browse, filter visually, favorite, open/slideshow | Production archive intentionally empty until private media is connected. |
| `/play` | Family members / local preview | Choose a solo game | Scores are device-local; no join-room or multiplayer claim. |
| `/calendar` | Family members / local preview | Review or manage dated events | Local preview stores events in this browser; signed-in path uses family events table. |
| `/chat` | Family members | Read and send messages | Authenticated membership required; local preview explains service state. |
| `/trip-fund` | Family members | Review trip plan / payment readiness | No fake goal or totals; payment disabled until verified backend exists. |
| `/settings` | Signed-in member or local preview | Review identity and preferences | Account membership/admin operations stay service-controlled. |

Unknown paths navigate back to Home. Direct production routes are protected by the same auth gate.

## Feature placement

- Photo/video search, layouts, favorites, viewer and slideshow belong under Memories because they describe the family archive.
- Word puzzles and light social games belong under Play. Shared scores/rooms remain absent until backed by a real synchronized service.
- Family dates belong only to Calendar; birthday greetings are contextual, not a substitute for event records.
- Conversation belongs only in Chat. Presence is shown only from the authenticated Realtime presence channel; no static online indicator is used.
- Sound, motion and local feedback controls belong in Profile & settings.
- Trip details and payment state sit under Trip Fund, linked from profile/settings. A payment collection action must not appear until beneficiary, server verification and reconciliation are real.

## Empty and unavailable states

Every destination gives users a reason for a missing state and a next step: connect project/storage, sign in as a member, create the first calendar record, or wait for payment integration. Empty does not imply a zero aggregate unless the persisted data was actually queried. Local-only status is visible in preview and test copy.

## Navigation/accessibility notes

Desktop navigation includes text and mobile navigation uses labeled icons. `aria-label` names each narrow-screen link. Routes should retain predictable browser history and keyboard focus; focus restoration and skip-link coverage remain release checks.
