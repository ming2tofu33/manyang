# API Abuse P0 Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent public API routes from becoming an unbounded OpenAI or embedding proxy for guests, free accounts, or scripted abuse.

**Architecture:** Add durable Postgres-backed quota reservations and network rate-limit buckets before any paid AI work runs. Replace unsigned guest identity with an HMAC-signed server cookie, reuse existing completed tarot readings before generation, and enforce free-account daily quota server-side. Keep the current product behavior where possible, but make quota decisions atomic and fail closed in production when signing secrets are missing.

**Tech Stack:** Next.js 16 App Router route handlers, TypeScript, Vitest, Node `crypto`, PostgreSQL/Supabase migrations, existing `pg` DB helper, existing `@manyang/backend` OpenAI provider.

---

## Non-Goals

- Do not implement P1 CSRF/header/CSP work in this plan.
- Do not rotate or print any real API keys.
- Do not replace the current OpenAI provider.
- Do not delete the existing `manyang.guest_reading_usage` table in this change; stop using it as the enforcement source after the new reservation table is in place.

## Implementation Notes

- The current worktree has user changes in `frontend/src/app/api/tarot/readings/route.ts` and `frontend/src/app/api/tarot/readings/route.test.ts`. Re-read `git diff -- <file>` before editing and preserve those timeout-related changes.
- The quota must be consumed before `createVectorAnalysisOptions(...)`, embedding calls, `generateDreamReadingForUser(...)`, and `generateTarotReadingForUser(...)`.
- Creating the provider object itself is not an external API call; it may happen before quota reservation to avoid consuming quota when provider configuration is missing.
- For OpenAI/provider timeouts or provider errors after an external call starts, keep the reservation row. This is intentional cost protection: failed paid work still consumes the daily attempt.

---

### Task 1: Baseline and Dirty-File Check

**Files:**
- Read: `frontend/src/app/api/dreams/analyze/route.ts:80-660`
- Read: `frontend/src/app/api/tarot/readings/route.ts:58-380`
- Read: `frontend/src/lib/server/manyang-db.ts:1-181`
- Read: `frontend/src/lib/access-policy.ts:109-140`
- Read: `frontend/src/app/api/dreams/analyze/route.test.ts`
- Read: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: Inspect status**

Run:

```powershell
git status --short
```

Expected: shows existing modified tarot route/test files and the plan file. Do not revert user changes.

**Step 2: Inspect route diffs**

Run:

```powershell
git diff -- frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
```

Expected: confirms the existing `resolveTarotLlmTimeoutMs` change. Preserve it while implementing P0.

**Step 3: Run current focused tests**

Run:

```powershell
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts src/app/api/tarot/readings/route.test.ts src/lib/access-policy.test.ts src/lib/server/manyang-db.test.ts
```

Expected: current baseline result recorded before changes. If existing user changes already fail, note the failure and continue with TDD on the new failing tests.

---

### Task 2: AI Quota and Rate-Limit Migration

**Files:**
- Create: `supabase/migrations/20260601000100_create_ai_usage_controls.sql`

**Step 1: Write the migration**

Create the migration with this schema:

```sql
create table if not exists manyang.ai_usage_reservations (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user', 'guest')),
  subject_hash text not null,
  feature text not null check (
    feature in (
      'dream_basic',
      'dream_detailed',
      'tarot_one_card',
      'tarot_three_card'
    )
  ),
  app_date date not null,
  request_hash text,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  unique (subject_type, subject_hash, feature, app_date)
);

create index if not exists ai_usage_reservations_subject_date_idx
  on manyang.ai_usage_reservations (subject_type, subject_hash, app_date desc);

create table if not exists manyang.ai_usage_rate_limits (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('network')),
  subject_hash text not null,
  feature text not null check (
    feature in (
      'ai_generation',
      'dream_basic',
      'dream_detailed',
      'tarot_one_card',
      'tarot_three_card'
    )
  ),
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  request_count integer not null default 1 check (request_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_type, subject_hash, feature, window_start, window_seconds)
);

create index if not exists ai_usage_rate_limits_subject_window_idx
  on manyang.ai_usage_rate_limits (subject_type, subject_hash, window_start desc);

alter table manyang.ai_usage_reservations enable row level security;
alter table manyang.ai_usage_rate_limits enable row level security;

grant select, insert, update on manyang.ai_usage_reservations to service_role;
grant select, insert, update on manyang.ai_usage_rate_limits to service_role;
```

