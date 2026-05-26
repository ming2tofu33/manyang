# Access Monetization Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the first access-policy layer for Guest, Free Account, and Moon Pass so the app can support one free guest reading per day, daily logged-in readings, and paid detailed-reading upsells.

**Architecture:** Start in Prototype Mode with localStorage-backed access and usage helpers, because Supabase Auth is not connected yet. Keep the policy code separate from UI so the same decisions can later move to Supabase/Auth server enforcement. Do not add real payment in this phase; detailed readings and Moon Pass are interest/CTA flows only. Keep admin/testing behavior outside the product plan model: dev mode can simulate `guest`, `free_account`, or `moon_pass`, but `admin` is not an `AccessPlan`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, localStorage, existing mock analyze API, later Supabase Auth and in-app purchase/subscription.

---

## Execution Checklist

- [x] Document access policy in `vault/06-Business/Access-Plan-Strategy.md`
- [x] Update monetization roadmap to Guest / Free Account / Moon Pass
- [x] Add access-policy pure helpers
- [x] Add dev access override for local plan simulation
- [ ] Add daily reading usage storage
- [ ] Gate dream submission for Guest users after one daily reading
- [ ] Add login CTA after guest reading
- [ ] Add detailed-reading interest CTA
- [ ] Add lightweight business event logging
- [ ] Update tests, lint, and build
- [ ] Defer Supabase Auth and real payment to Post-Prototype

---

### Task 1: Access Policy Helpers

**Files:**
- Create: `frontend/src/lib/access-policy.ts`
- Create: `frontend/src/lib/access-policy.test.ts`

**Step 1: Write failing tests**

Cover:
- Guest can request a basic reading if they have not used today's reading.
- Guest cannot request a second basic reading on the same app day.
- Free Account can request one daily basic reading.
- Moon Pass can request detailed readings.
- Guest and Free Account cannot request detailed readings.
- CTA copy differs for guest daily-limit and detailed-reading locked states.
- Dev override can simulate `guest`, `free_account`, or `moon_pass` in development.
- Dev override can bypass the daily limit without adding `admin` as a product plan.
- Production ignores local dev override keys.

**Step 2: Run RED**

Run:

```powershell
cd frontend
npm test -- access-policy.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement minimal policy**

Create these types:

```ts
export type AccessPlan = "guest" | "free_account" | "moon_pass";
export type ReadingKind = "basic" | "detailed";
export type DevAccessOverride = {
  enabled: boolean;
  simulatedPlan: AccessPlan;
  bypassDailyLimit: boolean;
};

export type ReadingGateInput = {
  accessPlan: AccessPlan;
  readingKind: ReadingKind;
  hasUsedBasicReadingToday: boolean;
  bypassDailyLimit?: boolean;
};

export type ReadingGateResult = {
  allowed: boolean;
  reason: "allowed" | "guest_daily_limit" | "free_daily_limit" | "detailed_locked";
  ctaLabel: string | null;
  message: string | null;
};
```

Implement:

- `canRequestReading(input: ReadingGateInput): ReadingGateResult`
- `getDefaultAccessPlan(): AccessPlan` returning `guest`
- `isPaidAccessPlan(accessPlan: AccessPlan): boolean`
- `getDevAccessOverride(storage, environment): DevAccessOverride`
- `getEffectiveAccessPlan(storage, fallbackPlan, environment): AccessPlan`
- `devAccessPlanKey = "manyang:dev-access-plan"`
- `devBypassDailyLimitKey = "manyang:dev-bypass-daily-limit"`

Policy:

- `guest + basic + not used today` is allowed.
- `guest + basic + used today` is blocked with login CTA.
- `free_account + basic + not used today` is allowed.
- `free_account + basic + used today` is blocked with tomorrow CTA.
- `moon_pass + detailed` is allowed.
- `guest/free_account + detailed` is blocked with Moon Pass CTA.
- `bypassDailyLimit: true` skips the basic-reading daily limit but does not unlock detailed reading unless the effective plan is `moon_pass`.
- `admin` is never a valid plan value. If localStorage contains `admin`, ignore it.
- Local dev override is allowed only outside `production`.

Dev console examples:

```js
localStorage.setItem("manyang:dev-access-plan", "guest")
localStorage.setItem("manyang:dev-access-plan", "free_account")
localStorage.setItem("manyang:dev-access-plan", "moon_pass")
localStorage.setItem("manyang:dev-bypass-daily-limit", "true")
localStorage.removeItem("manyang:dev-access-plan")
localStorage.removeItem("manyang:dev-bypass-daily-limit")
```

**Step 4: Run GREEN**

Run:

```powershell
cd frontend
npm test -- access-policy.test.ts
```

Expected: PASS.

---

### Task 2: Daily Reading Usage Storage

**Files:**
- Create: `frontend/src/lib/daily-reading-usage.ts`
- Create: `frontend/src/lib/daily-reading-usage.test.ts`

**Step 1: Write failing tests**

Cover:
- `getReadingAppDate(new Date("2026-05-26T04:59:00+09:00"))` returns `2026-05-25`.
- `getReadingAppDate(new Date("2026-05-26T05:00:00+09:00"))` returns `2026-05-26`.
- Guest usage is stored by app date.
- Marking today's guest reading makes `hasUsedBasicReadingToday` true.
- Tomorrow's app date resets availability.
- Corrupted localStorage returns no usage.

Use the same 05:00 app-day boundary as pawprints.

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
export type DailyReadingUsageRecord = {
  appDate: string;
  accessPlan: "guest" | "free_account";
  readingKind: "basic";
  createdAt: string;
};
```

