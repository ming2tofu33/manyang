# Manyang Security Best Practices Report

Reviewed on 2026-06-01.

## Executive Summary

OpenAI API key leakage to the browser was not found in tracked source. `frontend/.env` is ignored by git, and OpenAI calls are made from server route handlers through server-only environment variables.

The main risk is API key abuse by proxy: public Next.js route handlers can trigger paid OpenAI work without hard server-side rate limits, signed guest identity, pre-consumed quota, or idempotent reuse. The tarot route is the most exposed because guest one-card readings call the LLM without any server-side guest quota. The dream route has a guest daily gate, but the gate is based on an unsigned, user-rotatable UUID cookie and records usage after the LLM call, so it can be bypassed or raced.

## Critical Findings

### S-01: Public tarot LLM endpoint can be used as an unlimited OpenAI cost proxy

- Rule ID: NEXT-DOS-001 / NEXT-AUTH-001 / NEXT-SECRETS-001
- Severity: Critical
- Location: `frontend/src/app/api/tarot/readings/route.ts:329`, `frontend/src/app/api/tarot/readings/route.ts:333`, `frontend/src/app/api/tarot/readings/route.ts:347`, `frontend/src/app/api/tarot/readings/route.ts:362`
- Evidence:
  - `const userId = await resolvedDependencies.getAuthenticatedUserId();` accepts `null` as guest at line 329.
  - Only `daily_three_card` is blocked for non-paid users at lines 333-343; `daily_one_card` remains callable by guests.
  - The OpenAI provider is created at lines 347-358 and `generateTarotReadingForUser(...)` is called at lines 361-365.
  - Persistence is best-effort and only for authenticated users at lines 282-298 and 373-377.
- Impact: Anyone who can reach `/api/tarot/readings` can repeatedly submit one-card requests and burn OpenAI quota. This does not reveal the key, but it effectively exposes the key's spending power through the app.
- Fix:
  - Require a server-side quota check before `createProvider()` and before `generateTarotReadingForUser(...)`.
  - Add IP/user/guest rate limits with a durable store.
  - For authenticated users, read an existing `(user_id, app_date, spread)` tarot reading before generating a new one.
  - For guests, either disable LLM tarot generation or issue a signed guest token and persist quota before generation.
  - Add provider-side OpenAI project budgets and per-key limits as a backstop.
- Mitigation: Put Vercel/edge rate limiting in front immediately while app-level quota is implemented.
- False positive notes: If a private gateway already rate-limits this route, it is not visible in this repo and should be verified in deployment config.

## High Findings

### S-02: Dream guest daily limit is bypassable and consumed only after LLM work

- Rule ID: NEXT-DOS-001
- Severity: High
- Location: `frontend/src/app/api/dreams/analyze/route.ts:52`, `frontend/src/app/api/dreams/analyze/route.ts:124`, `frontend/src/app/api/dreams/analyze/route.ts:140`, `frontend/src/app/api/dreams/analyze/route.ts:568`, `frontend/src/app/api/dreams/analyze/route.ts:622`, `frontend/src/app/api/dreams/analyze/route.ts:638`, `supabase/migrations/20260530000300_create_manyang_guest_reading_usage.sql:1`
- Evidence:
  - Guest identity is a UUID cookie named `manyang_guest_id` at lines 52 and 124-137.
  - The cookie is `HttpOnly` and `SameSite=Lax`, but it is not signed or bound to server state at lines 140-150.
  - Guest quota checks are per `guestId` and date at lines 568-580.
  - LLM generation starts at lines 622-628.
  - Usage is persisted only after successful generation at line 639.
  - The DB unique constraint is only `(guest_id, usage_date, reading_kind)` at `supabase/migrations/20260530000300_create_manyang_guest_reading_usage.sql:1-7`.
- Impact: A user can clear or forge the guest cookie, rotate UUIDs, or send parallel first-time requests and trigger repeated OpenAI calls. The daily limit is not a reliable abuse boundary.
- Fix:
  - Sign guest cookies with an HMAC or store opaque guest IDs server-side.
  - Consume quota in a transaction before LLM work, using a unique key that covers guest/user plus app date plus reading type.
  - Add rate limits keyed by user ID when authenticated and by hashed IP/UA plus guest ID when unauthenticated.
  - Add idempotency/replay handling so concurrent identical requests reuse the same in-progress or completed result.
