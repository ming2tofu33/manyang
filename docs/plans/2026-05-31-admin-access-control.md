# Admin Access Control Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 관리자 계정은 실제 사용자 과금/일일 제한 정책과 분리해서 꿈해몽, 회색냥 상세 리딩, 반복 실험을 계속 실행할 수 있게 한다.

**Architecture:** 관리자 권한은 클라이언트가 보낸 값이나 localStorage가 아니라 서버가 신뢰하는 `manyang.profiles.role`에서만 판단한다. 해몽 API는 admin이면 일일 제한과 상세 리딩 잠금을 우회하지만, LLM 안전 정책과 입력 검증은 그대로 적용한다. 클라이언트는 별도 access-context API를 통해 admin 계정에만 실험용 UI 권한을 열고, 결과 영수증에는 admin 표시를 노출하지 않는다.

**Tech Stack:** Next.js Route Handlers, Supabase Postgres, `pg`, Vitest, TypeScript, Supabase Auth.

---

## Scope

이번 작업에서 할 것:

- `manyang.profiles.role`에 `user | admin` 권한을 추가한다.
- 서버 해몽 API에서 admin은 basic 하루 제한과 gray_cat 상세 잠금을 우회한다.
- 프론트 UI도 admin 계정에서는 Moon Pass처럼 gray_cat을 선택하고 일일 제한 없이 테스트할 수 있게 한다.
- admin 설정용 SQL/문서를 남긴다.

이번 작업에서 하지 않을 것:

- 별도 관리자 대시보드.
- 운영 사용자 데이터 전체 조회/수정 UI.
- admin 실험 결과를 자동으로 archive에서 제외하는 기능. 필요하면 다음 작업에서 `dream_entries.source = 'admin_lab'` 같은 별도 흐름으로 분리한다.

---

### Task 1: Access Policy에 Admin Bypass 개념 추가

**Files:**
- Modify: `frontend/src/lib/access-policy.ts`
- Modify: `frontend/src/lib/access-policy.test.ts`

**Step 1: Write the failing tests**

`frontend/src/lib/access-policy.test.ts`에 아래 케이스를 추가한다.

```ts
test("allows any reading when access gate is bypassed", () => {
  expect(
    canRequestReading({
      accessPlan: "free_account",
      readingKind: "detailed",
      hasUsedBasicReadingToday: true,
      bypassAccessGate: true,
    }),
  ).toEqual({
    allowed: true,
    reason: "allowed",
    ctaLabel: null,
    message: null,
  });
});

test("keeps daily-only bypass limited to basic readings", () => {
  expect(
    canRequestReading({
      accessPlan: "free_account",
      readingKind: "detailed",
      hasUsedBasicReadingToday: false,
      bypassDailyLimit: true,
    }).reason,
  ).toBe("detailed_locked");
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/access-policy.test.ts
```

Expected: FAIL because `bypassAccessGate` does not exist yet.

**Step 3: Write minimal implementation**

In `frontend/src/lib/access-policy.ts`:

```ts
export type AccessRole = "user" | "admin";

export type ReadingGateInput = {
  accessPlan: AccessPlan;
  readingKind: ReadingKind;
  hasUsedBasicReadingToday: boolean;
  bypassDailyLimit?: boolean;
  bypassAccessGate?: boolean;
};

export function canRequestReading(input: ReadingGateInput): ReadingGateResult {
  if (input.bypassAccessGate === true) {
    return allowedResult;
  }

  // existing detailed/basic logic stays below
}
```

Keep `bypassDailyLimit` as a narrower dev/free-basic concept. Admin uses `bypassAccessGate`.

**Step 4: Run test to verify it passes**

Run:

```powershell
npm --prefix frontend test -- src/lib/access-policy.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/lib/access-policy.ts frontend/src/lib/access-policy.test.ts
git commit -m "feat: add admin access gate bypass policy"
```

---

### Task 2: Profile Role Migration과 DB Helper 추가

**Files:**
- Create: `supabase/migrations/20260531000100_add_manyang_profile_role.sql`
- Modify: `frontend/src/lib/server/manyang-db.ts`

**Step 1: Write the failing helper test**

If there is no DB-helper test file yet, create:

- Create: `frontend/src/lib/server/manyang-db.test.ts`

Test with a fake pool:

```ts
import { describe, expect, test, vi } from "vitest";

import { isAdminUser } from "./manyang-db";

describe("manyang db access helpers", () => {
  test("returns true when profile role is admin", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ is_admin: true }] })),
    };

    await expect(isAdminUser("user-1", pool as never)).resolves.toBe(true);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("manyang.profiles"), ["user-1"]);
  });

  test("returns false when profile role is missing or user", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ is_admin: false }] })),
    };

    await expect(isAdminUser("user-1", pool as never)).resolves.toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts
```

Expected: FAIL because `isAdminUser` is not exported.

**Step 3: Add migration**

Create `supabase/migrations/20260531000100_add_manyang_profile_role.sql`:

```sql
alter table manyang.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'manyang.profiles'::regclass
  ) then
    alter table manyang.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end $$;

create index if not exists profiles_role_idx
  on manyang.profiles (role);
```

**Step 4: Add DB helper**

In `frontend/src/lib/server/manyang-db.ts`:

```ts
export async function isAdminUser(userId: string, pool = getManyangDbPool()): Promise<boolean> {
  const result = await pool.query<{ is_admin: boolean }>(
    `
      select exists (
        select 1
        from manyang.profiles
        where user_id = $1
          and role = 'admin'
      ) as is_admin
    `,
    [userId],
  );

  return result.rows[0]?.is_admin === true;
}
```

Do not read admin from user metadata or request body.

**Step 5: Run test to verify it passes**

Run:

```powershell
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add supabase/migrations/20260531000100_add_manyang_profile_role.sql frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts
git commit -m "feat: add server-trusted admin profile role"
```

---

### Task 3: Dream Analyze API에서 Admin 제한 우회

**Files:**
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Step 1: Write failing route tests**

Add two route tests:

```ts
test("allows an admin to run a second basic reading on the same day", async () => {
  const analyzeDream = vi.fn(() => completedAnalysisFixture);

  const response = await handleDreamAnalyzeRequest(createAnalyzeRequest({
    dreamText: "오늘 또 다른 꿈을 꾸었어.",
    dreamDate: "2026-05-31",
    catReaderType: "black_cat",
  }), {
    getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
    getAccessPlanForUser: async () => "free_account",
    isAdminUser: async () => true,
    hasCompletedBasicReadingForUserOnDate: async () => true,
    analyzeDream,
  } as never);

  expect(response.status).toBe(200);
});

test("allows an admin to request gray cat detailed reading without Moon Pass", async () => {
  const response = await handleDreamAnalyzeRequest(createAnalyzeRequest({
    dreamText: "회색 복도에서 문을 찾는 꿈.",
    dreamDate: "2026-05-31",
    catReaderType: "gray_cat",
  }), {
    getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
    getAccessPlanForUser: async () => "free_account",
    isAdminUser: async () => true,
  } as never);

  expect(response.status).not.toBe(403);
});
```

