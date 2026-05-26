# Business Code Handoff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the MVP business layer after `ACCESS-01A` by wiring daily free-reading limits, dev plan simulation, login/detail CTAs, and local business-event measurement into the existing dream receipt flow.

**Architecture:** `frontend/src/lib/access-policy.ts` is already implemented and is the source of truth for `guest | free_account | moon_pass` access decisions. Continue Prototype Mode with localStorage-only usage and event helpers, then wire those helpers into `DreamEntryForm` and `DreamResultReceipt`. Do not add Supabase Auth, real checkout, real subscription state, or real detailed LLM generation in this plan.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, localStorage, existing mock analyze API, existing `access-policy` helper.

---

## Current State

Already done:

- `ACCESS-01A` is complete.
- `frontend/src/lib/access-policy.ts` exists.
- `AccessPlan` is only `guest | free_account | moon_pass`.
- `admin` is intentionally not a plan.
- Dev testing uses localStorage plan simulation:

```js
localStorage.setItem("manyang:dev-access-plan", "guest")
localStorage.setItem("manyang:dev-access-plan", "free_account")
localStorage.setItem("manyang:dev-access-plan", "moon_pass")
localStorage.setItem("manyang:dev-bypass-daily-limit", "true")
```

Remaining business code work:

- `ACCESS-01B`: daily reading usage storage
- `ACCESS-01C`: guest/free/moon-pass gate in dream submission
- `ACCESS-01D`: result login CTA
- `ACCESS-01E`: detailed reading interest CTA
- `ACCESS-01F`: local business event logging
- `ACCESS-01G`: verification

---

## Execution Checklist

- [ ] Implement `daily-reading-usage` storage and tests
- [ ] Implement `business-events` storage and tests
- [ ] Wire `DreamEntryForm` to access policy and daily usage
- [ ] Use dev override in `DreamEntryForm`
- [ ] Mark daily basic reading usage only after successful analysis
- [ ] Track `guest_daily_limit_hit`
- [ ] Add guest login CTA after result
- [ ] Track `guest_login_cta_clicked`
- [ ] Add detailed reading interest CTA after result
- [ ] Track `detailed_reading_interest_clicked`
- [ ] Verify guest, free account, moon pass, and bypass modes manually
- [ ] Run focused tests, full frontend tests, lint, build, backend tests/typecheck
- [ ] Update `vault/09-Implementation/plans/ACTIVE_SPRINT.md`

---

### Task 1: Daily Reading Usage Storage

**Files:**
- Create: `frontend/src/lib/daily-reading-usage.ts`
- Create: `frontend/src/lib/daily-reading-usage.test.ts`

**Step 1: Write the failing test**

Create tests for:

- `getReadingAppDate(new Date("2026-05-26T04:59:00+09:00"))` returns `2026-05-25`.
- `getReadingAppDate(new Date("2026-05-26T05:00:00+09:00"))` returns `2026-05-26`.
- `markBasicReadingUsed(storage, "guest", "2026-05-26")` makes `hasUsedBasicReadingToday(...)` true.
- `free_account` and `moon_pass` can be stored separately from `guest`.
- A different app date resets availability.
- Corrupted JSON returns an empty usage list.
- Browser helpers do nothing safely when `window` is unavailable.

Use a memory storage helper like existing tests in `frontend/src/lib/pawprints.test.ts`.

**Step 2: Run RED**

Run:

```powershell
cd frontend
npm test -- daily-reading-usage.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement storage**

Implement:

```ts
import type { AccessPlan, StorageLike } from "./access-policy";

export type DailyReadingUsageRecord = {
  appDate: string;
  accessPlan: AccessPlan;
  readingKind: "basic";
  createdAt: string;
};

export type DailyReadingUsageSaveResult = {
  created: boolean;
  record: DailyReadingUsageRecord;
};

export const dailyReadingUsageKey = "manyang:daily-reading-usage";
export const dailyReadingUsageChangedEvent = "manyang:daily-reading-usage-changed";
```

Functions:

```ts
export function getReadingAppDate(date = new Date()): string;
export function createDailyReadingUsageRecord(input: {
  appDate: string;
  accessPlan: AccessPlan;
}): DailyReadingUsageRecord;
export function getDailyReadingUsage(storage: StorageLike): DailyReadingUsageRecord[];
export function hasUsedBasicReadingToday(
  storage: StorageLike,
  accessPlan: AccessPlan,
  appDate?: string,
): boolean;
export function markBasicReadingUsed(
  storage: StorageLike,
  accessPlan: AccessPlan,
  appDate?: string,
): DailyReadingUsageSaveResult;
export function hasUsedBasicReadingTodayInBrowser(accessPlan: AccessPlan): boolean;
export function markBasicReadingUsedToBrowser(accessPlan: AccessPlan): DailyReadingUsageSaveResult | null;
```

Rules:

- Use the same 05:00 Asia/Seoul app-day boundary as `pawprints`.
- Store one basic-reading record per `accessPlan + appDate`.
- If the record already exists, return `{ created: false, record: existingRecord }`.
- Do not block based on this module. Blocking belongs to `access-policy`.

**Step 4: Run GREEN**

Run:

```powershell
cd frontend
npm test -- daily-reading-usage.test.ts
```

Expected: PASS.

---

### Task 2: Local Business Event Logger

**Files:**
- Create: `frontend/src/lib/business-events.ts`
- Create: `frontend/src/lib/business-events.test.ts`

**Step 1: Write the failing test**

Cover:

- `trackBusinessEvent(storage, { name: "guest_daily_limit_hit" })` appends an event.
- Events include `id`, `name`, `createdAt`, and optional `metadata`.
- Multiple events are newest-first or oldest-first consistently. Pick one and test it.
- Corrupted JSON returns an empty event list.
- Browser helper does nothing safely when `window` is unavailable.

**Step 2: Run RED**

Run:

```powershell
cd frontend
npm test -- business-events.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement logger**

