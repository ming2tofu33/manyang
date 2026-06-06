# Tarot Cost / Observability / Rate-Limit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 타로 리딩 API에 (②) 기존 리딩 단락으로 LLM 재호출 비용 제거, (③) LLM 실패 서버 로깅, (④) 게스트 일일 레이트리밋을 추가한다.

**Architecture:** 세 기능 모두 `frontend/src/app/api/tarot/readings/route.ts` 한 곳에 집중되며, 이미 검증된 `dreams/analyze/route.ts` 패턴을 그대로 따른다 — 의존성 주입(DI) 객체에 함수를 꽂고, 핸들러 안에서 "단락 → 게이트 → 프로바이더 → 생성 → 영속화" 순서로 흐른다. 새 DB 조회 함수 1개를 추가하고, 게스트 쿠키 처리는 공용 모듈로 추출해 dream/tarot가 공유한다. ④의 사용량 집계는 이미 존재하는 `manyang.reading_usage` 테이블과 `hasReadingUsageForGuestOnDate`/`incrementReadingUsageForGuest`를 재사용한다.

**Tech Stack:** Next.js 16 (App Router, route handlers), TypeScript, `pg`(Postgres), Vitest. 테스트·린트는 모두 `frontend/` 디렉터리에서 실행.

---

## 배경: 왜 이렇게 설계하는가

읽고 시작하기 전 반드시 이해할 핵심 사실:

1. **타로 리딩은 (user, app_date, spread) 당 결정론적으로 1개다.** DB `manyang.tarot_readings`에 `unique (user_id, app_date, spread)` 제약이 있고 `persistCompletedTarotReading`이 upsert한다. 즉 로그인 유저는 같은 날 같은 스프레드를 다시 요청해도 **결과가 같아야 한다** → ② 단락으로 LLM을 안 부르고 저장된 걸 그대로 돌려주면 된다.
2. **비용 구멍은 게스트다.** 게스트(userId 없음)는 리딩이 DB에 저장되지 않으므로 ② 단락이 적용되지 않는다. 현재 게스트는 1장 리딩 LLM을 **무제한** 호출할 수 있다 → ④ 레이트리밋이 필요한 대상은 게스트뿐. (로그인 유저는 ②가 하루 최대 2회(1장+3장)로 묶어준다.)
3. **선례를 그대로 따른다.** `dreams/analyze/route.ts`가 이미 ②(`findExistingReadingBestEffort`), ④(게스트 쿠키 + `hasCompletedGuestBasicReadingOnDate`)를 구현해 두었다. 같은 모양으로 작성하면 리뷰·테스트가 쉽다.
4. **모든 신규 협력자는 DI로 주입한다.** `TarotReadingsRouteDependencies`에 함수를 추가하고 `handleTarotReadingRequest`의 `resolvedDependencies` 기본값에 실제 구현을 꽂는다. 테스트는 가짜 함수를 주입한다. (기존 route.test.ts가 이미 이 방식.)
5. **백엔드 변경 없음.** `generateTarotReadingForUser`는 이미 `onProviderError` 콜백 옵션을 받는다(③에서 사용). `@manyang/backend`는 건드리지 않는다.

**작업 디렉터리:** 모든 명령은 `frontend/`에서 실행한다.
- 단일 테스트: `npm test -- <상대경로>`
- 전체 테스트: `npm test`
- 린트: `npm run lint`

각 Task 끝에서 커밋한다. 커밋 메시지 푸터:
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

---

## Task 1: DB — 기존 타로 리딩 조회 함수 (② 토대)

저장된 리딩을 (user, date, spread)로 1개 집어오는 함수. 기존 `findCompletedReadingForUserDreamOnDate`(꿈)와 동일한 형태.

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts` (`listTarotReadingsForUser` 정의 바로 위, 약 225번째 줄 근처에 추가)
- Test: `frontend/src/lib/server/manyang-db.test.ts`

**Step 1: 실패하는 테스트 작성**

`manyang-db.test.ts` 상단 import에 `findCompletedTarotReadingForUser`를 추가하고("lists tarot readings for a user" 테스트 근처에) 다음을 추가:

```ts
  test("returns the stored tarot reading for a user, date, and spread", async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [{ raw_reading: { id: "daily-tarot-daily_one_card-2026-06-05", appDate: "2026-06-05" } }],
      })),
    };

    await expect(
      findCompletedTarotReadingForUser(
        "user-1",
        "2026-06-05",
        "daily_one_card",
        pool as never,
      ),
    ).resolves.toEqual({ id: "daily-tarot-daily_one_card-2026-06-05", appDate: "2026-06-05" });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("from manyang.tarot_readings"), [
      "user-1",
      "2026-06-05",
      "daily_one_card",
    ]);
  });

  test("returns null when no tarot reading exists for the user, date, and spread", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [] })),
    };

    await expect(
      findCompletedTarotReadingForUser("user-1", "2026-06-05", "daily_three_card", pool as never),
    ).resolves.toBeNull();
  });
