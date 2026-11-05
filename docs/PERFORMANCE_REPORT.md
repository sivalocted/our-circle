# Performance and accessibility report

**Measured:** 2026-11-06, local Windows checkout. **Status:** laboratory baseline only; this does not certify protected or data-backed routes.

## Lighthouse: production auth gate

| Profile | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Mobile emulation | 100 | 100 | 100 | 63 | 1.1 s | 1.1 s | 10 ms | 0.001 |
| Desktop preset | 100 | 100 | 100 | 63 | 0.3 s | 0.3 s | 0 ms | 0 |

**Conditions:** Lighthouse CLI 13.6.0; HeadlessChrome 157.0.0; local Vite production preview at `http://127.0.0.1:4178/`; static build with no Supabase credentials. Both reports exercised the unauthenticated sign-in gate, not authenticated pages, live media, chat, calendar or database traffic. SEO is 63 because the app explicitly requests `noindex, nofollow` for this private archive; the `robots.txt` syntax audit passes. The SEO score is not a product target. Measurements vary between runs and do not represent real-device field data.

Lighthouse initially reported three low-contrast text nodes on the sign-in gate and invalid/missing `robots.txt`. The three gate text colors were darkened, and builds now emit a valid `robots.txt` plus noindex metadata/headers. The current mobile run reports no color-contrast failures. Keyboard-only interaction, screen-reader output and authenticated-route contrast still need manual review.

TBT is a laboratory responsiveness proxy, not INP. INP requires field data or an interaction test. No field Core Web Vitals, real-device network profile, database timings, video delivery or concurrent-user measurements are available in this checkout.

## Bundle and media artifact

Latest `npm run build` output split routes into chunks. Selected compressed sizes:

| Asset | Gzip |
|---|---:|
| Initial JavaScript entry | 13.01 KB |
| Home page chunk | 2.12 KB |
| Memories page chunk | 17.91 KB |
| Arcade page chunk | 24.77 KB |
| React vendor chunk | 105.30 KB |
| General vendor chunk | 56.55 KB |
| Motion vendor chunk | 48.43 KB |
| Initial CSS | 15.13 KB |

The build contains five self-hosted Latin font files (about 147.5 KB raw). Fonts are included in the build and do not make third-party font requests. These are output sizes, not transfer measurements after cache/compression at a real host.

Production builds replace private album data modules with empty catalogs and disable Vite's `public/` copy. Both production and staging builds were searched for known private album URL patterns and local photo filenames; neither contains matches or a `photos/` directory. Each contains 24 files and includes its SPA redirects, response-header rules, and robots file. The root `index.html` carries the deliberate noindex metadata. Repeat this check after modifying aliases or build settings.

## Visual and responsive inspection

Playwright ran at 1440×1000 desktop and Pixel 7 emulation; all 10 browser tests passed. Home and Memories screenshots were inspected, including mobile full-page states. E2E blocks private Google Photos requests, so failed items render the broken-source fallback in those captures. Real remote media rendering was not validated. The production memories catalog is intentionally empty until authenticated private storage exists.

## Next measurements

1. Re-run Lighthouse against a staging deployment and a representative authenticated route with real service configuration.
2. Capture field LCP, INP and CLS only after sufficient real-user traffic; use device/network performance traces for interaction responsiveness meanwhile.
3. Measure image transfer sizes, media startup and database query latency after private storage and backend paths are implemented.
4. Keep the emitted bundles and privacy scan as release artifacts; investigate regressions by route chunk and font.