Implement:

```ts
export type BusinessEventName =
  | "guest_daily_limit_hit"
  | "guest_login_cta_clicked"
  | "detailed_reading_interest_clicked"
  | "gray_cat_interest_clicked"
  | "monthly_report_interest_clicked";

export type BusinessEvent = {
  id: string;
  name: BusinessEventName;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export const businessEventsKey = "manyang:business-events";
export const businessEventsChangedEvent = "manyang:business-events-changed";
```

Functions:

```ts
export function getBusinessEvents(storage: StorageLike): BusinessEvent[];
export function trackBusinessEvent(
  storage: StorageLike,
  event: {
    name: BusinessEventName;
    metadata?: BusinessEvent["metadata"];
  },
): BusinessEvent;
export function trackBusinessEventToBrowser(
  event: {
    name: BusinessEventName;
    metadata?: BusinessEvent["metadata"];
  },
): BusinessEvent | null;
```

Metadata convention:

- Include `accessPlan` when available.
- Include `isDevOverride` when dev override is active.
- Include `readerId` or `dreamId` only when already available locally.
- Do not send anything to a network provider in this plan.

**Step 4: Run GREEN**

Run:

```powershell
cd frontend
npm test -- business-events.test.ts
```

Expected: PASS.

---

### Task 3: Gate Dream Submission

**Files:**
- Modify: `frontend/src/components/dream-entry-form.tsx`
- Optional Test: add pure helper tests only if extracting a small helper

**Step 1: Read the current form flow**

Current flow:

- Validates empty dream text.
- Blocks premium gray cat through `getCatReaderDreamReadingState`.
- Calls `/api/dreams/analyze`.
- Saves latest analysis and dream record.
- Pushes `/result`.

Do not rewrite the whole component.

**Step 2: Resolve effective plan**

Inside `handleSubmit`, before API call:

```ts
const storage = typeof window === "undefined" ? null : window.localStorage;
const accessPlan = getEffectiveAccessPlan(storage, getDefaultAccessPlan());
const devOverride = getDevAccessOverride(storage);
const hasUsedToday = storage
  ? hasUsedBasicReadingToday(storage, accessPlan)
  : false;
```

Then:

```ts
const gate = canRequestReading({
  accessPlan,
  readingKind: "basic",
  hasUsedBasicReadingToday: hasUsedToday,
  bypassDailyLimit: devOverride.bypassDailyLimit,
});
```

**Step 3: Block before fetch**

If `gate.allowed` is false:

- Set `error` to `gate.message`.
- Do not call `/api/dreams/analyze`.
- If `gate.reason === "guest_daily_limit"`, track:

```ts
trackBusinessEventToBrowser({
  name: "guest_daily_limit_hit",
  metadata: {
    accessPlan,
    isDevOverride: devOverride.enabled,
  },
});
```

**Step 4: Mark usage only after success**

After the analysis response is successful and before `router.push("/result")`:

```ts
markBasicReadingUsedToBrowser(accessPlan);
```

Do this after saving the analysis/record, not before API success.

**Step 5: Manual verification**

Run:

```powershell
cd frontend
npm run dev
```

Manual test cases:

- Clear `manyang:daily-reading-usage`.
- `dev-access-plan = guest`, no bypass: first submit succeeds, second submit is blocked.
- `dev-access-plan = guest`, bypass true: repeated submits are allowed.
- `dev-access-plan = free_account`, no bypass: first submit succeeds, second shows free daily-limit copy.
- `dev-access-plan = moon_pass`, no bypass: basic daily rule follows current policy.

---

### Task 4: Result Login CTA

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`

**Step 1: Resolve effective plan in result**

Inside `DreamResultReceipt`, resolve:

```ts
const storage = typeof window === "undefined" ? null : window.localStorage;
const accessPlan = getEffectiveAccessPlan(storage, getDefaultAccessPlan());
const devOverride = getDevAccessOverride(storage);
```

Because this is a client component, `window` exists after hydration. Keep the fallback safe.

**Step 2: Show guest CTA only for guest**

Below save/share actions, if `accessPlan === "guest"` show:

```text
로그인하면 이 꿈 영수증을 매일 기록에 쌓아둘 수 있어요.
로그인하고 꿈 기록 이어가기
```

For now the CTA can be a button, not a real auth route.

**Step 3: Track CTA click**

On click:

```ts
trackBusinessEventToBrowser({
  name: "guest_login_cta_clicked",
  metadata: {
    accessPlan,
    isDevOverride: devOverride.enabled,
    dreamId: analysis.dreamId,
  },
});
```

Then show a short local feedback message:

```text
로그인 기능은 곧 연결될 예정이에요.
```

Do not add fake login UI.

---

### Task 5: Detailed Reading Interest CTA

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`

