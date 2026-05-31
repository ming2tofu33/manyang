# Auth-Gated Dream Archive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 비로그인은 꿈해몽 체험/영수증/공유까지만 허용하고, 로그인 사용자만 기록장/달력/상징 히스토리에 꿈을 저장하게 만든다.

**Architecture:** `latestAnalysis`는 비로그인도 볼 수 있는 임시 영수증 슬롯으로 유지하고, 영구 기록은 Supabase Auth 세션이 있는 경우에만 `manyang` 스키마로 저장한다. 아카이브/달력은 비로그인에게 실제 기록 목록을 보여주지 않고 로그인 CTA와 미리보기만 보여준다. 로그인 후에는 방금 받은 임시 영수증을 `POST /api/dreams`로 계정 기록에 저장할 수 있게 한다.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Auth via `@supabase/ssr`, Postgres `manyang` schema, Vitest, TypeScript, ESLint.

---

## Product Rules

- Guest:
  - Can request 1 basic dream reading per day.
  - Can view the dream receipt.
  - Can download/share receipt image.
  - Cannot save to archive/calendar.
  - Cannot accumulate pawprints, seeds, symbol history, monthly reports, detailed readings.
- Free authenticated user:
  - Can request 1 basic dream reading per day.
  - Completed readings are automatically saved to DB.
  - Archive/calendar/symbol history are available.
  - Detailed readings and premium summaries remain locked.
- Moon Pass user:
  - Can use premium/detailed reading flows.
  - Can access advanced cumulative analysis, repeated symbols, monthly reports.

## Current Code Context

- Server DB persistence already exists:
  - `frontend/src/app/api/dreams/analyze/route.ts`
  - `frontend/src/app/api/dreams/route.ts`
  - `frontend/src/app/api/dreams/[dreamId]/route.ts`
  - `frontend/src/lib/server/manyang-db.ts`
  - `supabase/migrations/20260530000100_create_manyang_core.sql`
- Archive currently reads server records when a Supabase session exists, but still falls back to local records:
  - `frontend/src/lib/use-archive-dream-records.ts`
  - `frontend/src/components/archive-calendar.tsx`
  - `frontend/src/components/dream-archive-list.tsx`
- Dream entry/result currently still saves completed readings into browser local dream records:
  - `frontend/src/components/dream-entry-form.tsx`
  - `frontend/src/components/dream-result-page-client.tsx`
  - `frontend/src/lib/dream-storage.ts`
- Supabase helper files exist:
  - `frontend/src/lib/supabase/client.ts`
  - `frontend/src/lib/supabase/server.ts`
  - `frontend/src/lib/supabase/env.ts`

---

## Phase 1: Auth Session Foundation

### Task 1: Add Browser Auth State Helper

**Files:**
- Create: `frontend/src/lib/auth-session.ts`
- Test: `frontend/src/lib/auth-session.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";

import { getArchiveAccessState } from "./auth-session";

describe("auth session helpers", () => {
  test("treats missing session as guest archive access", () => {
    expect(getArchiveAccessState(null)).toEqual({
      status: "guest",
      canPersistDreams: false,
      canViewArchive: false,
    });
  });

  test("treats a user session as authenticated archive access", () => {
    expect(getArchiveAccessState({ user: { id: "user-1" } })).toEqual({
      status: "authenticated",
      canPersistDreams: true,
      canViewArchive: true,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/auth-session.test.ts
```

Expected: FAIL because `./auth-session` does not exist.

**Step 3: Write minimal implementation**

```ts
export type MinimalAuthSession = {
  user?: {
    id?: string;
  } | null;
} | null;

export type ArchiveAccessState =
  | {
      status: "guest";
      canPersistDreams: false;
      canViewArchive: false;
    }
  | {
      status: "authenticated";
      canPersistDreams: true;
      canViewArchive: true;
    };

export function getArchiveAccessState(session: MinimalAuthSession): ArchiveAccessState {
  if (session?.user?.id) {
    return {
      status: "authenticated",
      canPersistDreams: true,
      canViewArchive: true,
    };
  }

  return {
    status: "guest",
    canPersistDreams: false,
    canViewArchive: false,
  };
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm --prefix frontend test -- src/lib/auth-session.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/auth-session.ts frontend/src/lib/auth-session.test.ts
git commit -m "feat: add auth archive access helper"
```