```

**Step 2: 실패 확인**

Run: `npm test -- src/lib/server/manyang-db.test.ts`
Expected: FAIL — `findCompletedTarotReadingForUser is not exported` / is not a function.

**Step 3: 최소 구현**

`manyang-db.ts`에서 `import type { DailyTarotReading } ...`와 `TarotSpread`가 필요하다. 파일 상단 import에 `TarotSpread`를 추가한다:

```ts
import type { DailyTarotReading, TarotSpread } from "@/lib/daily-tarot";
```

(기존 줄 `import type { DailyTarotReading } from "@/lib/daily-tarot";`를 위 형태로 교체.)

`listTarotReadingsForUser` 정의 바로 위에 추가:

```ts
/**
 * 같은 유저가 같은 날 같은 스프레드로 이미 받은 타로 리딩이 있으면 그대로 돌려준다.
 * 타로 리딩은 (user, app_date, spread)당 결정론적으로 1개이므로, 재요청 시 LLM을
 * 다시 부르지 않고 저장본을 반환해 비용을 아낀다(같은 날 → 같은 리딩).
 */
export async function findCompletedTarotReadingForUser(
  userId: string,
  appDate: string,
  spread: TarotSpread,
  pool = getManyangDbPool(),
): Promise<DailyTarotReading | null> {
  const result = await pool.query<{ raw_reading: DailyTarotReading }>(
    `
      select raw_reading
      from manyang.tarot_readings
      where user_id = $1
        and app_date = $2::date
        and spread = $3
      limit 1
    `,
    [userId, appDate, spread],
  );

  return result.rows[0]?.raw_reading ?? null;
}
```

**Step 4: 통과 확인**

Run: `npm test -- src/lib/server/manyang-db.test.ts`
Expected: PASS (신규 2개 포함 전체 통과).

**Step 5: 커밋**

```bash
git add frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts
git commit -m "feat(tarot): add findCompletedTarotReadingForUser db query"
```

---

## Task 2: 라우트 ② — 로그인 유저 기존 리딩 단락

LLM/프로바이더에 닿기 전에, 로그인 유저(어드민 제외)가 이미 받은 리딩이 있으면 그대로 반환한다.

**Files:**
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Test: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: 실패하는 테스트 작성**

`route.test.ts`의 `describe` 블록 안에 추가:

```ts
  test("returns the existing reading without calling the LLM for returning users", async () => {
    const existingReading = {
      id: "daily-tarot-daily_one_card-2026-05-31",
      spread: "daily_one_card",
      source: "llm",
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T09:00:00.000Z",
      card: { id: 0 },
      orientation: "upright",
      position: "today",
      cards: [{ position: "today", orientation: "upright", card: { id: 0 } }],
      keywords: ["start"],
      title: "stored title",
      message: "stored overview",
      advice: "stored advice",
      generated: generatedOneCard,
    };
    const generateTarotReadingForUser = vi.fn();
    const findCompletedTarotReadingForUser = vi.fn(async () => existingReading);
    const persistCompletedTarotReading = vi.fn();

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => false,
      findCompletedTarotReadingForUser,
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: existingReading.id, source: "llm" });
    expect(findCompletedTarotReadingForUser).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "2026-05-31",
      "daily_one_card",
    );
    expect(generateTarotReadingForUser).not.toHaveBeenCalled();
    expect(persistCompletedTarotReading).not.toHaveBeenCalled();
  });

  test("regenerates for admins so they can retest", async () => {
    const findCompletedTarotReadingForUser = vi.fn(async () => ({ id: "stale" }));
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedOneCard,
    }));

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => true,
      findCompletedTarotReadingForUser,
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
      persistCompletedTarotReading: async () => undefined,
    });

    expect(response.status).toBe(200);
    expect(findCompletedTarotReadingForUser).not.toHaveBeenCalled();
    expect(generateTarotReadingForUser).toHaveBeenCalled();
  });