- Mitigation: Temporarily require login for real LLM mode until server-side quota exists.
- False positive notes: `HttpOnly` protects the cookie from normal browser JavaScript, but it does not stop cookie clearing, manual HTTP clients, or repeated no-cookie requests.

### S-03: Authenticated dream generation has no hard server-side daily or rate limit

- Rule ID: NEXT-DOS-001 / NEXT-AUTH-001
- Severity: High
- Location: `frontend/src/app/api/dreams/analyze/route.ts:546`, `frontend/src/app/api/dreams/analyze/route.ts:568`, `frontend/src/app/api/dreams/analyze/route.ts:575`, `frontend/src/lib/server/manyang-db.ts:44`, `frontend/src/lib/access-policy.ts:18`, `frontend/src/lib/access-policy.ts:130`
- Evidence:
  - The route resolves `userId` and `accessPlan` at lines 546-548.
  - `hasUsedBasicReadingToday` is only checked for `guestSession`; authenticated users get `false` at lines 568-574.
  - `canRequestReading(...)` receives that value at lines 575-580.
  - `hasCompletedBasicReadingForUserOnDate(...)` exists at `frontend/src/lib/server/manyang-db.ts:44-64` but is not used by the analyze route.
  - `free_daily_limit` exists in the type at `frontend/src/lib/access-policy.ts:18`, but `canRequestReading(...)` only enforces the guest limit at lines 130-137.
- Impact: Logged-in accounts can create many distinct dream texts and repeatedly trigger OpenAI calls. If account creation is easy, this becomes a scalable abuse path.
- Fix:
  - Decide the product quota for `free_account` and enforce it in `handleDreamAnalyzeRequest(...)`.
  - Use a durable quota table with atomic insert/update before LLM generation.
  - Add per-user and per-IP burst limits, plus a slower daily/monthly quota.
- Mitigation: Apply edge rate limiting to `/api/dreams/analyze` immediately.
- False positive notes: If unlimited logged-in readings are intentional, this still needs rate limiting and cost budget enforcement.

### S-04: Server DB pool likely bypasses Supabase RLS for user data

- Rule ID: NEXT-AUTH-001 / NEXT-INJECT-001 defense-in-depth
- Severity: High if production uses `postgres`/service credentials; Medium if a least-privilege RLS-enforced DB role is used
- Location: `frontend/src/lib/server/manyang-db.ts:27`, `frontend/.env.example:19`, `supabase/migrations/20260530000100_create_manyang_core.sql:115`
- Evidence:
  - The app creates a `pg.Pool` from `SUPABASE_DB_URL` at lines 27-30.
  - The env example documents a `postgres...` Supabase pooler/direct connection at `frontend/.env.example:19-29`.
  - RLS policies exist at `supabase/migrations/20260530000100_create_manyang_core.sql:115-170`, but direct admin/service DB credentials can bypass them.
- Impact: Current SQL queries are parameterized and usually filter by `userId`, which is good. But if a future query misses a `where user_id = $1`, RLS may not catch cross-user dream data exposure.
- Fix:
  - Use the Supabase SSR client with the user session for user-owned reads/writes where practical.
  - If using direct Postgres, create a dedicated least-privilege DB role and verify it does not bypass RLS.
  - Reserve admin/service DB credentials for admin-only tasks and isolated guest quota operations.
- Mitigation: Add tests that fail if user-data queries omit user predicates; keep `SUPABASE_DB_URL` out of client and CI logs.
- False positive notes: Verify the actual production DB role. The repo example strongly suggests admin credentials, but production may differ.

## Medium Findings

### S-05: Cookie-authenticated state-changing route handlers have no explicit CSRF/Origin check

- Rule ID: NEXT-CSRF-001
- Severity: Medium
- Location: `frontend/src/app/api/dreams/route.ts:222`, `frontend/src/app/api/pawprints/route.ts:83`, `frontend/src/app/api/night-checkins/route.ts:119`, `frontend/src/app/api/dreams/[dreamId]/route.ts:43`, `frontend/src/app/api/dreams/analyze/route.ts:515`, `frontend/src/app/api/tarot/readings/route.ts:301`
- Evidence:
  - These handlers mutate state or trigger expensive work using cookies/session-derived identity.
  - They parse JSON and execute the action, but there is no shared Origin/Referer validation or CSRF token/custom header requirement visible in the route code.