---

### Task 2: Add Supabase Auth UI Route

**Files:**
- Create: `frontend/src/app/auth/page.tsx`
- Create: `frontend/src/components/auth-form.tsx`
- Test: `frontend/src/components/auth-form.test.tsx`

**Step 1: Write the failing tests**

Use component-level tests only for deterministic behavior. Do not test Supabase network calls directly.

```ts
import { describe, expect, test } from "vitest";

import { createAuthRedirectPath, createGoogleOAuthSignInArgs, isValidAuthNextPath } from "./auth-form";

describe("auth form helpers", () => {
  test("allows only internal next paths", () => {
    expect(isValidAuthNextPath("/result?saveLatest=1")).toBe(true);
    expect(isValidAuthNextPath("https://evil.example")).toBe(false);
    expect(isValidAuthNextPath("//evil.example")).toBe(false);
  });

  test("creates a callback redirect URL for saving the latest receipt", () => {
    expect(createAuthRedirectPath("/result", true)).toBe("/auth/callback?next=%2Fresult%3FsaveLatest%3D1");
  });

  test("creates Google OAuth sign-in args with the callback redirect", () => {
    expect(createGoogleOAuthSignInArgs("https://manyang.example", "/result", true)).toEqual({
      provider: "google",
      options: {
        redirectTo: "https://manyang.example/auth/callback?next=%2Fresult%3FsaveLatest%3D1",
      },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/components/auth-form.test.tsx
```

Expected: FAIL because `auth-form` does not exist.

**Step 3: Write minimal implementation**

`frontend/src/components/auth-form.tsx` should:

- Use `"use client"`.
- Use `createSupabaseBrowserClient()`.
- Accept a `next` path from `searchParams`.
- Start Google OAuth only. Do not add email OTP for MVP.
- Show a compact error message if OAuth cannot start.
- Default `next` to `/archive`.

Core helper code:

```ts
export function isValidAuthNextPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export function createAuthRedirectPath(nextPath: string, saveLatest: boolean): string {
  const resolvedNext = saveLatest ? `${nextPath}?saveLatest=1` : nextPath;

  return `/auth/callback?next=${encodeURIComponent(resolvedNext)}`;
}

export function createGoogleOAuthSignInArgs(origin: string, nextPath: string, saveLatest: boolean) {
  return {
    provider: "google" as const,
    options: {
      redirectTo: `${origin}${createAuthRedirectPath(nextPath, saveLatest)}`,
    },
  };
}
```

Auth form behavior:

```ts
await supabase.auth.signInWithOAuth(
  createGoogleOAuthSignInArgs(window.location.origin, nextPath, saveLatest),
);
```

**Step 4: Add page**

`frontend/src/app/auth/page.tsx`:

```tsx
import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { AuthForm } from "@/components/auth-form";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPage() {
  return (
    <AppShell background={manyangAssets.backgrounds.default} title="로그인" subtitle="꿈을 달력에 남기기" backHref="/result">
      <div className="mt-6 pb-5">
        <AuthForm />
      </div>
    </AppShell>
  );
}
```

**Step 5: Run tests**

Run:

```bash
npm --prefix frontend test -- src/components/auth-form.test.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/app/auth/page.tsx frontend/src/components/auth-form.tsx frontend/src/components/auth-form.test.tsx
git commit -m "feat: add auth entry screen"
```

---

### Task 3: Add Auth Callback Route

**Files:**
- Create: `frontend/src/app/auth/callback/route.ts`
- Test: `frontend/src/app/auth/callback/route.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";

import { resolveSafeAuthRedirect } from "./route";

describe("auth callback route", () => {
  test("keeps safe internal redirect paths", () => {
    expect(resolveSafeAuthRedirect("/result?saveLatest=1")).toBe("/result?saveLatest=1");
  });

  test("falls back for unsafe redirect paths", () => {
    expect(resolveSafeAuthRedirect("https://evil.example")).toBe("/archive");
    expect(resolveSafeAuthRedirect("//evil.example")).toBe("/archive");
    expect(resolveSafeAuthRedirect(null)).toBe("/archive");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/app/auth/callback/route.test.ts
```

