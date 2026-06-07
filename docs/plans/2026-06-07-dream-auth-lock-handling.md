# Dream Auth Lock Handling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make dream analysis work reliably for logged-in users by preserving Supabase SSR auth cookies and surfacing server lock messages instead of a generic failure.

**Architecture:** Add a Next `proxy.ts` in `frontend/src` so Supabase can refresh auth cookies before route handlers read `auth.getUser()`. Keep the dream API policy unchanged, but update the client form to recognize `403 dream reading is locked` responses and display the server-provided message. Tests cover the user-visible error parsing and the required proxy export/matcher.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase SSR, Vitest, TypeScript.

---

### Task 1: Client Lock Response Handling

**Files:**
- Modify: `frontend/src/components/dream-entry-form.test.tsx`
- Modify: `frontend/src/components/dream-entry-form.tsx`

**Step 1: Write the failing test**

Add a test that dynamically reads `getDreamAnalyzeFailureMessage` from `dream-entry-form.tsx` and verifies:

```ts
expect(getDreamAnalyzeFailureMessage(403, {
  error: "dream reading is locked",
  reason: "guest_daily_limit",
  ctaLabel: "로그인하고 매일 꿈 기록 남기기",
  message: "오늘의 무료 꿈 영수증은 이미 받았어요. 로그인하면 매일 꿈 기록을 이어갈 수 있어요.",
})).toBe("오늘의 무료 꿈 영수증은 이미 받았어요. 로그인하면 매일 꿈 기록을 이어갈 수 있어요.");
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend
npm test -- src/components/dream-entry-form.test.tsx
```

Expected: FAIL because `getDreamAnalyzeFailureMessage` is not exported yet.

**Step 3: Write minimal implementation**

In `dream-entry-form.tsx`, add:

```ts
type DreamLockedApiResponse = {
  error: "dream reading is locked";
  reason: string;
  ctaLabel: string | null;
  message: string | null;
};

function isDreamLockedApiResponse(value: unknown): value is DreamLockedApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    body.error === "dream reading is locked" &&
    typeof body.reason === "string" &&
    (typeof body.ctaLabel === "string" || body.ctaLabel === null) &&
    (typeof body.message === "string" || body.message === null)
  );
}

export function getDreamAnalyzeFailureMessage(status: number, body: unknown): string | null {
  if (status === 403 && isDreamLockedApiResponse(body)) {
    return body.message ?? "지금은 이 꿈 해몽을 열 수 없어요.";
  }

  return null;
}
```

Then replace `throw new Error("analysis failed")` with:

```ts
const failureMessage = getDreamAnalyzeFailureMessage(response.status, responseBody);

if (failureMessage) {
  setError(failureMessage);
  saveDreamDraftToBrowser({
    dreamText: trimmedDreamText,
    catReaderType: requestCatReaderId,
    ...(wakeMood ? { wakeMood } : {}),
  });
  return;
}

throw new Error("analysis failed");
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend
npm test -- src/components/dream-entry-form.test.tsx
```

Expected: PASS.

---

### Task 2: Supabase SSR Proxy

**Files:**
- Create: `frontend/src/proxy.test.ts`
- Create: `frontend/src/proxy.ts`
- Create: `frontend/src/lib/supabase/proxy.ts`

**Step 1: Write the failing test**

Create `frontend/src/proxy.test.ts` that checks `frontend/src/proxy.ts` exists and exports:

```ts
expect(proxyModule.proxy).toBeTypeOf("function");
expect(proxyModule.config).toEqual({
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend
npm test -- src/proxy.test.ts
```

Expected: FAIL because `frontend/src/proxy.ts` does not exist.

**Step 3: Write minimal implementation**

Create `frontend/src/lib/supabase/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseBrowserConfig } from "./env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const config = getSupabaseBrowserConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
```

Create `frontend/src/proxy.ts`:

```ts
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend
npm test -- src/proxy.test.ts
```

Expected: PASS.

---

### Task 3: Verify Behavior and Build

**Files:**
- No additional files unless tests expose a gap.

**Step 1: Run focused API policy tests**

Run:

```bash
cd frontend
npm test -- src/app/api/dreams/analyze/route.test.ts src/app/api/access-context/route.test.ts src/lib/use-access-plan.test.ts
```

Expected: PASS. This confirms the API still gates only guests for `guest_daily_limit` and authenticated users remain allowed.

**Step 2: Run changed tests**

Run:

```bash
cd frontend
npm test -- src/components/dream-entry-form.test.tsx src/proxy.test.ts
```

Expected: PASS.

**Step 3: Run full frontend tests**

Run:

```bash
cd frontend
npm test
```

Expected: PASS.

**Step 4: Run production build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS. This confirms `proxy.ts` placement and Next 16 compilation.

---

### Task 4: Commit

**Files:**
- `docs/plans/2026-06-07-dream-auth-lock-handling.md`
- `frontend/src/components/dream-entry-form.test.tsx`
- `frontend/src/components/dream-entry-form.tsx`
- `frontend/src/proxy.test.ts`
- `frontend/src/proxy.ts`
- `frontend/src/lib/supabase/proxy.ts`

**Step 1: Review diff**

Run:

```bash
git diff -- docs/plans/2026-06-07-dream-auth-lock-handling.md frontend/src/components/dream-entry-form.test.tsx frontend/src/components/dream-entry-form.tsx frontend/src/proxy.test.ts frontend/src/proxy.ts frontend/src/lib/supabase/proxy.ts
```

Expected: Only the planned files changed.

**Step 2: Commit**

Run:

```bash
git add docs/plans/2026-06-07-dream-auth-lock-handling.md frontend/src/components/dream-entry-form.test.tsx frontend/src/components/dream-entry-form.tsx frontend/src/proxy.test.ts frontend/src/proxy.ts frontend/src/lib/supabase/proxy.ts
git commit -m "fix(dreams): preserve Supabase auth session"
```

Expected: Commit created.
