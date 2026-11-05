# Design system

## Design intent

An intimate family archive presented as an editorial publication: quiet paper tones and serif headlines for planning surfaces, a deep dark stage for family media, and warm bronze accents used as a guide rather than decoration. Avoid generic dashboards, fabricated social proof, noisy neon and layers of glass effects.

## Foundations

| Token/use | Current value or rule |
|---|---|
| Paper canvas | `#f5f2eb` |
| Primary ink | `#24231f` |
| Supporting ink | `#69675f` / `#89867f` |
| Bronze accent | `#8a704a`, `#C89D66`, `#DFBE8A` |
| Media stage | `#100f0d` and adjacent charcoal/espresso shades |
| Display faces | Locally bundled Fraunces and Instrument Serif (Latin subset) |
| Body face | Locally bundled Plus Jakarta Sans |
| Technical labels | Locally bundled JetBrains Mono, used sparingly for metadata |
| Icons | Lucide; icon-only navigation links carry explicit accessible labels |

Display typography uses tight line height and negative tracking at large sizes. Body text uses generous line height and restrained max widths. Cards use rounded corners and thin neutral borders; only media uses a stronger dark frame. Spacing and widths are responsive with Tailwind breakpoints; controls have approximately 40–48 px minimum hit areas where practical.

## Composition patterns

- **Landing:** asymmetric copy/media composition, two high-value calls to action, and a three-destination index. No metrics or testimonial block.
- **Memories:** separate visual treatments (cinematic, editorial, spatial, filmstrip, motion), variable seeded ordering, touch-friendly lightbox, and explicit empty archive. Avoid empty editorial headings where the spread has no items.
- **Calendar:** focused calendar surface with separate event form and no unrelated dashboard cards.
- **Chat / trip:** direct task page with connection/payment status stated before input or totals.
- **Arcade:** game list, instructions, individually opened games, local score states labeled as local.
- **Settings:** identity/preferences and secondary trip-fund access.

## Interaction and state patterns

- Primary filled buttons advance the task; outline buttons are secondary. Use named actions, not decorative click targets.
- Every remote operation needs pending, success, error/retry and empty behavior; only configured services may claim shared persistence.
- Inputs retain helpful prompts, but fixture-like names or numbers do not appear as saved data.
- The archive’s video defaults to muted. Failed sources show a recoverable message and never remove catalog records. Native/explicit playback remains available when reduced motion is enabled.
- Reduced-motion preference is user-controlled and passed to Motion, canvas particles, autoplay, CSS animation and slideshow zoom. System reduced motion is also delegated to Motion when the app preference is off.
- Font files are bundled from Fontsource packages under the SIL Open Font License; the page no longer requests fonts from Google at runtime.

## Accessibility status

Semantic headings and landmark structure are used on routes, and mobile icon-only navigation has explicit names. Motion has a reduced-motion path. Keyboard paths exist for the media viewer and dialogs. Full contrast ratios, screen-reader output, focus restoration/trapping for each modal, touch target measurements, and complete keyboard-only journeys have not been formally audited. Treat accessibility as reviewed, not certified; see `TEST_PLAN.md` and `RELEASE_READINESS.md`.

## Responsive behavior

- Navigation shows text at wider widths and labeled icons at narrow widths.
- Landing hero becomes a vertical stack; its photo mosaic keeps the primary tile dominant without horizontal overflow.
- Media and dialogs use viewport-height constraints, safe scrolling and touch controls.
- Automated browser checks use 1440×1000 Desktop Chrome and Pixel 7 emulation. These do not cover the full device/browser matrix.

## Implementation constraints

Tailwind CSS 4 utilities remain the main styling mechanism; shared global styles are in `src/index.css`. The project intentionally does not add shadcn/Radix/Magic UI: there is no established component system needing them, and introducing a parallel style layer would create duplication. Revisit when actual shared components warrant a library. Color contrast must be measured before accessibility sign-off.
