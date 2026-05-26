# Daily Pawprints Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a daily pawprint retention marker where any one qualifying action per 05:00 app day keeps the user's streak.

**Architecture:** Add a small localStorage-backed pawprint module with pure date/count/streak helpers and browser subscription helpers. Wire existing morning mood and receipt save flows to award a pawprint idempotently, then render monthly count, streak, and calendar pawprint marks on the archive screen.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, localStorage.

---

### Task 1: Pawprint Storage And Date Rules

**Files:**
- Create: `frontend/src/lib/pawprints.ts`
- Create: `frontend/src/lib/pawprints.test.ts`

**Step 1: Write the failing tests**

Create tests for:

- `getPawprintAppDate(new Date("2026-05-25T04:59:00+09:00"))` returns `2026-05-24`.
- `getPawprintAppDate(new Date("2026-05-25T05:00:00+09:00"))` returns `2026-05-25`.
- `createPawprintRecord` stores `appDate`, `source`, `sourceId`, and `createdAt`.
- `savePawprint` inserts the first record for a date.
- `savePawprint` preserves the first record when the same appDate is saved again.
- corrupted JSON returns an empty list.

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- pawprints.test.ts
```

Expected: FAIL because `frontend/src/lib/pawprints.ts` does not exist.

**Step 3: Implement minimal storage module**

Implement:

- `pawprintRecordsKey = "manyang:pawprints"`
- `pawprintChangedEvent = "manyang:pawprints-changed"`
- `type PawprintSource = "morning_record" | "forgotten_dream" | "receipt_saved"`
- `getPawprintAppDate(date = new Date())`
- `createPawprintRecord(input)`
- `getPawprints(storage)`
- `getPawprintSnapshot(storage)`
- `savePawprint(storage, record)`
- `savePawprintToBrowser(record)`
- `subscribeToPawprints(onStoreChange)`

Use the same localStorage and `useSyncExternalStore` patterns as `frontend/src/lib/morning-mood.ts`.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- pawprints.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/pawprints.ts frontend/src/lib/pawprints.test.ts
git commit -m "feat(frontend): add daily pawprint storage"
```

### Task 2: Pawprint Stats Helpers

**Files:**
- Modify: `frontend/src/lib/pawprints.ts`
- Modify: `frontend/src/lib/pawprints.test.ts`

**Step 1: Write the failing tests**

Add tests for:

- `countMonthlyPawprints(records, 2026, 5)` returns only May appDates.
- `getCurrentPawprintStreak(records, "2026-05-25")` counts consecutive days ending today.
- if today has no pawprint but yesterday does, streak counts through yesterday.
- gaps stop streak counting.
- `isStampUnlocked(records)` returns true at 7 unique pawprint days.

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- pawprints.test.ts
```

Expected: FAIL because stats helpers are missing.

**Step 3: Implement stats helpers**

Implement pure helpers:

- `countMonthlyPawprints(records, year, month)`
- `getCurrentPawprintStreak(records, todayAppDate)`
Use unique `appDate` values so duplicate data cannot inflate counts.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- pawprints.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/pawprints.ts frontend/src/lib/pawprints.test.ts
git commit -m "feat(frontend): add pawprint stats"
```

### Task 3: Award Pawprints From Existing Actions

**Files:**
- Modify: `frontend/src/components/morning-mood-form.tsx`
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Test: `frontend/src/lib/pawprints.test.ts`

**Step 1: Write the failing tests**

Extend pawprint tests to confirm duplicate sourceIds or same appDate do not create duplicate records.

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- pawprints.test.ts
```

Expected: FAIL until idempotent behavior is implemented.

**Step 3: Wire morning mood**

In `MorningMoodForm`, after saving the morning mood record, call `savePawprintToBrowser` with:

- `source: "morning_record"`
- `sourceId: record.id`
- `appDate: getPawprintAppDate()`

Use the result of `savePawprintToBrowser` to show `오늘의 발자국이 남았어요.` only when a new pawprint was created.

**Step 4: Wire receipt save**

In `DreamResultReceipt`, after the SVG receipt download is triggered successfully, call `savePawprintToBrowser` with:

- `source: "receipt_saved"`
- `sourceId: analysis.dreamId`
- `appDate: getPawprintAppDate()`

Do not award pawprints for share-only actions.

**Step 5: Run focused tests**

Run:

```bash
npm test -- pawprints.test.ts morning-mood.test.ts result-actions.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/components/morning-mood-form.tsx frontend/src/components/dream-result-receipt.tsx frontend/src/lib/pawprints.ts frontend/src/lib/pawprints.test.ts
git commit -m "feat(frontend): award daily pawprints"
```

### Task 4: Archive Calendar Summary

**Files:**
- Modify: `frontend/src/components/dream-archive-list.tsx`
- Modify: `frontend/src/app/archive/page.tsx`
- Modify: `frontend/src/lib/archive-calendar-layout.ts`
- Test: `frontend/src/lib/archive-calendar-layout.test.ts`

**Step 1: Write the failing tests**

Add a layout/helper test for the pawprint calendar marker class or style so the marker position remains stable.

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- archive-calendar-layout.test.ts
```

Expected: FAIL until marker helper is added.

**Step 3: Render summary**

In the archive UI, subscribe to pawprints and render:

- `이번 달 발자국 N개`
- `연속 발자국 N일째`
Keep the UI compact. Do not add a separate progression page.

**Step 4: Render calendar markers**

For each calendar date with a pawprint appDate, render a small paw marker inside the existing calendar cell. Keep existing dream record marks intact.

**Step 5: Run focused tests**

Run:

```bash
npm test -- archive-calendar-layout.test.ts pawprints.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/components/dream-archive-list.tsx frontend/src/app/archive/page.tsx frontend/src/lib/archive-calendar-layout.ts frontend/src/lib/archive-calendar-layout.test.ts
git commit -m "feat(frontend): show pawprints in archive"
```

### Task 5: Full Verification

**Files:**
- No new files unless verification exposes a bug.

**Step 1: Run full automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all pass.

**Step 2: Browser verification**

Start or reuse the local dev server. In the browser:

- Clear `manyang:pawprints`.
- Complete morning mood.
- Confirm archive shows one pawprint and streak 1.
- Save a dream receipt on the same app day.
- Confirm archive still shows one pawprint.
- Confirm archive shows monthly pawprint count and streak.

**Step 3: Commit fixes only if needed**

If browser verification requires changes:

```bash
git add <changed-files>
git commit -m "fix(frontend): polish pawprint flow"
```

**Step 4: Final status**

Run:

```bash
git status --short
```

Expected: only unrelated pre-existing changes remain, or clean if this worktree has been isolated.