Expected: FAIL because route does not exist.

**Step 3: Implement callback route**

`frontend/src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export function resolveSafeAuthRedirect(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/archive";
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = resolveSafeAuthRedirect(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
```

**Step 4: Run tests**

Run:

```bash
npm --prefix frontend test -- src/app/auth/callback/route.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/auth/callback/route.ts frontend/src/app/auth/callback/route.test.ts
git commit -m "feat: add supabase auth callback"
```

---

## Phase 2: Stop Guest Permanent Saves

### Task 4: Stop Saving Guest Readings to Local Dream Records

**Files:**
- Modify: `frontend/src/components/dream-entry-form.tsx`
- Modify: `frontend/src/components/dream-result-page-client.tsx`
- Test: `frontend/src/lib/dream-storage.test.ts`
- Optional Create: `frontend/src/lib/dream-result-persistence.ts`
- Test: `frontend/src/lib/dream-result-persistence.test.ts`

**Step 1: Write the failing persistence policy test**

```ts
import { describe, expect, test } from "vitest";

import { shouldSaveReadingToLocalArchive } from "./dream-result-persistence";

describe("dream result persistence policy", () => {
  test("never saves completed readings to local archive for guests", () => {
    expect(shouldSaveReadingToLocalArchive({ isAuthenticated: false, status: "completed" })).toBe(false);
  });

  test("does not save unavailable attempts as permanent archive records", () => {
    expect(shouldSaveReadingToLocalArchive({ isAuthenticated: false, status: "unavailable" })).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/dream-result-persistence.test.ts
```

Expected: FAIL because helper does not exist.

**Step 3: Implement helper**

```ts
export type DreamResultPersistenceInput = {
  isAuthenticated: boolean;
  status: "completed" | "unavailable";
};

export function shouldSaveReadingToLocalArchive(_input: DreamResultPersistenceInput): boolean {
  return false;
}
```

This is intentionally strict. Permanent browser archive is no longer a product feature. `latestAnalysis` remains allowed.

**Step 4: Modify `DreamEntryForm`**

Remove these completed-reading local archive writes:

```ts
saveDreamRecordToBrowser({
  ...payload,
  id: analysis.dreamId,
  savedAt: new Date().toISOString(),
});
```

Keep:

```ts
saveLatestAnalysisToBrowser(payload);
clearDreamDraftFromBrowser();
router.push("/result");
```

For 503 unavailable results, remove `saveDreamRecordToBrowser`. Keep `saveLatestAnalysisToBrowser` and `saveDreamDraftToBrowser`.

**Step 5: Modify `DreamResultPageClient` retry flow**

Remove local archive writes after retry success/failure. Keep only:

```ts
saveLatestAnalysisToBrowser(completedPayload);
```

and:

```ts
saveLatestAnalysisToBrowser(nextUnavailablePayload);
```

**Step 6: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/lib/dream-result-persistence.test.ts src/lib/dream-storage.test.ts
```

Expected: PASS.

**Step 7: Commit**

```bash
git add frontend/src/lib/dream-result-persistence.ts frontend/src/lib/dream-result-persistence.test.ts frontend/src/components/dream-entry-form.tsx frontend/src/components/dream-result-page-client.tsx
git commit -m "feat: keep guest readings as temporary receipts"
```

---

### Task 5: Add Explicit Save-Latest API for Post-Login Save

**Files:**
- Modify: `frontend/src/app/api/dreams/route.ts`
- Modify: `frontend/src/app/api/dreams/route.test.ts`
- Reuse: `frontend/src/lib/server/manyang-db.ts`
- Reuse: `frontend/src/lib/manyang-dream-records.ts`

**Step 1: Write the failing tests**

Add to `frontend/src/app/api/dreams/route.test.ts`:

```ts
test("POST saves a latest completed receipt for an authenticated user", async () => {
  const persisted: unknown[] = [];
  const response = await handleDreamRecordsRequest(
    new Request("http://localhost/api/dreams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dreamText: "I dreamed about a train.",
        dreamDate: "2026-05-30",
        catReaderType: "gray_cat",
        analysis: createDreamAnalysisResponse(),
      }),
    }),
    {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      listDreamRecordsForUser: async () => [],
      persistCompletedDreamReading: async (input) => {
        persisted.push(input);
        return "db-dream-id";
      },
    },
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({ dreamId: "db-dream-id" });
  expect(persisted).toHaveLength(1);
});