Keys:

- `dailyReadingUsageKey = "manyang:daily-reading-usage"`
- `dailyReadingUsageChangedEvent = "manyang:daily-reading-usage-changed"`

Functions:

- `getReadingAppDate(date = new Date()): string`
- `getDailyReadingUsage(storage)`
- `hasUsedBasicReadingToday(storage, accessPlan, appDate = getReadingAppDate())`
- `markBasicReadingUsed(storage, accessPlan, appDate = getReadingAppDate())`
- browser snapshot/subscribe helpers if UI needs them.

**Step 4: Run GREEN**

Run:

```powershell
cd frontend
npm test -- daily-reading-usage.test.ts
```

Expected: PASS.

---

### Task 3: Gate Dream Submission In Prototype Mode

**Files:**
- Modify: `frontend/src/components/dream-entry-form.tsx`
- Modify if needed: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Step 1: Add client-side gate before API call**

In `DreamEntryForm`, before calling `/api/dreams/analyze`:

- Resolve current access plan as `guest` for Prototype Mode.
- Read `hasUsedBasicReadingToday`.
- Call `canRequestReading({ accessPlan: "guest", readingKind: "basic", hasUsedBasicReadingToday })`.
- If blocked, show the gate message and do not call the API.

Copy:

```text
오늘의 무료 꿈 영수증은 이미 받았어요.
로그인하면 매일 꿈 기록을 이어갈 수 있어요.
```

Button/CTA placeholder:

```text
로그인하고 매일 기록하기
```

The login CTA does not need real auth yet. It can be a disabled button, mock button, or route placeholder.

**Step 2: Mark usage after successful analysis**

After successful analysis and local save, call:

```ts
markBasicReadingUsedToBrowser("guest")
```

Keep the existing local dream record behavior for now.

**Step 3: Verify manually**

Run:

```powershell
cd frontend
npm run dev
```

Browser check:

- Clear `manyang:daily-reading-usage`.
- Submit a dream.
- Confirm result is generated.
- Go back to `/write`.
- Submit another dream on the same app day.
- Confirm blocked message appears and no API call is made.

---

### Task 4: Add Guest Login CTA After Result

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`

**Step 1: Show post-result CTA**

For Prototype Mode, treat viewer as guest and show a small CTA below the receipt actions:

```text
로그인하면 이 꿈 영수증을 매일 기록에 쌓아둘 수 있어요.
```

CTA:

```text
로그인하고 꿈 기록 이어가기
```

For now, the button can be non-functional or route to a future `/login` placeholder once that route exists. Avoid adding a fake account flow in this task.

**Step 2: Keep receipt save/share free**

Do not block:

- 기본 꿈 영수증 보기
- 기본 저장
- 기본 공유

---

### Task 5: Detailed Reading Interest CTA

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Modify if needed: `frontend/src/lib/result-actions.ts`

**Step 1: Add detailed reading block**

Add a locked premium block below the basic interpretation:

```text
더 깊게 읽고 싶다면
상징별 해석, 감정 흐름, 반복 패턴은 상세 꿈 해몽에서 열려요.
```

CTA:

```text
상세 꿈 해몽 관심 있어요
```

Do not add payment. On click:

- store a lightweight local event in Task 6, or
- show `준비 중이에요. 열리면 알려드릴게요.`

**Step 2: Keep Moon Pass copy concrete**

Mention what is actually different:

- 상징별 세부 해석
- 감정 흐름
- 회색냥 꿈+타로 리딩
- 월간 꿈 정산서

Avoid vague copy like `프리미엄 기능`.

---

### Task 6: Lightweight Business Event Logging

**Files:**
- Create: `frontend/src/lib/business-events.ts`
- Create: `frontend/src/lib/business-events.test.ts`

**Step 1: Write tests**

Cover:

- `trackBusinessEvent(storage, event)` appends an event.
- event includes `name`, `createdAt`, and optional `metadata`.
- corrupted JSON returns empty history.

**Step 2: Implement local event logger**

Use:

```ts
export type BusinessEventName =
  | "guest_daily_limit_hit"
  | "guest_login_cta_clicked"
  | "detailed_reading_interest_clicked"
  | "gray_cat_interest_clicked"
  | "monthly_report_interest_clicked";
```

Key:

```ts
export const businessEventsKey = "manyang:business-events";
```

This is temporary until analytics is selected.

**Step 3: Wire events**

Add:

- `guest_daily_limit_hit` when guest hits daily limit.
- `guest_login_cta_clicked` when login CTA is clicked.
- `detailed_reading_interest_clicked` when detailed CTA is clicked.

---

### Task 7: Update Verification

**Files:**
- No new files unless tests expose a bug.

Run:

```powershell
cd frontend
npm test -- access-policy.test.ts daily-reading-usage.test.ts business-events.test.ts
npm run lint
npm run build
```

Then run:

```powershell
cd backend
npm test
npm run typecheck
```

Expected:

- Focused frontend tests pass.
- Lint/build pass.
- Backend tests/typecheck pass.

---

### Task 8: Defer Real Auth And Payment

Do not implement these in this plan:

- Supabase Auth sign-up/sign-in UI
- Real account-based daily limits
- App Store / Play Store in-app purchase
- Moon Pass checkout
- Real detailed LLM generation

Create a follow-up plan only after Prototype Mode verifies:

- guest daily limit does not hurt first-use completion too much.
- guest login CTA gets clicked.
- detailed-reading CTA gets clicked.
- basic dream receipt still saves/shares well.