```

**Step 2: 실패 확인**

Run: `npm test -- src/app/api/tarot/readings/route.test.ts`
Expected: FAIL — `findCompletedTarotReadingForUser`는 아직 단락하지 않으므로 `generateTarotReadingForUser`가 호출됨 / 주입한 의존성이 타입에 없음.

**Step 3: 구현**

(a) import에 새 DB 함수 추가 — 기존 `manyang-db` import 블록 수정:

```ts
import {
  persistCompletedTarotReading,
  findCompletedTarotReadingForUser,
  isAdminUser as isAdminUserFromDb,
  type PersistCompletedTarotReadingInput,
} from "@/lib/server/manyang-db";
```

(b) `TarotReadingsRouteDependencies` 타입에 추가:

```ts
  findCompletedTarotReadingForUser?: (
    userId: string,
    appDate: string,
    spread: TarotSpread,
  ) => Promise<DailyTarotReading | null>;
```

(c) best-effort 헬퍼 추가 (`handleTarotReadingRequest` 위, `persistCompletedTarotReadingBestEffort` 근처):

```ts
async function findExistingTarotReadingBestEffort(
  userId: string,
  appDate: string,
  spread: TarotSpread,
  find: (userId: string, appDate: string, spread: TarotSpread) => Promise<DailyTarotReading | null>,
): Promise<DailyTarotReading | null> {
  try {
    return await find(userId, appDate, spread);
  } catch {
    return null;
  }
}
```

(d) `resolvedDependencies` 기본값에 `findCompletedTarotReadingForUser,` 추가.

(e) 핸들러 안, `isAdmin` 계산 직후(3-card 접근 게이트 **앞**)에 단락 삽입:

```ts
  const isAdmin = userId ? await resolvedDependencies.isAdminUser(userId) : false;

  // 재요청 단락: 로그인 유저가 같은 날 같은 스프레드로 이미 받은 리딩이 있으면
  // LLM을 다시 부르지 않고 저장본을 그대로 돌려준다(같은 날 → 같은 리딩, 추가 비용 없음).
  // 어드민은 재테스트를 위해 통과시킨다.
  if (userId && !isAdmin) {
    const existingReading = await findExistingTarotReadingBestEffort(
      userId,
      validatedBody.value.appDate,
      validatedBody.value.spread,
      resolvedDependencies.findCompletedTarotReadingForUser,
    );

    if (existingReading) {
      return Response.json(existingReading);
    }
  }
```

**Step 4: 통과 확인**

Run: `npm test -- src/app/api/tarot/readings/route.test.ts`
Expected: PASS (신규 2개 + 기존 전부).

**Step 5: 커밋**

```bash
git add frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(tarot): short-circuit existing readings to avoid duplicate LLM calls"
```

---

## Task 3: 라우트 ③ — LLM 실패 서버 로깅(관측성)

현재 LLM 타임아웃/무효응답/프로바이더 누락이 서버에 흔적 없이 사라진다. 구조화된 로그를 남기고, 테스트에서 검증할 수 있게 주입형으로 만든다.

**Files:**
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Test: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: 실패하는 테스트 작성**

`route.test.ts`에 추가:

```ts
  test("logs an observability event when the reading is unavailable", async () => {
    const logTarotEvent = vi.fn();
    const generateTarotReadingForUser = vi.fn(async (_input, options) => {
      options?.onProviderError?.(new Error("boom"));
      return { status: "unavailable" as const, reason: "timeout" as const, retryable: true };
    });

    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => false,
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => ({ generateJson: async () => ({}) }),
      generateTarotReadingForUser,
      persistCompletedTarotReading: async () => undefined,
      logTarotEvent,
    });

    expect(response.status).toBe(503);
    expect(logTarotEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "provider_error", spread: "daily_one_card" }),
    );
    expect(logTarotEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "unavailable", reason: "timeout", spread: "daily_one_card" }),
    );
  });

  test("logs an observability event when the provider is missing", async () => {
    const logTarotEvent = vi.fn();
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      getAccessPlanForUser: async () => "free_account",
      isAdminUser: async () => false,
      findCompletedTarotReadingForUser: async () => null,
      createProvider: () => undefined,
      logTarotEvent,
    });

    expect(response.status).toBe(503);
    expect(logTarotEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "unavailable", reason: "provider_missing" }),
    );
  });