**Step 2: Verify migration ordering**

Run:

```powershell
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object -ExpandProperty Name
```

Expected: `20260601000100_create_ai_usage_controls.sql` sorts after the existing 20260531 migrations.

**Step 3: Commit**

```powershell
git add supabase/migrations/20260601000100_create_ai_usage_controls.sql
git commit -m "feat: add ai usage control tables"
```

---

### Task 3: Server Quota Helper

**Files:**
- Create: `frontend/src/lib/server/ai-usage-quota.ts`
- Create: `frontend/src/lib/server/ai-usage-quota.test.ts`

**Step 1: Write failing tests**

Create tests for:

- `hashQuotaSubject(...)` never returns the raw user id, guest id, IP, or user agent.
- production env without `MANYANG_QUOTA_HASH_SECRET` throws a configuration error.
- `reserveAiUsage(...)` returns `{ allowed: true, reservationId }` when insert returns a row.
- `reserveAiUsage(...)` returns `{ allowed: false, reason: "daily_limit" }` when insert returns no row.
- `completeAiUsageReservation(...)` updates `status = 'completed'`.
- `failAiUsageReservation(...)` updates `status = 'failed'` without deleting the reservation.
- `consumeAiRateLimit(...)` returns denied when the upsert `returning` row is empty.

Minimal expected test shape:

```ts
import { describe, expect, test, vi } from "vitest";

import {
  AiUsageConfigurationError,
  completeAiUsageReservation,
  consumeAiRateLimit,
  failAiUsageReservation,
  hashQuotaSubject,
  reserveAiUsage,
} from "./ai-usage-quota";

describe("ai usage quota", () => {
  test("hashes quota subjects with an env secret", () => {
    const hash = hashQuotaSubject("user", "user-1", {
      MANYANG_QUOTA_HASH_SECRET: "test-secret",
      NODE_ENV: "test",
    });

    expect(hash).not.toContain("user-1");
    expect(hash).toHaveLength(64);
  });

  test("fails closed in production without a quota hash secret", () => {
    expect(() =>
      hashQuotaSubject("guest", "guest-1", {
        NODE_ENV: "production",
      }),
    ).toThrow(AiUsageConfigurationError);
  });
});
```

Run:

```powershell
npm --prefix frontend test -- src/lib/server/ai-usage-quota.test.ts
```

Expected: FAIL because the module does not exist.

**Step 2: Implement the helper**

Implement this public API:

```ts
import { createHmac } from "crypto";
import type { Pool } from "pg";

import { getManyangDbPool } from "@/lib/server/manyang-db";

export type AiUsageSubjectType = "user" | "guest";
export type AiRateLimitSubjectType = "network";
export type AiUsageFeature = "dream_basic" | "dream_detailed" | "tarot_one_card" | "tarot_three_card";
export type AiRateLimitFeature = AiUsageFeature | "ai_generation";

export class AiUsageConfigurationError extends Error {
  constructor(message = "AI usage quota is not configured") {
    super(message);
    this.name = "AiUsageConfigurationError";
  }
}

export function hashQuotaSubject(
  subjectType: AiUsageSubjectType | AiRateLimitSubjectType,
  subjectId: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const secret = env.MANYANG_QUOTA_HASH_SECRET;

  if (!secret && env.NODE_ENV === "production") {
    throw new AiUsageConfigurationError("MANYANG_QUOTA_HASH_SECRET is required in production");
  }

  return createHmac("sha256", secret || "development-only-quota-hash-secret")
    .update(`${subjectType}:${subjectId}`)
    .digest("hex");
}
```

Implement reservation with `insert ... on conflict do nothing returning id`:

```ts
export async function reserveAiUsage(
  input: {
    subjectType: AiUsageSubjectType;
    subjectHash: string;
    feature: AiUsageFeature;
    appDate: string;
    requestHash?: string;
  },
  pool: Pick<Pool, "query"> = getManyangDbPool(),
): Promise<{ allowed: true; reservationId: string } | { allowed: false; reason: "daily_limit" }> {
  const result = await pool.query<{ id: string }>(
    `
      insert into manyang.ai_usage_reservations (
        subject_type,
        subject_hash,
        feature,
        app_date,
        request_hash
      )
      values ($1, $2, $3, $4::date, $5)
      on conflict (subject_type, subject_hash, feature, app_date) do nothing
      returning id
    `,
    [input.subjectType, input.subjectHash, input.feature, input.appDate, input.requestHash ?? null],
  );

  const reservationId = result.rows[0]?.id;
  return reservationId ? { allowed: true, reservationId } : { allowed: false, reason: "daily_limit" };
}
```

Implement completion/failure updates:

```ts
export async function completeAiUsageReservation(
  reservationId: string,
  pool: Pick<Pool, "query"> = getManyangDbPool(),
): Promise<void> {
  await pool.query(
    `
      update manyang.ai_usage_reservations
      set status = 'completed',
          completed_at = now()
      where id = $1
    `,
    [reservationId],
  );
}
```

Implement `failAiUsageReservation(...)` the same way with `status = 'failed'` and `failed_at = now()`.

Implement atomic rate limiting:

```ts
export async function consumeAiRateLimit(
  input: {
    subjectType: AiRateLimitSubjectType;
    subjectHash: string;
    feature: AiRateLimitFeature;
    windowStart: Date;
    windowSeconds: number;
    limit: number;
  },
  pool: Pick<Pool, "query"> = getManyangDbPool(),
): Promise<{ allowed: true; remaining: number } | { allowed: false; reason: "rate_limited" }> {
  const result = await pool.query<{ request_count: number }>(
    `
      insert into manyang.ai_usage_rate_limits (
        subject_type,
        subject_hash,
        feature,
        window_start,
        window_seconds,
        request_count
      )
      values ($1, $2, $3, $4::timestamptz, $5, 1)
      on conflict (subject_type, subject_hash, feature, window_start, window_seconds)
      do update set
        request_count = manyang.ai_usage_rate_limits.request_count + 1,
        updated_at = now()
      where manyang.ai_usage_rate_limits.request_count < $6
      returning request_count
    `,
    [
      input.subjectType,
      input.subjectHash,
      input.feature,
      input.windowStart.toISOString(),
      input.windowSeconds,
      input.limit,
    ],
  );

  const requestCount = result.rows[0]?.request_count;
  return typeof requestCount === "number"
    ? { allowed: true, remaining: Math.max(0, input.limit - requestCount) }
    : { allowed: false, reason: "rate_limited" };
}
```

**Step 3: Verify**

Run:

```powershell
npm --prefix frontend test -- src/lib/server/ai-usage-quota.test.ts
```

Expected: PASS.

**Step 4: Commit**

```powershell
git add frontend/src/lib/server/ai-usage-quota.ts frontend/src/lib/server/ai-usage-quota.test.ts
git commit -m "feat: add ai usage quota helper"
```

---

### Task 4: Signed Guest Session Helper

**Files:**
- Create: `frontend/src/lib/server/guest-session.ts`
- Create: `frontend/src/lib/server/guest-session.test.ts`
- Modify: `frontend/.env.example`

**Step 1: Write failing tests**

Create tests for:

- unsigned legacy UUID cookie is ignored and replaced.
- signed cookie is accepted and does not set a replacement cookie.
- tampered signature is rejected and replaced.
- production env without `MANYANG_GUEST_COOKIE_SECRET` throws `GuestSessionConfigurationError`.
- `createGuestIdCookie(...)` keeps `HttpOnly`, `SameSite=Lax`, `Path=/`, and production-only `Secure`.

Run:

```powershell
npm --prefix frontend test -- src/lib/server/guest-session.test.ts
```

Expected: FAIL because the module does not exist.

**Step 2: Implement helper**

Implement this public API:

```ts
import { createHmac, timingSafeEqual } from "crypto";
import { randomUUID } from "crypto";

export const guestIdCookieName = "manyang_guest_id";
export const guestIdCookieMaxAgeSeconds = 60 * 60 * 24 * 400;

export type GuestSession = {
  guestId: string;
  cookieValue: string;
  shouldSetCookie: boolean;
};

export class GuestSessionConfigurationError extends Error {
  constructor(message = "Guest session signing is not configured") {
    super(message);
    this.name = "GuestSessionConfigurationError";
  }
}
```

Use HMAC-SHA256 and a versioned cookie value:

```ts
function getGuestCookieSecret(env: Record<string, string | undefined>): string {
  const secret = env.MANYANG_GUEST_COOKIE_SECRET;

  if (!secret && env.NODE_ENV === "production") {
    throw new GuestSessionConfigurationError("MANYANG_GUEST_COOKIE_SECRET is required in production");
  }

  return secret || "development-only-guest-cookie-secret";
}

export function signGuestId(guestId: string, env: Record<string, string | undefined> = process.env): string {
  return createHmac("sha256", getGuestCookieSecret(env)).update(`v1:${guestId}`).digest("hex");
}

export function createSignedGuestCookieValue(
  guestId: string,
  env: Record<string, string | undefined> = process.env,
): string {
  return `v1.${guestId}.${signGuestId(guestId, env)}`;
}
```

Implement `resolveGuestSession(request, options)`:

```ts
export function resolveGuestSession(
  request: Request,
  options: {
    createGuestId?: () => string;
    env?: Record<string, string | undefined>;
  } = {},
): GuestSession {
  const env = options.env ?? process.env;
  const createGuestId = options.createGuestId ?? randomUUID;
  const cookieValue = getRequestCookie(request, guestIdCookieName);
  const guestId = verifySignedGuestCookieValue(cookieValue, env);

  if (guestId) {
    return {
      guestId,
      cookieValue: cookieValue as string,
      shouldSetCookie: false,
    };
  }

  const nextGuestId = createGuestId();
  return {
    guestId: nextGuestId,
    cookieValue: createSignedGuestCookieValue(nextGuestId, env),
    shouldSetCookie: true,
  };
}
```

Implement constant-time signature comparison with `timingSafeEqual`. If buffers have different lengths, reject without throwing.

**Step 3: Add env examples**

Add to `frontend/.env.example`:

```dotenv
# Required in production for server-side abuse controls.
MANYANG_GUEST_COOKIE_SECRET=
MANYANG_QUOTA_HASH_SECRET=
```

Do not add real values.

**Step 4: Verify**

Run:

```powershell
npm --prefix frontend test -- src/lib/server/guest-session.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/server/guest-session.ts frontend/src/lib/server/guest-session.test.ts frontend/.env.example
git commit -m "feat: sign guest session cookies"
```

---

### Task 5: Access Policy Free-Account Daily Limit

**Files:**
- Modify: `frontend/src/lib/access-policy.ts:109-140`
- Modify: `frontend/src/lib/access-policy.test.ts`

**Step 1: Write failing tests**

Add tests that assert:

- `free_account` with `readingKind: "basic"` and `hasUsedBasicReadingToday: true` returns `{ allowed: false, reason: "free_daily_limit" }`.
- `moon_pass` with `hasUsedBasicReadingToday: true` remains allowed.
- `bypassDailyLimit: true` allows admin/dev bypass.

Run:

```powershell
npm --prefix frontend test -- src/lib/access-policy.test.ts
```

Expected: FAIL because `free_daily_limit` is typed but not enforced.

**Step 2: Implement policy**

Add this branch after the existing guest daily branch or combine the branches clearly:

```ts
if (input.accessPlan === "free_account" && input.hasUsedBasicReadingToday && input.bypassDailyLimit !== true) {
  return {
    allowed: false,
    reason: "free_daily_limit",
    ctaLabel: "Open Moon Pass",
    message: "Free accounts can receive one basic reading per day.",
  };
}
```

Keep existing Korean product copy if the surrounding file already has finalized localized strings; otherwise use a neutral string and let copy be updated separately.

**Step 3: Verify**

Run:

```powershell
npm --prefix frontend test -- src/lib/access-policy.test.ts
```

Expected: PASS.

**Step 4: Commit**

```powershell
git add frontend/src/lib/access-policy.ts frontend/src/lib/access-policy.test.ts
git commit -m "feat: enforce free account daily reading limit"
```

---

### Task 6: Dream Analyze Route Pre-Consumption