test("POST refuses guest archive saves", async () => {
  const response = await handleDreamRecordsRequest(
    new Request("http://localhost/api/dreams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dreamText: "A dream.", dreamDate: "2026-05-30", analysis: createDreamAnalysisResponse() }),
    }),
    {
      getAuthenticatedUserId: async () => null,
      listDreamRecordsForUser: async () => [],
      persistCompletedDreamReading: async () => "db-dream-id",
    },
  );

  expect(response.status).toBe(401);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/app/api/dreams/route.test.ts
```

Expected: FAIL because `POST` persistence is not implemented.

**Step 3: Implement request validation**

Add a small validator in `frontend/src/app/api/dreams/route.ts`. Validate:

- body is an object
- `dreamText` string, 1 to 1000 chars
- `dreamDate` matches `YYYY-MM-DD`
- `catReaderType` optional enum
- `analysis` is an object with required fields:
  - `dreamId`
  - `analysisId`
  - `cardId`
  - `summary`
  - `interpretation`
  - `smallPrescription`
  - `reader`
  - `symbols`
  - `emotions`
  - `themes`
  - `readingBasis`
  - `card`

**Step 4: Implement route dependency**

Extend route dependencies:

```ts
export type DreamRecordsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  listDreamRecordsForUser?: (userId: string) => Promise<DreamRecord[]>;
  persistCompletedDreamReading?: (input: PersistCompletedDreamReadingInput) => Promise<string>;
};
```

Implement `POST` handling in `handleDreamRecordsRequest`.

**Step 5: Export POST**

```ts
export async function POST(request: Request): Promise<Response> {
  return handleDreamRecordsRequest(request);
}
```

**Step 6: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/app/api/dreams/route.test.ts
```

Expected: PASS.

**Step 7: Commit**

```bash
git add frontend/src/app/api/dreams/route.ts frontend/src/app/api/dreams/route.test.ts
git commit -m "feat: save latest receipt after login"
```

---

## Phase 3: Result CTA and Login Handoff

### Task 6: Add Result Save CTA for Guests

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Create: `frontend/src/components/receipt-save-cta.tsx`
- Test: `frontend/src/components/receipt-save-cta.test.tsx`

**Step 1: Write failing helper tests**

```ts
import { describe, expect, test } from "vitest";

import { createSaveReceiptLoginHref, getReceiptSaveCtaCopy } from "./receipt-save-cta";

describe("receipt save CTA", () => {
  test("links guests to auth with saveLatest handoff", () => {
    expect(createSaveReceiptLoginHref()).toBe("/auth?next=%2Fresult&saveLatest=1");
  });

  test("uses archive value copy", () => {
    expect(getReceiptSaveCtaCopy()).toContain("달력");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/components/receipt-save-cta.test.tsx
```

Expected: FAIL because component does not exist.

**Step 3: Implement CTA component**

Copy direction:

```tsx
export function getReceiptSaveCtaCopy(): string {
  return "오늘의 꿈 영수증이 완성됐어요. 로그인하면 이 꿈을 달력에 남기고, 다음 꿈들과 함께 모아볼 수 있어요.";
}

export function createSaveReceiptLoginHref(): string {
  return "/auth?next=%2Fresult&saveLatest=1";
}
```

UI requirements:

- Use an existing button primitive where possible.
- Text:
  - `오늘의 꿈 영수증이 완성됐어요.`
  - `로그인하면 이 꿈을 달력에 남기고, 다음 꿈들과 함께 모아볼 수 있어요.`
  - Button: `로그인하고 달력에 남기기`
- Show only when user is guest.

**Step 4: Wire into receipt page**

In `DreamResultReceipt`:

- Determine auth state via Supabase browser session or a small hook from `auth-session`.
- If guest, render `<ReceiptSaveCta />` below receipt actions.
- If authenticated, show saved state or no CTA.