- Impact: SameSite cookies and lack of CORS reduce exposure, but they are not a complete app-level CSRF strategy. Same-site subdomains, unusual browser behaviors, or future CORS changes could turn this into unwanted state changes or cost-triggering requests.
- Fix:
  - Add a shared guard for unsafe methods: enforce `Origin` against a configured app origin allowlist and require `content-type: application/json`.
  - Consider a CSRF token or custom `X-Manyang-CSRF` header for cookie-authenticated mutations.
  - Add route tests for cross-origin rejection.
- Mitigation: Keep CORS disabled unless explicitly needed; do not add wildcard CORS to these endpoints.
- False positive notes: For pure bearer-token APIs CSRF would not apply, but this app uses Supabase cookies in server route handlers.

### S-06: Security headers/CSP are not configured in app code

- Rule ID: NEXT-HEADERS-001 / REACT-CSP-001
- Severity: Medium
- Location: `frontend/next.config.ts:3`
- Evidence:
  - `frontend/next.config.ts:3-9` only configures dev origins, transpilation, and Turbopack root.
  - Repo search found no `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy` configuration in app/server config.
- Impact: React escaping reduces XSS risk, and no dangerous HTML sinks were found, but a CSP and clickjacking headers are still important defense-in-depth for a personal-data app that stores dream text and uses auth cookies.
- Fix:
  - Add `headers()` in `next.config.ts` or configure equivalent Vercel/edge headers.
  - Start with `Content-Security-Policy-Report-Only`, then enforce after checking reports.
  - Include at minimum `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and frame protection.
- Mitigation: Verify production runtime headers with `curl -I https://...` if edge config is managed outside the repo.
- False positive notes: Headers may be configured in Vercel or another edge layer outside this repository.

### S-07: Frontend production audit reports a moderate PostCSS advisory through Next

- Rule ID: REACT-SUPPLY-001 / NEXT-SUPPLY-001
- Severity: Medium
- Location: `frontend/package.json:18`
- Evidence:
  - `frontend/package.json` pins `next` to `16.2.6` at line 18.
  - `npm audit --omit=dev` reports `postcss <8.5.10` via `next/node_modules/postcss@8.4.31` with advisory `GHSA-qx2v-qp2m-jg93`.
  - `backend` and `services/korean-analyzer` production audits returned no vulnerabilities.
- Impact: The advisory is moderate and depends on CSS stringification of attacker-influenced CSS. It is not the top application risk, but it should be tracked.
- Fix:
  - Upgrade Next when a patched version updates its bundled PostCSS.
  - Do not apply the current `npm audit fix` suggestion blindly; it suggests a semver-major downgrade path and needs manual review.
- Mitigation: Avoid accepting user-supplied CSS anywhere in the app.
- False positive notes: This may be low exploitability for this app if user-controlled CSS never reaches PostCSS.

## Positive Controls Observed

- `frontend/.env` is ignored by git; only `frontend/.env.example` is tracked.
- `OPENAI_API_KEY` is read from server-side environment variables, not from `NEXT_PUBLIC_*`.
- Supabase publishable keys are the only browser-exposed Supabase config, which is expected.
- The main route handlers do runtime input validation with length/type checks before use.
- SQL queries reviewed in `frontend/src/lib/server/manyang-db.ts` use parameter placeholders rather than string interpolation for user input.
- OAuth callback redirects are constrained to internal paths with `startsWith("/") && !startsWith("//")`.
- No `dangerouslySetInnerHTML`, raw `innerHTML`, `eval`, `new Function`, or `postMessage` risks were found in `frontend/src`.

## Recommended Fix Order

1. Add hard abuse controls to `/api/tarot/readings` and `/api/dreams/analyze`: durable quota, rate limiting, pre-consumption, and idempotency before any OpenAI call.
2. Replace unsigned guest quota identity with a signed/opaque server-issued identifier and an IP/UA-backed fallback rate limit.
3. Enforce authenticated free-account quota or explicitly document unlimited logged-in readings and still rate-limit them.
4. Verify the production DB role used by `SUPABASE_DB_URL`; move user data access to RLS-enforced or least-privilege paths.
5. Add Origin/content-type CSRF guards for state-changing routes.
6. Add production security headers/CSP.
7. Track and upgrade the Next/PostCSS advisory when a safe patched Next release is available.