**Files:**
- Modify: `frontend/src/app/api/dreams/analyze/route.ts:80-660`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts:44-132`

**Step 1: Add route tests first**

Add tests that prove:

- guest basic analysis calls `reserveAiUsage(...)` before `generateDreamReadingForUser(...)`.
- if reservation returns denied, response is 403 with `reason: "guest_daily_limit"` and no provider/vector/LLM work starts.
- free-account basic analysis calls `hasCompletedBasicReadingForUserOnDate(...)` and returns 403 with `reason: "free_daily_limit"` before provider/vector/LLM work.
- network rate limit denial returns 429 with `reason: "rate_limited"` before provider/vector/LLM work.
- signed guest cookie is set after a successful guest request.
- provider unavailable due to configuration does not create a quota reservation.
- provider timeout/unavailable after generation marks the reservation failed and does not delete it.

Run:

```powershell
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts
```

Expected: FAIL because the route has no new dependencies and still uses unsigned guest quota checks.

**Step 2: Extend route dependency type**

Add optional dependencies to `DreamAnalyzeRouteDependencies`:

```ts
hasCompletedBasicReadingForUserOnDate?: (userId: string, dreamDate: string) => Promise<boolean>;
resolveGuestSession?: (request: Request, createGuestId: () => string) => GuestSession;
reserveAiUsage?: typeof reserveAiUsage;
completeAiUsageReservation?: typeof completeAiUsageReservation;
failAiUsageReservation?: typeof failAiUsageReservation;
consumeAiRateLimit?: typeof consumeAiRateLimit;
```

Import these from the new server modules. Keep old `persistGuestBasicReadingUsage` only as best-effort compatibility, not as the enforcement gate.

**Step 3: Add network fingerprint helpers**

Add small route-local helpers:

```ts
function getClientNetworkSubject(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) || "unknown-ua";
  return `${forwardedFor}:${userAgent}`;
}

function getCurrentWindowStart(now: Date, windowSeconds: number): Date {
  return new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
}
```

**Step 4: Reorder dream handler flow**

Target order inside `handleDreamAnalyzeRequest(...)`:

1. Parse and validate JSON.
2. Resolve `userId`, `accessPlan`, `isAdmin`, `readingKind`, and `dreamDate`.
3. Return existing authenticated same-date/same-text reading before paid work.
4. For guest basic, resolve signed guest session.
5. For free-account basic, call `hasCompletedBasicReadingForUserOnDate(...)` and enforce `free_daily_limit`.
6. Run existing `canRequestReading(...)` access gate.
7. Create provider object and return 503 if provider config is missing.
8. Consume network rate limit:

```ts
const networkHash = hashQuotaSubject("network", getClientNetworkSubject(request));
const rateLimit = await resolvedDependencies.consumeAiRateLimit({
  subjectType: "network",
  subjectHash: networkHash,
  feature: "ai_generation",
  windowStart: getCurrentWindowStart(new Date(), 60 * 60),
  windowSeconds: 60 * 60,
  limit: 20,
});

if (!rateLimit.allowed) {
  return createJsonResponse({ error: "rate limited", reason: "rate_limited" }, { status: 429 }, guestSession);
}
```

9. Reserve daily quota for guests and free accounts on basic readings:

```ts
const quotaSubject = userId
  ? { subjectType: "user" as const, subjectId: userId }
  : guestSession
    ? { subjectType: "guest" as const, subjectId: guestSession.guestId }
    : null;

const quotaFeature = readingKind === "basic" ? "dream_basic" : "dream_detailed";
const shouldReserveDailyQuota =
  !isAdmin &&
  readingKind === "basic" &&
  (accessPlan === "guest" || accessPlan === "free_account") &&
  quotaSubject;

const reservation = shouldReserveDailyQuota
  ? await resolvedDependencies.reserveAiUsage({
      subjectType: quotaSubject.subjectType,
      subjectHash: hashQuotaSubject(quotaSubject.subjectType, quotaSubject.subjectId),
      feature: quotaFeature,
      appDate: dreamDate,
    })
  : null;

if (reservation && !reservation.allowed) {
  return createJsonResponse(
    {
      error: "dream reading is locked",
      reason: accessPlan === "guest" ? "guest_daily_limit" : "free_daily_limit",
    },
    { status: 403 },
    guestSession,
  );
}
```

10. Only after rate limit and reservation, call vector/embedding helpers and `generateDreamReadingForUser(...)`.
11. On success, call `completeAiUsageReservation(reservation.reservationId)`.
12. On unavailable/error after external work starts, call `failAiUsageReservation(reservation.reservationId)` before returning.

**Step 5: Verify**

Run:

```powershell
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts src/lib/access-policy.test.ts
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/analyze/route.test.ts frontend/src/lib/server/manyang-db.ts
git commit -m "feat: pre-consume dream ai quota"
```

---

### Task 7: Tarot Route Reuse and Pre-Consumption

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts:22-181`
- Modify: `frontend/src/lib/server/manyang-db.test.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.ts:58-380`
- Modify: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: Write DB helper tests**