**Step 5: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/components/receipt-save-cta.test.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/components/receipt-save-cta.tsx frontend/src/components/receipt-save-cta.test.tsx frontend/src/components/dream-result-receipt.tsx
git commit -m "feat: prompt guests to save receipt after login"
```

---

### Task 7: Auto-Save Latest Receipt After Login

**Files:**
- Modify: `frontend/src/components/dream-result-page-client.tsx`
- Create: `frontend/src/lib/save-latest-dream.ts`
- Test: `frontend/src/lib/save-latest-dream.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from "vitest";

import { saveLatestDreamToArchive } from "./save-latest-dream";

describe("save latest dream to archive", () => {
  test("posts a completed latest payload to /api/dreams", async () => {
    const calls: unknown[] = [];
    const result = await saveLatestDreamToArchive(createCompletedPayload(), async (url, init) => {
      calls.push({ url, init });
      return Response.json({ dreamId: "db-dream-id" }, { status: 201 });
    });

    expect(result).toEqual({ status: "saved", dreamId: "db-dream-id" });
    expect(calls).toHaveLength(1);
  });

  test("does not save unavailable payloads", async () => {
    const result = await saveLatestDreamToArchive(createUnavailablePayload(), async () => {
      throw new Error("should not be called");
    });

    expect(result).toEqual({ status: "not_completed" });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/save-latest-dream.test.ts
```

Expected: FAIL because helper does not exist.

**Step 3: Implement helper**

```ts
import type { LatestAnalysisPayload } from "./dream-storage";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function saveLatestDreamToArchive(payload: LatestAnalysisPayload | null, fetcher: FetchLike = fetch) {
  if (!payload || payload.status === "unavailable") {
    return { status: "not_completed" as const };
  }

  const response = await fetcher("/api/dreams", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    return { status: "unauthenticated" as const };
  }

  if (!response.ok) {
    return { status: "error" as const };
  }

  const body = (await response.json()) as { dreamId?: string };

  return { status: "saved" as const, dreamId: body.dreamId ?? "" };
}
```

**Step 4: Wire into result page**

In `DreamResultPageClient`:

- Read `useSearchParams()`.
- If `saveLatest=1`, call `saveLatestDreamToArchive(payload)`.
- Show a small saved/error status near the receipt.
- Clear `saveLatest` from URL after success using `router.replace("/result")`.

**Important:** Do not re-run dream analysis. This only saves the already produced receipt.

**Step 5: Run tests**

Run:

```bash
npm --prefix frontend test -- src/lib/save-latest-dream.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/lib/save-latest-dream.ts frontend/src/lib/save-latest-dream.test.ts frontend/src/components/dream-result-page-client.tsx
git commit -m "feat: save temporary receipt after login"
```

---

## Phase 4: Lock Archive and Calendar for Guests

### Task 8: Replace Guest Archive Records with Login CTA

**Files:**
- Modify: `frontend/src/lib/use-archive-dream-records.ts`
- Modify: `frontend/src/components/dream-archive-list.tsx`
- Modify: `frontend/src/components/archive-calendar.tsx`
- Create: `frontend/src/components/archive-login-gate.tsx`
- Test: `frontend/src/lib/use-archive-dream-records.test.ts`
- Test: `frontend/src/components/archive-login-gate.test.tsx`

**Step 1: Write failing hook tests**

Update `resolveArchiveDreamRecordState` expectations:

```ts
test("does not expose local dream records to guest archive", () => {
  const localRecords = [createRecord("local")];

  expect(resolveArchiveDreamRecordState(localRecords, { status: "guest", records: [] })).toMatchObject({
    source: "guest",
    dreamRecords: [],
    canViewArchive: false,
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/use-archive-dream-records.test.ts
```

Expected: FAIL because current fallback exposes local records.

**Step 3: Update hook state model**

Change:

```ts
export type ArchiveDreamRecordSource = "server" | "local";
```

to:

```ts
export type ArchiveDreamRecordSource = "server" | "guest" | "legacy_local";
```

Recommended final behavior:

- `server`: authenticated records from `/api/dreams`
- `guest`: no permanent records, show CTA
- `legacy_local`: optional dev-only or migration-only state, not default product path

For product default, missing session should produce:

```ts
{
  dreamRecords: [],
  source: "guest",
  isLoadingServerRecords: false,
  canViewArchive: false,
}
```

**Step 4: Add login gate component**

`ArchiveLoginGate` copy:

```tsx
export const archiveLoginGateTitle = "꿈 기록장은 로그인 후 열려요.";
export const archiveLoginGateBody =
  "꿈 영수증은 바로 볼 수 있지만, 달력에 남기고 반복되는 상징을 모으려면 계정이 필요해요.";
```

Button:

```tsx
<AssetTextButton href="/auth?next=%2Farchive" ...>
  로그인하고 기록장 열기
</AssetTextButton>
```

**Step 5: Wire UI**

- `DreamArchiveList`: if `source === "guest"`, render `ArchiveLoginGate`.
- `ArchiveCalendar`: if guest, show zero-count preview and a subtle locked state, not local records.

**Step 6: Run focused tests**

Run:

```bash
npm --prefix frontend test -- src/lib/use-archive-dream-records.test.ts src/components/archive-login-gate.test.tsx
```

Expected: PASS.

**Step 7: Commit**

```bash
git add frontend/src/lib/use-archive-dream-records.ts frontend/src/components/dream-archive-list.tsx frontend/src/components/archive-calendar.tsx frontend/src/components/archive-login-gate.tsx frontend/src/components/archive-login-gate.test.tsx
git commit -m "feat: gate archive behind login"
```

---

## Phase 5: Profile Auth State and Logout

### Task 9: Add Login Status to Profile

**Files:**
- Modify: `frontend/src/components/profile-room.tsx`
- Create: `frontend/src/components/account-status-card.tsx`
- Test: `frontend/src/components/account-status-card.test.tsx`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from "vitest";

import { getAccountStatusCopy } from "./account-status-card";

describe("account status card", () => {
  test("describes guest status", () => {
    expect(getAccountStatusCopy("guest").primaryActionLabel).toBe("로그인하기");
  });

  test("describes authenticated status", () => {
    expect(getAccountStatusCopy("authenticated").primaryActionLabel).toBe("로그아웃");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/components/account-status-card.test.tsx
```

Expected: FAIL.

**Step 3: Implement component**

Guest copy:

- Title: `아직 임시 손님 모드예요.`
- Body: `해몽은 받을 수 있지만, 꿈 기록장과 달력 저장은 로그인 후 사용할 수 있어요.`
- Button: `로그인하기`

Authenticated copy:

- Title: `계정에 꿈을 보관 중이에요.`
- Body: `해몽이 끝난 꿈은 자동으로 기록장과 달력에 남아요.`
- Button: `로그아웃`

**Step 4: Implement logout**

Use `createSupabaseBrowserClient().auth.signOut()`, then refresh UI and route to `/`.

**Step 5: Wire into `ProfileRoom`**

Place account card near the top, above `CatReaderPicker`.

**Step 6: Run tests**

Run:

```bash
npm --prefix frontend test -- src/components/account-status-card.test.tsx
```

Expected: PASS.

**Step 7: Commit**

```bash
git add frontend/src/components/account-status-card.tsx frontend/src/components/account-status-card.test.tsx frontend/src/components/profile-room.tsx
git commit -m "feat: show account status in profile"
```

---

## Phase 6: Pawprints, Seeds, and Symbol History Policy

### Task 10: Block Guest Pawprint and Seed Persistence

**Files:**
- Modify: `frontend/src/lib/pawprints.ts`
- Modify: `frontend/src/lib/dream-seed.ts`
- Modify callers in:
  - `frontend/src/components/dream-result-receipt.tsx`
  - seed-related components under `frontend/src/components/`
- Test:
  - `frontend/src/lib/pawprints.test.ts`
  - `frontend/src/lib/dream-seed.test.ts`

**Step 1: Write failing policy tests**

```ts
test("does not persist pawprints for guests", () => {
  expect(canPersistPawprint({ isAuthenticated: false })).toBe(false);
});

test("allows pawprints for authenticated users", () => {
  expect(canPersistPawprint({ isAuthenticated: true })).toBe(true);
});
```

Same pattern for dream seeds.

**Step 2: Run tests to verify failure**

Run:

```bash
npm --prefix frontend test -- src/lib/pawprints.test.ts src/lib/dream-seed.test.ts
```

Expected: FAIL until helpers exist.

**Step 3: Implement policy helpers**

```ts
export function canPersistPawprint(input: { isAuthenticated: boolean }): boolean {
  return input.isAuthenticated;
}
```

```ts
export function canPersistDreamSeed(input: { isAuthenticated: boolean }): boolean {
  return input.isAuthenticated;
}
```

**Step 4: Gate UI saves**

- If guest taps a pawprint/seed persistence action, show login CTA instead of writing to local storage.
- If authenticated, this phase can still use current local implementation only as temporary UI state, but product copy must say account storage is coming only if DB route is not implemented yet.

**Step 5: Commit**

```bash
git add frontend/src/lib/pawprints.ts frontend/src/lib/pawprints.test.ts frontend/src/lib/dream-seed.ts frontend/src/lib/dream-seed.test.ts frontend/src/components
git commit -m "feat: block guest routine persistence"
```

---

### Task 11: Add DB Tables and API for Pawprints and Seeds

**Files:**
- Create: `supabase/migrations/20260530000200_create_manyang_routine_records.sql`
- Create: `frontend/src/app/api/pawprints/route.ts`
- Create: `frontend/src/app/api/seeds/route.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Tests:
  - `frontend/src/lib/manyang-routine-schema.test.ts`
  - `frontend/src/app/api/pawprints/route.test.ts`
  - `frontend/src/app/api/seeds/route.test.ts`

**Step 1: Write schema test**

```ts
test("creates authenticated-only routine tables", () => {
  const sql = readFileSync(migrationPath, "utf8");

  expect(sql).toContain("create table if not exists manyang.pawprints");
  expect(sql).toContain("create table if not exists manyang.dream_seeds");
  expect(sql).toContain("alter table manyang.pawprints enable row level security");
  expect(sql).toContain("auth.uid()");
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix frontend test -- src/lib/manyang-routine-schema.test.ts
```

Expected: FAIL because migration does not exist.

**Step 3: Create migration**

Tables:

- `manyang.pawprints`
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid references auth.users(id) on delete cascade`
  - `app_date date not null`
  - `source text not null`
  - `source_id text`
  - `created_at timestamptz not null default now()`
  - unique `(user_id, app_date, source, source_id)`
- `manyang.dream_seeds`
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid references auth.users(id) on delete cascade`
  - `seed_date date not null`
  - `intent_id text not null`
  - `intent_label text not null`
  - `atmosphere text not null`
  - `note text`
  - `created_at timestamptz not null default now()`
  - unique `(user_id, seed_date)`

Enable RLS and own-user policies.

**Step 4: Add APIs**

- `GET /api/pawprints`
- `POST /api/pawprints`
- `GET /api/seeds`
- `POST /api/seeds`

Guest requests return 401.

**Step 5: Run tests**

Run:

```bash
npm --prefix frontend test -- src/lib/manyang-routine-schema.test.ts src/app/api/pawprints/route.test.ts src/app/api/seeds/route.test.ts
```

Expected: PASS.

**Step 6: Apply migration**

Use the same session-pooler `SUPABASE_DB_URL` flow used for the first `manyang` migration.

**Step 7: Commit**

```bash
git add supabase/migrations/20260530000200_create_manyang_routine_records.sql frontend/src/app/api/pawprints frontend/src/app/api/seeds frontend/src/lib/server/manyang-db.ts frontend/src/lib/manyang-routine-schema.test.ts
git commit -m "feat: store authenticated routine records"
```

---

## Phase 7: Monetization Gates

### Task 12: Tighten Guest, Free, and Moon Pass Gates

**Files:**
- Modify: `frontend/src/lib/access-policy.ts`
- Modify: `frontend/src/lib/access-policy.test.ts`
- Modify relevant UI:
  - `frontend/src/components/dream-entry-form.tsx`
  - `frontend/src/components/cat-reader-picker.tsx`
  - premium CTA components if present

**Step 1: Add policy tests**

```ts
test("guest can request basic reading but cannot request detailed reading", () => {
  expect(canRequestReading({
    accessPlan: "guest",
    readingKind: "basic",
    hasUsedBasicReadingToday: false,
  }).allowed).toBe(true);

  expect(canRequestReading({
    accessPlan: "guest",
    readingKind: "detailed",
    hasUsedBasicReadingToday: false,
  }).reason).toBe("detailed_locked");
});

test("moon pass can request detailed readings", () => {
  expect(canRequestReading({
    accessPlan: "moon_pass",
    readingKind: "detailed",
    hasUsedBasicReadingToday: true,
  }).allowed).toBe(true);
});
```

**Step 2: Run tests**

Run:

```bash
npm --prefix frontend test -- src/lib/access-policy.test.ts
```

Expected: PASS or targeted FAIL if copy/behavior changes are needed.

**Step 3: Update CTA copy**

Guest daily limit CTA:

```txt
로그인하고 매일 꿈 기록 남기기
```

Archive lock CTA:

```txt
로그인하고 기록장 열기
```

Moon Pass CTA:

```txt
쌓인 꿈을 더 깊게 읽기
```

**Step 4: Commit**

```bash
git add frontend/src/lib/access-policy.ts frontend/src/lib/access-policy.test.ts frontend/src/components
git commit -m "feat: align access gates with archive strategy"
```

---

## Phase 8: End-to-End Verification

### Task 13: Manual and Automated Smoke Verification

**Files:**
- No production file changes unless bugs are found.

**Step 1: Run full checks**

Run:

```bash
npm --prefix frontend test
npx tsc --noEmit
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected:

- All tests pass.
- TypeScript passes.
- ESLint passes.
- Build passes.

**Step 2: Guest flow browser check**

Run local server:

```bash
npm --prefix frontend run dev -- --port 3000
```

Open:

```txt
http://localhost:3000/write
```

Verify:

- Guest can submit a dream.
- Guest reaches `/result`.
- Receipt is visible.
- Share/download remains usable.
- Guest sees `로그인하고 달력에 남기기`.
- `/archive` shows login CTA, not permanent local records.
- Browser console has no `/api/dreams` 401 error spam.

**Step 3: Authenticated flow browser check**

Using a test Supabase Auth user:

- Sign in from `/auth`.
- Submit a basic dream.
- Confirm `/api/dreams/analyze` succeeds.
- Confirm DB row exists in `manyang.dream_entries`.
- Open `/archive`.
- Confirm dream appears in list and calendar.
- Open receipt from archive.
- Delete record.
- Confirm DB row disappears from archive.

**Step 4: Post-login save flow**

As guest:

- Submit dream.
- Reach result.
- Click `로그인하고 달력에 남기기`.
- Complete auth.
- Return to `/result?saveLatest=1`.
- Confirm save status appears.
- Open `/archive`.
- Confirm that exact receipt is saved.

**Step 5: Commit final fixes**

```bash
git add .
git commit -m "test: verify auth gated archive flow"
```

---

## Acceptance Criteria

- Guest dream results are never saved into permanent archive/calendar/history.
- Guest can still view receipt and share/download image.
- Guest archive page shows a login CTA, not a real record list.
- Authenticated analysis automatically persists to `manyang.dream_entries`, `dream_readings`, `dream_cards`, and `user_symbol_history`.
- Guest can save the just-created receipt after login without re-running the interpretation.
- Re-saving the same latest receipt does not create obvious duplicate UX. If duplicates still happen at DB level, add a follow-up task for `analysis_id` uniqueness or dream hash idempotency.
- Pawprints/seeds are not accumulated for guests.
- Moon Pass gates remain separate from basic archive login gates.

## Risks and Notes

- Client-submitted `analysis` for post-login save can be tampered with. For MVP this is acceptable if treated as user-owned archive content, but before production billing, add server-signed receipt tokens or idempotency keys.
- Existing local records from previous builds should not silently disappear without messaging. Prefer showing a one-time migration CTA only after login.
- Do not make guest fallback archive behavior too generous; it weakens the login reason.
- Do not re-run LLM after login to save a receipt. Different outputs for the same dream would damage trust.
- Keep DB credentials server-only. Never expose `SUPABASE_DB_URL` or secret keys to client code.