```

**Step 2: 실패 확인**

Run: `npm test -- src/app/api/tarot/readings/route.test.ts`
Expected: FAIL — `logTarotEvent` 의존성/호출 없음.

**Step 3: 구현**

(a) `EnvLike` 타입 근처에 로그 이벤트 타입과 기본 로거 추가:

```ts
type TarotReadingLogEvent =
  | {
      type: "provider_error";
      spread: TarotSpread;
      appDate: string;
      authenticated: boolean;
      error: unknown;
    }
  | {
      type: "unavailable";
      reason: Extract<TarotReadingResult, { status: "unavailable" }>["reason"];
      retryable: boolean;
      spread: TarotSpread;
      appDate: string;
      authenticated: boolean;
    };

function logTarotReadingEvent(event: TarotReadingLogEvent): void {
  const base = {
    scope: "tarot_reading",
    type: event.type,
    spread: event.spread,
    appDate: event.appDate,
    authenticated: event.authenticated,
  };

  if (event.type === "provider_error") {
    console.error(JSON.stringify(base), event.error);
    return;
  }

  console.warn(JSON.stringify({ ...base, reason: event.reason, retryable: event.retryable }));
}
```

(b) `TarotReadingsRouteDependencies`에 추가:

```ts
  logTarotEvent?: (event: TarotReadingLogEvent) => void;
```

(c) `resolvedDependencies` 기본값에 `logTarotEvent: logTarotReadingEvent,` 추가.

(d) 프로바이더 누락(두 군데, 503 `provider_missing` 반환 직전)에 로그 추가. 두 곳 모두 `return Response.json(createUnavailablePayload("provider_missing", false), { status: 503 });` 앞에:

```ts
      resolvedDependencies.logTarotEvent({
        type: "unavailable",
        reason: "provider_missing",
        retryable: false,
        spread: validatedBody.value.spread,
        appDate: validatedBody.value.appDate,
        authenticated: Boolean(userId),
      });
```

(e) `generateTarotReadingForUser` 호출에 `onProviderError` 추가:

```ts
  const result = await resolvedDependencies.generateTarotReadingForUser(
    createTarotReadingInput(validatedBody.value, selections),
    {
      provider,
      providerTimeoutMs: resolveTarotLlmTimeoutMs(),
      onProviderError: (error) =>
        resolvedDependencies.logTarotEvent({
          type: "provider_error",
          spread: validatedBody.value.spread,
          appDate: validatedBody.value.appDate,
          authenticated: Boolean(userId),
          error,
        }),
    },
  );
```

(f) `if (result.status === "unavailable")` 블록 안, return 직전에:

```ts
  if (result.status === "unavailable") {
    resolvedDependencies.logTarotEvent({
      type: "unavailable",
      reason: result.reason,
      retryable: result.retryable,
      spread: validatedBody.value.spread,
      appDate: validatedBody.value.appDate,
      authenticated: Boolean(userId),
    });

    return Response.json(createUnavailablePayload(result.reason, result.retryable), { status: 503 });
  }
```

**Step 4: 통과 확인**

Run: `npm test -- src/app/api/tarot/readings/route.test.ts`
Expected: PASS.

**Step 5: 커밋**

```bash
git add frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(tarot): log llm provider failures for observability"
```

---

## Task 4: 공용 게스트 세션 유틸 추출 (④ 토대)

dream 라우트에 있는 게스트 쿠키 헬퍼를 공용 모듈로 추출한다. ④에서 tarot가 같은 쿠키(`manyang_guest_id`)를 공유해야 하기 때문이다. **이 Task에서는 새 파일만 만들고 dream 라우트는 건드리지 않는다**(회귀 위험 격리; dream 리팩터는 선택 Task 7).

**Files:**
- Create: `frontend/src/lib/server/guest-session.ts`
- Test: `frontend/src/lib/server/guest-session.test.ts`

**Step 1: 실패하는 테스트 작성**

`guest-session.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  createGuestIdCookie,
  guestIdCookieName,
  isValidGuestId,
  resolveGuestSession,
} from "./guest-session";

const validId = "00000000-0000-4000-8000-000000000abc";

function requestWithCookie(value: string): Request {
  return new Request("http://localhost/api/tarot/readings", {
    method: "POST",
    headers: { cookie: `${guestIdCookieName}=${value}` },
  });
}

