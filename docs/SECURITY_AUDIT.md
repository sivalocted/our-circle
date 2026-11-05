# Security audit

**Reviewed:** 2026-11-06  
**Reference:** [OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/) and [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/). This is an engineering review, not a formal ASVS assessment or penetration test.

## Threat boundary

The product contains identifiable family photos, account identities, messages, dates and potentially financial records. The current checkout has no live backend or deployment. Static/client controls are defense in depth only; authorization must be enforced by the service/database. Do not put private URLs, service-role credentials, or payment secrets in browser bundles.

## Findings and status

| Area | Current control | Status / required proof |
|---|---|---|
| AuthN / sessions | Supabase Google OAuth client flow; authenticated identity obtained from provider; missing service fails closed behind auth UI. | **Not live-verified.** Configure provider redirects, session expiry/revocation and test callback/origin restrictions. |
| AuthZ / roles | Client checks `family_members`; role from database row, not browser-editable `user_metadata`; SQL grants/revokes and RLS are prepared. | **Not live-verified.** Migration not applied; no first admin seed. Verify table access, policies and SQL function privileges from member/nonmember accounts. |
| Secret management | `.env.example` contains empty variable names; production Supabase URL/key use public publishable key only. No secret supplied. | Review host secret inventory before deployment. Never expose service-role, SMTP, or Razorpay secret as `VITE_*`. |
| Family photos/videos | Production build substitutes empty catalogs and disables Vite public-directory copying; original local album files are preserved only in source/dev. External YouTube/Vimeo frames are opt-in and use `no-referrer`; direct media is user supplied. | Build artifact must continue to be scanned on every release. Private Storage/upload/download is **not implemented**; do not enable the archive yet. Provider privacy terms and playback are not live-verified. |
| Chat/database | SQL bounds content length; server trigger sets sender identity; RLS limits reads/inserts to members and `auth.uid()`. Client services verify current identity before send. | **Migration/live behavior not verified.** Add abuse/rate limiting, transaction ordering/reconnect tests and multiple-account RLS tests. |
| Realtime | Realtime channels are requested private and member policies are included. No fake online members are displayed. | **Not verified.** Prove all topic subscription/presence access is denied to nonmembers. Check track payload is sourced only from verified profile. |
| Calendar | Client validates title/date/category; SQL includes length/category/date types and owner/admin mutation rules. | Live RLS not verified. Add max length/API tests, timezone boundary tests, rate controls and audit requirements. |
| Payment | Browser recording and verification methods are disabled; SQL denies member contribution writes. No beneficiary or keys are seeded. | Lowers current fraud risk. A secure provider Edge Function, webhook signature/replay/idempotency, reconciliation, refunds and admin audit are not implemented. |
| Trip settings | SQL member reads/admin writes. Browser UI’s editable draft is local-only, not a secure shared goal path. | Do not treat browser storage as authoritative; implement server path before family sharing. |
| XSS/input | React text rendering escapes content; title/body lengths enforced in UI/SQL. No raw HTML use identified in review. | Review every future markdown/HTML/embed. URL schemes and media MIME/size are not comprehensively validated because upload is absent. |
| CSRF / CORS / transport | Supabase client requests are token-based. Production HTTPS/CORS/callback settings are external. | Verify hosting HTTPS, allowed origins/redirects, cookie/session handling and headers. No custom server endpoints exist. |
| Rate limiting / abuse | Open Trivia API has a local cooldown; database constraints cap text. | No app-wide request limits, login throttling configuration, CAPTCHA/abuse monitor or message rate limits are set here. |
| Dependency supply chain | `npm audit --omit=dev` returned zero vulnerabilities in current check. Package lock is present. | Repeat audit; lockfile maintenance and automated dependency updates are not configured. |
| Logs/incident response | Errors are surfaced in client features; no analytics backend configured. | No centralized alerts, privacy retention policy, incident contact, or data export/delete process. Add before deployment. |

## Media artifact assertions

Production output must satisfy all of the following before a release:

- No `lh3.googleusercontent.com`, `photos.app.goo.gl`, private album identifiers, or original family names in JavaScript or source maps.
- No `dist/photos/` or other copied personal media files.
- No `.env`/server credential in emitted files.
- No local preview bypass in production bundle; `import.meta.env.DEV` must remain false for the public build.

Current checks are recorded in `PERFORMANCE_REPORT.md` and the test run. These must be repeated after each build configuration change.

## Blocking actions before production

1. Use a dedicated staging Supabase project, review migration SQL and run a privilege matrix; apply to production only after a tested backup and owner approval.
2. Provision and test OAuth and family allowlist. Seed only the confirmed first admin through an operator-controlled, audited path.
3. Implement a private media service and storage-policy verification; use only owner-approved assets and test anonymous/nonmember denial.
4. Keep payment disabled until order creation and verification happen on the server and webhook tests are passing.
5. Configure host CSP/security headers, TLS, origin allowlists, rate limits, alerting, backup/recovery and incident runbook.
6. Verify browser app and SQL with the complete OWASP ASVS level appropriate for a private family app; record any exceptions.