**Step 1: Add detailed-reading block**

Below the basic receipt actions and symbol encyclopedia link, add:

```text
더 깊게 읽고 싶다면
상징별 세부 해석, 감정 흐름, 반복 패턴은 상세 꿈 해몽에서 열려요.
```

CTA:

```text
상세 꿈 해몽 관심 있어요
```

Use concrete Moon Pass value:

- 상징별 세부 해석
- 감정 흐름
- 회색냥 꿈+타로 리딩
- 월간 꿈 정산서

**Step 2: Plan-specific rendering**

- If `accessPlan === "moon_pass"`, do not show an upsell. Show a disabled/placeholder state:

```text
Moon Pass 상세 해몽은 다음 단계에서 연결될 예정이에요.
```

- If `accessPlan !== "moon_pass"`, show the interest CTA.

**Step 3: Track detailed interest**

On click:

```ts
trackBusinessEventToBrowser({
  name: "detailed_reading_interest_clicked",
  metadata: {
    accessPlan,
    isDevOverride: devOverride.enabled,
    dreamId: analysis.dreamId,
    readerId: reader.id,
  },
});
```

Then show:

```text
관심을 남겼어요. 상세 해몽이 열리면 이 흐름을 먼저 연결할게요.
```

Do not add payment.

---

### Task 6: Focused Verification

**Files:**
- Update only files changed by previous tasks.

Run:

```powershell
cd frontend
npm test -- access-policy.test.ts daily-reading-usage.test.ts business-events.test.ts
npm run lint
npm run build
```

Then:

```powershell
cd backend
npm test
npm run typecheck
```

Expected:

- Focused tests pass.
- Frontend lint/build pass.
- Backend tests/typecheck pass.

---

### Task 7: Manual Business QA

**Files:**
- No file changes unless a bug appears.

Use `http://127.0.0.1:3000`.

Reset local storage:

```js
localStorage.removeItem("manyang:daily-reading-usage")
localStorage.removeItem("manyang:business-events")
localStorage.removeItem("manyang:dev-access-plan")
localStorage.removeItem("manyang:dev-bypass-daily-limit")
```

Check guest:

```js
localStorage.setItem("manyang:dev-access-plan", "guest")
```

- First dream submit succeeds.
- Second dream submit is blocked.
- Business event includes `guest_daily_limit_hit`.
- Result page shows login CTA.
- Login CTA click logs `guest_login_cta_clicked`.
- Detailed CTA click logs `detailed_reading_interest_clicked`.

Check free account:

```js
localStorage.setItem("manyang:dev-access-plan", "free_account")
```

- First dream submit succeeds.
- Second dream submit shows free daily-limit copy.
- Result page does not show guest login CTA.
- Detailed CTA still appears.

Check moon pass:

```js
localStorage.setItem("manyang:dev-access-plan", "moon_pass")
```

- Product plan resolves as Moon Pass.
- Result page does not show detailed upsell CTA.
- Result page shows placeholder for future detailed reading.

Check bypass:

```js
localStorage.setItem("manyang:dev-bypass-daily-limit", "true")
```

- Repeated basic submissions are allowed for development testing.
- Detailed access is still locked unless simulated plan is `moon_pass`.

Check invalid admin value:

```js
localStorage.setItem("manyang:dev-access-plan", "admin")
```

- App falls back to the real fallback plan.
- `admin` never appears as a product plan.

---

### Task 8: Sprint Updates

**Files:**
- Modify: `vault/09-Implementation/plans/ACTIVE_SPRINT.md`
- Modify: `docs/plans/2026-05-26-access-monetization-foundation.md`

Update as tasks complete:

- Mark `ACCESS-01B` done after daily usage helper passes tests.
- Mark `ACCESS-01F` done after business event helper passes tests and wiring is complete.
- Mark `ACCESS-01C`, `ACCESS-01D`, `ACCESS-01E` done after UI wiring and manual QA.
- Mark `ACCESS-01G` done after all verification commands pass.
- Add Evidence with commands run and manual cases checked.

Do not mark parent `ACCESS-01` done until all child tasks are done.

---

## Do Not Implement In This Plan

- Supabase Auth
- Real account records
- Server-enforced daily limits
- Payment checkout
- App Store / Play Store in-app purchase
- Real Moon Pass subscription status
- Real detailed LLM generation
- Admin as a fourth product plan

---

## Handoff Notes

The next session should start with Task 1. Use TDD for new helpers:

```powershell
cd frontend
npm test -- daily-reading-usage.test.ts
```

Watch it fail before creating `daily-reading-usage.ts`.

The smallest safe implementation order is:

```text
daily-reading-usage
→ business-events
→ DreamEntryForm gate
→ DreamResultReceipt CTAs
→ verification
```