Add tests for:

- `findCompletedTarotReadingForUserOnDate(userId, appDate, spread)` returns `raw_reading` when a row exists.
- it returns `null` when no row exists.
- it uses `user_id`, `app_date`, and `spread` filters.

Run:

```powershell
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts
```

Expected: FAIL because the helper does not exist.

**Step 2: Implement DB helper**

Add:

```ts
export async function findCompletedTarotReadingForUserOnDate(
  userId: string,
  appDate: string,
  spread: DailyTarotReading["spread"],
  pool = getManyangDbPool(),
): Promise<DailyTarotReading | null> {
  const result = await pool.query<{ raw_reading: DailyTarotReading }>(
    `
      select raw_reading
      from manyang.tarot_readings
      where user_id = $1
        and app_date = $2::date
        and spread = $3
      order by created_at desc
      limit 1
    `,
    [userId, appDate, spread],
  );

  return result.rows[0]?.raw_reading ?? null;
}
```

**Step 3: Write tarot route tests**

Add tests that prove:

- authenticated same-day same-spread tarot returns existing DB reading without provider or LLM calls.
- guest one-card reading uses signed guest session and reserves `tarot_one_card` before LLM.
- guest one-card reservation denial returns 403 or 429 with no provider/LLM call.
- non-Moon Pass three-card remains locked before quota/provider/LLM work.
- Moon Pass three-card reserves `tarot_three_card` and completes reservation after persistence.
- network rate limit denial returns 429 before provider/LLM work.

Run:

```powershell
npm --prefix frontend test -- src/app/api/tarot/readings/route.test.ts
```

Expected: FAIL because the route does not yet reuse existing DB readings or reserve quota.

**Step 4: Extend tarot dependencies**

Add optional dependencies to `TarotReadingsRouteDependencies`:

```ts
findCompletedTarotReadingForUserOnDate?: typeof findCompletedTarotReadingForUserOnDate;
resolveGuestSession?: (request: Request, createGuestId: () => string) => GuestSession;
createGuestId?: () => string;
reserveAiUsage?: typeof reserveAiUsage;
completeAiUsageReservation?: typeof completeAiUsageReservation;
failAiUsageReservation?: typeof failAiUsageReservation;
consumeAiRateLimit?: typeof consumeAiRateLimit;
```

**Step 5: Reorder tarot handler flow**

Target order inside `handleTarotReadingRequest(...)`:

1. Parse and validate JSON.
2. Resolve `userId`, `accessPlan`, and `isAdmin`.
3. If `userId`, call `findCompletedTarotReadingForUserOnDate(userId, appDate, spread)` and return it if present.
4. Enforce existing three-card lock for non-paid users.
5. Resolve signed guest session for guest one-card requests.
6. Create provider object and return 503 if provider is missing.
7. Consume network rate limit with `feature: "ai_generation"`.
8. Reserve daily quota:

```ts
const quotaFeature = validatedBody.value.spread === "daily_three_card"
  ? "tarot_three_card"
  : "tarot_one_card";
const quotaSubject = userId
  ? { subjectType: "user" as const, subjectId: userId }
  : guestSession
    ? { subjectType: "guest" as const, subjectId: guestSession.guestId }
    : null;

const reservation = !isAdmin && quotaSubject
  ? await resolvedDependencies.reserveAiUsage({
      subjectType: quotaSubject.subjectType,
      subjectHash: hashQuotaSubject(quotaSubject.subjectType, quotaSubject.subjectId),
      feature: quotaFeature,
      appDate: validatedBody.value.appDate,
    })
  : null;
```

If denied:

```ts
return Response.json(
  {
    error: "tarot reading is locked",
    reason: "tarot_daily_limit",
  },
  { status: 403 },
);
```