Use the existing test helpers and fixture names in the file instead of inventing new ones if they already exist.

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts
```

Expected: FAIL because route dependencies do not include `isAdminUser` and gate does not bypass.

**Step 3: Implement route dependency**

In `frontend/src/app/api/dreams/analyze/route.ts`:

- import DB helper:

```ts
import { isAdminUser as isAdminUserFromDb } from "@/lib/server/manyang-db";
```

- extend dependency type:

```ts
isAdminUser?: (userId: string) => Promise<boolean>;
```

- add default:

```ts
isAdminUser: isAdminUserFromDb,
```

- resolve admin after `userId`:

```ts
const isAdmin = userId ? await resolvedDependencies.isAdminUser(userId) : false;
```

- pass bypass:

```ts
const readingGate = canRequestReading({
  accessPlan,
  readingKind,
  hasUsedBasicReadingToday,
  bypassAccessGate: isAdmin,
});
```

Keep safety policy, request validation, provider failure handling, and persistence behavior unchanged.

**Step 4: Run test to verify it passes**

Run:

```powershell
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/analyze/route.test.ts
git commit -m "feat: let admins bypass dream reading gates"
```

---

### Task 4: Server Access Context API 추가

**Files:**
- Create: `frontend/src/app/api/access-context/route.ts`
- Create: `frontend/src/app/api/access-context/route.test.ts`

**Step 1: Write failing API tests**

Create tests for:

- guest returns `{ accessPlan: "guest", role: "user", bypassDailyLimit: false, bypassAccessGate: false }`
- regular login returns session plan and user role
- admin login returns `{ accessPlan: "moon_pass", role: "admin", bypassDailyLimit: true, bypassAccessGate: true }`

Example shape:

```ts
test("returns admin access context from server-trusted role", async () => {
  const response = await handleAccessContextRequest({
    getAuthenticatedUserId: async () => "user-1",
    getAccessPlanForUser: async () => "free_account",
    isAdminUser: async () => true,
  });

  await expect(response.json()).resolves.toEqual({
    accessPlan: "moon_pass",
    role: "admin",
    bypassDailyLimit: true,
    bypassAccessGate: true,
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/app/api/access-context/route.test.ts
```

Expected: FAIL because the route does not exist.

**Step 3: Implement route**

Implement a handler with dependency injection:

```ts
export type AccessContextRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  getAccessPlanForUser?: (userId: string | null) => Promise<AccessPlan>;
  isAdminUser?: (userId: string) => Promise<boolean>;
};

export async function handleAccessContextRequest(dependencies: AccessContextRouteDependencies = {}): Promise<Response> {
  const userId = await resolved.getAuthenticatedUserId();

  if (!userId) {
    return Response.json({
      accessPlan: "guest",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    });
  }

  const isAdmin = await resolved.isAdminUser(userId);
  const accessPlan = isAdmin ? "moon_pass" : await resolved.getAccessPlanForUser(userId);

  return Response.json({
    accessPlan,
    role: isAdmin ? "admin" : "user",
    bypassDailyLimit: isAdmin,
    bypassAccessGate: isAdmin,
  });
}
```

The GET export should call `handleAccessContextRequest()`.

**Step 4: Run test to verify it passes**

Run:

```powershell
npm --prefix frontend test -- src/app/api/access-context/route.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add frontend/src/app/api/access-context/route.ts frontend/src/app/api/access-context/route.test.ts
git commit -m "feat: expose server access context"
```

---

### Task 5: Client Access Hook에서 Admin Context 사용

**Files:**
- Modify: `frontend/src/lib/use-access-plan.ts`
- Modify: `frontend/src/lib/use-access-plan.test.ts`
- Modify: any UI tests that assert access state shape if needed.

**Step 1: Write failing tests**

Add pure resolver tests before wiring fetch:

```ts
test("uses server admin context over session fallback", () => {
  expect(
    resolveClientAccessState(
      { user: { id: "user-1" } },
      null,
      "production",
      {
        accessPlan: "moon_pass",
        role: "admin",
        bypassDailyLimit: true,
        bypassAccessGate: true,
      },
    ),
  ).toEqual({
    accessPlan: "moon_pass",
    role: "admin",
    bypassDailyLimit: true,
    bypassAccessGate: true,
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix frontend test -- src/lib/use-access-plan.test.ts
```

Expected: FAIL because `ClientAccessState` has no role/context field.

**Step 3: Extend client state**

In `frontend/src/lib/use-access-plan.ts`:

```ts
export type ClientAccessState = {
  accessPlan: AccessPlan;
  role: AccessRole;
  bypassDailyLimit: boolean;
  bypassAccessGate: boolean;
};
```

Rules:

- no session: guest/user/no bypass
- server context present: use it
- dev localStorage override still works outside production
- production never trusts localStorage

**Step 4: Wire fetch**

In `useAccessPlan`, after Supabase session resolves:

- if no session, use guest state
- if session exists, fetch `/api/access-context`
- if fetch fails, fallback to session metadata access plan with `role: "user"`

Do not send admin role from client to the analyze route. The route must check DB again.

**Step 5: Run tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/use-access-plan.test.ts
npm --prefix frontend test -- src/components/dream-entry-form.test.tsx
```

Expected: PASS. If `dream-entry-form.test.tsx` does not exist, run the closest form/component test that imports `useAccessPlan`.

**Step 6: Commit**

```powershell
git add frontend/src/lib/use-access-plan.ts frontend/src/lib/use-access-plan.test.ts
git commit -m "feat: use server access context in client gates"
```

---

### Task 6: Admin 설정 문서 추가

**Files:**
- Create: `docs/admin-access.md`
- Optional Create: `supabase/admin-set-user-role.example.sql`

**Step 1: Write setup document**

Document:

- admin은 `manyang.profiles.role = 'admin'`으로만 부여한다.
- 클라이언트 `user_metadata`는 admin 판단에 쓰지 않는다.
- admin도 안전 정책과 입력 검증은 우회하지 않는다.
- admin 해몽 결과는 현재 일반 archive에 저장된다.

Example SQL:

```sql
insert into manyang.profiles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id) do update
set role = 'admin',
    updated_at = now();
```

Rollback SQL:

```sql
update manyang.profiles
set role = 'user',
    updated_at = now()
where user_id = 'USER_UUID_HERE';
```

**Step 2: Commit**

```powershell
git add docs/admin-access.md supabase/admin-set-user-role.example.sql
git commit -m "docs: document admin access setup"
```

---

### Task 7: Apply Migration and Mark Current Admin

**Files:**
- No app source changes expected.

**Step 1: Apply migration to Supabase**

Use the project DB connection string already configured in `frontend/.env`. Do not print secrets.

Run an idempotent migration application using the existing DB connection approach:

```powershell
@'
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const envPath = path.join(process.cwd(), "frontend", ".env");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
    })
);

const connectionString = env.SUPABASE_DB_URL || env.DATABASE_URL || env.POSTGRES_URL;
if (!connectionString) throw new Error("Missing Supabase DB connection string");

const sql = fs.readFileSync(
  path.join(process.cwd(), "supabase", "migrations", "20260531000100_add_manyang_profile_role.sql"),
  "utf8"
);

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
pool.query(sql)
  .then(() => console.log(JSON.stringify({ ok: true })))
  .finally(() => pool.end());
'@ | node
```

Expected: `{ "ok": true }`.

**Step 2: Set admin user**

Find the Supabase auth user UUID for the owner account, then run:

```sql
insert into manyang.profiles (user_id, role)
values ('OWNER_USER_UUID', 'admin')
on conflict (user_id) do update
set role = 'admin',
    updated_at = now();
```

If the implementation needs Codex to run this, the UUID must be supplied or discovered from the authenticated account context.

**Step 3: Verify role**

```sql
select user_id, role, access_plan
from manyang.profiles
where user_id = 'OWNER_USER_UUID';
```

Expected: one row with `role = 'admin'`.

---

### Task 8: Full Verification

**Files:**
- No source changes expected unless tests reveal issues.

**Step 1: Focused tests**

Run:

```powershell
npm --prefix frontend test -- src/lib/access-policy.test.ts
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts
npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts
npm --prefix frontend test -- src/app/api/access-context/route.test.ts
npm --prefix frontend test -- src/lib/use-access-plan.test.ts
```

Expected: PASS.

**Step 2: Frontend typecheck**

Run:

```powershell
Push-Location frontend
npx tsc --noEmit
Pop-Location
```

Expected: exit 0.

**Step 3: Full frontend suite**

Run:

```powershell
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected: PASS.

**Step 4: Backend safety check**

Run:

```powershell
npm --prefix backend test
npm --prefix backend run typecheck
```

Expected: PASS.

**Step 5: Whitespace check**

Run:

```powershell
git diff --check
```

Expected: no errors. Existing CRLF warnings may appear, but no whitespace errors should be introduced.

**Step 6: Manual admin smoke**

With the owner account logged in:

1. Run a basic dream reading once.
2. Run another basic dream reading on the same date.
3. Select gray_cat and request a detailed reading.

Expected:

- normal/free users still see daily and detailed gates
- admin gets successful readings
- result receipt does not show an admin badge
- safety notices still appear for safety-sensitive input

**Step 7: Final commit**

If previous task commits were skipped, commit the full scope now:

```powershell
git add frontend/src/lib/access-policy.ts frontend/src/lib/access-policy.test.ts `
  frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts `
  frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/analyze/route.test.ts `
  frontend/src/app/api/access-context/route.ts frontend/src/app/api/access-context/route.test.ts `
  frontend/src/lib/use-access-plan.ts frontend/src/lib/use-access-plan.test.ts `
  supabase/migrations/20260531000100_add_manyang_profile_role.sql `
  docs/admin-access.md supabase/admin-set-user-role.example.sql

git commit -m "feat: add admin access controls"
```

---

## Acceptance Criteria

- Admin role is stored only in server-trusted DB state.
- Guest/free/Moon Pass behavior remains unchanged for non-admin users.
- Admin can run repeated basic readings on the same date.
- Admin can run gray_cat detailed readings without needing Moon Pass metadata.
- Admin bypass does not skip LLM safety policy, request validation, unavailable handling, or persistence.
- Client UI lets admin test the gated flows without localStorage dev override.
- Tests cover policy, DB helper, analyze route, access-context route, and client access state.