describe("guest-session", () => {
  test("validates uuid-shaped guest ids", () => {
    expect(isValidGuestId(validId)).toBe(true);
    expect(isValidGuestId("nope")).toBe(false);
    expect(isValidGuestId(undefined)).toBe(false);
  });

  test("reuses an existing valid guest cookie without re-setting it", () => {
    const session = resolveGuestSession(requestWithCookie(validId), () => "unused");

    expect(session).toEqual({ guestId: validId, shouldSetCookie: false });
  });

  test("creates a new guest id when the cookie is missing or invalid", () => {
    const session = resolveGuestSession(requestWithCookie("garbage"), () => validId);

    expect(session).toEqual({ guestId: validId, shouldSetCookie: true });
  });

  test("builds an httpOnly cookie string", () => {
    const cookie = createGuestIdCookie(validId, { NODE_ENV: "production" });

    expect(cookie).toContain(`${guestIdCookieName}=${validId}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });
});
```

**Step 2: 실패 확인**

Run: `npm test -- src/lib/server/guest-session.test.ts`
Expected: FAIL — 모듈 없음.

**Step 3: 구현**

`guest-session.ts` (dream 라우트 51-161줄의 헬퍼를 그대로 옮김):

```ts
type EnvLike = Record<string, string | undefined>;

export const guestIdCookieName = "manyang_guest_id";
const guestIdCookieMaxAgeSeconds = 60 * 60 * 24 * 400;

export type GuestSession = {
  guestId: string;
  shouldSetCookie: boolean;
};

export function isValidGuestId(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export function getRequestCookie(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookiePart.trim().split("=");

    if (name === cookieName) {
      return valueParts.join("=");
    }
  }

  return undefined;
}

export function resolveGuestSession(request: Request, createGuestId: () => string): GuestSession {
  const existingGuestId = getRequestCookie(request, guestIdCookieName);

  if (isValidGuestId(existingGuestId)) {
    return { guestId: existingGuestId, shouldSetCookie: false };
  }

  return { guestId: createGuestId(), shouldSetCookie: true };
}

export function createGuestIdCookie(guestId: string, env: EnvLike = process.env): string {
  return [
    `${guestIdCookieName}=${guestId}`,
    "Path=/",
    `Max-Age=${guestIdCookieMaxAgeSeconds}`,
    "HttpOnly",
    "SameSite=Lax",
    env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
```

**Step 4: 통과 확인**

Run: `npm test -- src/lib/server/guest-session.test.ts`
Expected: PASS.

**Step 5: 커밋**

```bash
git add frontend/src/lib/server/guest-session.ts frontend/src/lib/server/guest-session.test.ts
git commit -m "feat(server): extract shared guest-session cookie helpers"
```

---

## Task 5: 라우트 ④ — 게스트 일일 레이트리밋

게스트(userId 없음)는 스프레드별로 하루 1회만 LLM 리딩을 받는다. 사용량은 기존 `manyang.reading_usage`(`tarot_one_card`/`tarot_three_card`)에 기록한다. 초과 시 429. 응답에는 게스트 쿠키를 심는다.

**Files:**
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Test: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: 실패하는 테스트 작성**

`route.test.ts`에 추가:

```ts
  test("rate-limits a guest who already used today's one-card reading", async () => {
    const generateTarotReadingForUser = vi.fn();
    const response = await handleTarotReadingRequest(createJsonRequest(createOneCardBody()), {
      getAuthenticatedUserId: async () => null,
      getAccessPlanForUser: async () => "guest",
      hasReadingUsageForGuestOnDate: async () => true,
      createGuestId: () => "00000000-0000-4000-8000-000000000abc",
      createProvider: () => ({ generateJson: async () => generatedOneCard }),
      generateTarotReadingForUser,
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ reason: "tarot_rate_limited" });
    expect(generateTarotReadingForUser).not.toHaveBeenCalled();
  });

  test("allows and records a guest's first one-card reading of the day", async () => {
    const incrementReadingUsageForGuest = vi.fn(async () => undefined);
    const generateTarotReadingForUser = vi.fn(async () => ({
      status: "ok" as const,
      reading: generatedOneCard,
    }));

    const response = await handleTarotReadingRequest(
      new Request("http://localhost/api/tarot/readings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "manyang_guest_id=00000000-0000-4000-8000-000000000abc",
        },
        body: JSON.stringify(createOneCardBody()),
      }),
      {
        getAuthenticatedUserId: async () => null,
        getAccessPlanForUser: async () => "guest",
        hasReadingUsageForGuestOnDate: async () => false,
        incrementReadingUsageForGuest,
        createProvider: () => ({ generateJson: async () => generatedOneCard }),
        generateTarotReadingForUser,
        persistCompletedTarotReading: async () => undefined,
      },
    );

    expect(response.status).toBe(200);
    expect(incrementReadingUsageForGuest).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000abc",
      "2026-05-31",
      "tarot_one_card",
    );
  });
```

**Step 2: 실패 확인**

Run: `npm test -- src/app/api/tarot/readings/route.test.ts`
Expected: FAIL — 새 의존성/429 경로 없음.

**Step 3: 구현**

(a) import 추가:

```ts
import { randomUUID } from "node:crypto";
```

`manyang-db` import 블록에 사용량 함수 추가:

```ts
import {
  persistCompletedTarotReading,
  findCompletedTarotReadingForUser,
  hasReadingUsageForGuestOnDate,
  incrementReadingUsageForGuest,
  isAdminUser as isAdminUserFromDb,
  type PersistCompletedTarotReadingInput,
  type ReadingUsageFeatureKey,
} from "@/lib/server/manyang-db";
```

게스트 세션 유틸 import:

```ts
import {
  createGuestIdCookie,
  resolveGuestSession,
  type GuestSession,
} from "@/lib/server/guest-session";
```

(b) `TarotReadingsRouteDependencies`에 추가:

```ts
  hasReadingUsageForGuestOnDate?: (
    guestId: string,
    usageDate: string,
    featureKey: ReadingUsageFeatureKey,
  ) => Promise<boolean>;
  incrementReadingUsageForGuest?: (
    guestId: string,
    usageDate: string,
    featureKey: ReadingUsageFeatureKey,
  ) => Promise<void>;
  createGuestId?: () => string;
```

(c) 쿠키를 심는 JSON 응답 헬퍼 + 스프레드→피처키 매핑 + best-effort 증가 헬퍼 추가:

```ts
function createJsonResponse(body: unknown, init?: ResponseInit, guestSession?: GuestSession | null): Response {
  const response = Response.json(body, init);

  if (guestSession?.shouldSetCookie) {
    response.headers.append("set-cookie", createGuestIdCookie(guestSession.guestId));
  }

  return response;
}

function tarotUsageFeatureKey(spread: TarotSpread): ReadingUsageFeatureKey {
  return spread === "daily_three_card" ? "tarot_three_card" : "tarot_one_card";
}

async function incrementGuestTarotUsageBestEffort(
  guestSession: GuestSession | null,
  appDate: string,
  spread: TarotSpread,
  increment: (guestId: string, usageDate: string, featureKey: ReadingUsageFeatureKey) => Promise<void>,
): Promise<void> {
  if (!guestSession) {
    return;
  }

  try {
    await increment(guestSession.guestId, appDate, tarotUsageFeatureKey(spread));
  } catch {
    // 리딩은 그대로 반환된다. 사용량 기록 실패가 사용자 경험을 막지 않는다.
  }
}
```

(d) `resolvedDependencies` 기본값에 추가:

```ts
    hasReadingUsageForGuestOnDate,
    incrementReadingUsageForGuest,
    createGuestId: randomUUID,
```

(e) **모든 응답을 `createJsonResponse`로 전환하며 `guestSession`을 흘려보낸다.** 핸들러를 다음 흐름으로 수정한다.

- 검증 실패(400)는 게스트 세션 결정 전이므로 기존 `Response.json` 유지.
- `isAdmin`/② 단락 직후, 3-card 게이트 **앞**에서 게스트 세션을 만든다:

```ts
  // 게스트만 레이트리밋 대상이다. 로그인 유저는 ②(기존 리딩 단락)이 하루 LLM 호출을 묶는다.
  const guestSession = userId ? null : resolveGuestSession(request, resolvedDependencies.createGuestId);
```

- 3-card 잠금 응답(403)을 `createJsonResponse(..., { status: 403 }, guestSession)`로 교체.
- 게스트 레이트리밋 게이트를 3-card 게이트 **뒤**, 프로바이더 생성 **앞**에 삽입:

```ts
  if (guestSession) {
    const featureKey = tarotUsageFeatureKey(validatedBody.value.spread);
    const alreadyUsed = await resolvedDependencies.hasReadingUsageForGuestOnDate(
      guestSession.guestId,
      validatedBody.value.appDate,
      featureKey,
    );

    if (alreadyUsed) {
      return createJsonResponse(
        {
          error: "tarot reading is rate limited",
          reason: "tarot_rate_limited",
          retryable: false,
          message: "오늘의 무료 타로는 이미 펼쳤어요. 내일 다시 만나요.",
        },
        { status: 429 },
        guestSession,
      );
    }
  }
```

- 프로바이더 누락 503 두 곳, unavailable 503, 그리고 최종 성공 200을 모두 `createJsonResponse(..., guestSession)`로 교체.
- 성공 경로에서 영속화 직후 게스트 사용량 증가:

```ts
  await persistCompletedTarotReadingBestEffort(
    userId,
    reading,
    resolvedDependencies.persistCompletedTarotReading,
  );
  await incrementGuestTarotUsageBestEffort(
    guestSession,
    validatedBody.value.appDate,
    validatedBody.value.spread,
    resolvedDependencies.incrementReadingUsageForGuest,
  );

  return createJsonResponse(reading, undefined, guestSession);
```

**주의:** ③에서 추가한 `logTarotEvent` 호출들은 그대로 두고, 그 아래 `return`만 `createJsonResponse`로 바꾼다.

**Step 4: 통과 확인**

Run: `npm test -- src/app/api/tarot/readings/route.test.ts`
Expected: PASS (신규 2개 + 기존 전부; 기존 로그인 유저 테스트는 `guestSession`이 null이라 영향 없음).

**Step 5: 커밋**

```bash
git add frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(tarot): rate-limit guest readings to once per spread per day"
```

---

## Task 6: 전체 검증

**Step 1: 타로 관련 전체 테스트**

Run: `npm test -- src/app/api/tarot src/lib/server`
Expected: PASS.

**Step 2: 전체 스위트 + 린트**

Run: `npm test`
Run: `npm run lint`
Expected: 둘 다 통과. 실패하면 해당 Task로 돌아가 수정 후 재커밋.

**Step 3: 커밋 (수정 사항이 있었다면)**

```bash
git add -A
git commit -m "test(tarot): verify cost/observability/rate-limit changes"
```

---

## Task 7 (선택): dream 라우트를 공용 게스트 유틸로 리팩터 (DRY 마무리)

`dreams/analyze/route.ts`의 로컬 게스트 헬퍼(`guestIdCookieName`, `isValidGuestId`, `getRequestCookie`, `resolveGuestSession`, `createGuestIdCookie`, `GuestSession`)를 삭제하고 Task 4의 `@/lib/server/guest-session`에서 import하도록 교체한다. `createJsonResponse`(dream 로컬)는 dream에 그대로 둔다(쿠키 유틸만 공유).

**Files:**
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`

**Step 1:** dream 라우트 51-52, 99-151줄의 중복 헬퍼/상수를 제거하고 import로 대체:

```ts
import {
  createGuestIdCookie,
  resolveGuestSession,
  type GuestSession,
} from "@/lib/server/guest-session";
```

(`guestIdCookieName`/`guestIdCookieMaxAgeSeconds` 로컬 상수, `isValidGuestId`/`getRequestCookie`/`resolveGuestSession`/`createGuestIdCookie` 로컬 함수, 로컬 `GuestSession` 타입 삭제.)

**Step 2: 회귀 테스트**

Run: `npm test -- src/app/api/dreams/analyze/route.test.ts`
Expected: PASS (동작 동일, 출처만 공용 모듈).

**Step 3: 커밋**

```bash
git add frontend/src/app/api/dreams/analyze/route.ts
git commit -m "refactor(dreams): use shared guest-session helpers"
```

---

## 완료 기준 체크리스트

- [ ] ② 로그인 유저 재요청 시 LLM 미호출, 저장본 반환 (어드민은 재생성)
- [ ] ③ `provider_error`/`unavailable`(timeout·invalid_response·provider_missing) 로그 발생
- [ ] ④ 게스트 스프레드별 하루 1회 제한, 초과 시 429, 성공 시 `reading_usage` 증가 + 쿠키 설정
- [ ] `npm test` 전체 통과
- [ ] `npm run lint` 통과

## 후속(이번 범위 밖)

- 게스트 레이트리밋 한도를 env로 조정 가능하게(현재 1회/일 고정).
- ① 로케일 연동(en) — 별도 작업.
- `reading_usage` 기반 일일 메트릭 집계 대시보드 — 별도 작업.