9. Only then call `generateTarotReadingForUser(...)`.
10. On success, persist authenticated readings and complete reservation.
11. On unavailable/error after generation starts, fail reservation.

**Step 6: Preserve timeout behavior**

Keep the current behavior:

```ts
{ provider, providerTimeoutMs: resolveTarotLlmTimeoutMs() }
```

The user-modified timeout tests must still pass.

**Step 7: Verify**

Run:

```powershell
npm --prefix frontend test -- src/app/api/tarot/readings/route.test.ts src/lib/server/manyang-db.test.ts
```

Expected: PASS.

**Step 8: Commit**

```powershell
git add frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat: pre-consume tarot ai quota"
```

---

### Task 8: Operational Guardrails

**Files:**
- Create: `docs/security-api-abuse-runbook.md`
- Modify: `frontend/.env.example`

**Step 1: Document production requirements**

Create `docs/security-api-abuse-runbook.md` with:

```md
# API Abuse Guardrails

## Required Production Environment

- `MANYANG_GUEST_COOKIE_SECRET`: long random secret for HMAC signing guest ids.
- `MANYANG_QUOTA_HASH_SECRET`: long random secret for hashing user, guest, and network quota subjects.
- `OPENAI_API_KEY`: project-scoped key, not an account-wide default key.

## Required OpenAI Controls

- Use a dedicated OpenAI project for Manyang production.
- Set a project budget and alert threshold.
- Set model-level rate limits where available.
- Rotate the API key if it has ever been exposed outside production secret storage.

## Required Edge Controls

- Add Vercel WAF or equivalent route limits for:
  - `/api/dreams/analyze`
  - `/api/tarot/readings`
- Start with conservative limits, then tune after observing legitimate traffic.

## Verification

- A second same-day guest basic dream reading returns `guest_daily_limit`.
- A second same-day free-account basic dream reading returns `free_daily_limit`.
- A second same-day tarot spread returns the existing authenticated reading or a daily-limit response.
- Excess scripted requests return `rate_limited` before provider work.
```

**Step 2: Ensure env example has no secrets**

Verify `frontend/.env.example` documents:

```dotenv
MANYANG_GUEST_COOKIE_SECRET=
MANYANG_QUOTA_HASH_SECRET=
```

Expected: only variable names, no values.

**Step 3: Commit**

```powershell
git add docs/security-api-abuse-runbook.md frontend/.env.example
git commit -m "docs: document api abuse guardrails"
```

---

### Task 9: Final Verification

**Files:**
- Verify: all files changed by Tasks 2-8

**Step 1: Run focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/server/ai-usage-quota.test.ts src/lib/server/guest-session.test.ts src/lib/access-policy.test.ts src/lib/server/manyang-db.test.ts src/app/api/dreams/analyze/route.test.ts src/app/api/tarot/readings/route.test.ts
```

Expected: PASS.

**Step 2: Run frontend lint**

Run:

```powershell
npm --prefix frontend run lint
```

Expected: PASS.

**Step 3: Run frontend build**

Run:

```powershell
npm --prefix frontend run build
```

Expected: PASS if the local environment has the build-time env required by the app. If it fails due to missing local env, record the exact missing env and do not paper over it.

**Step 4: Run final diff review**

Run:

```powershell
git diff --stat
git diff --check
```

Expected: no whitespace errors. Diff should be limited to migration, quota/session helpers, route/tests, access policy/tests, env example, and runbook.

**Step 5: Final commit if any uncommitted verification fixes exist**

```powershell
git add <changed-files>
git commit -m "test: verify api abuse hardening"
```

Only commit if verification required code/test/doc fixes after earlier task commits.

---

## Acceptance Criteria

- Guest and free-account basic dream readings cannot trigger paid AI work more than once per app date.
- Guest tarot one-card readings cannot trigger paid AI work more than once per app date.
- Authenticated tarot readings return an existing same-day same-spread DB result before starting provider or LLM work.
- Three-card tarot remains unavailable to non-paid users before any quota/provider/LLM work.
- Burst/scripted requests hit a network rate limit before provider, embedding, or LLM work.
- Guest identity is HMAC-signed and tampered/plain cookies are not trusted.
- Production fails closed if `MANYANG_GUEST_COOKIE_SECRET` or `MANYANG_QUOTA_HASH_SECRET` is missing.
- No real secrets are added to source control.
