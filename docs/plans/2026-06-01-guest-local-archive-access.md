# Guest Local Archive Access Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let non-logged-in users view and keep local dream receipts, morning footprints, and night records in the archive, while presenting login as backup/sync instead of a hard gate.

**Architecture:** Update archive hooks so guest state resolves to local browser records. Update morning/night save flows so guests still save to localStorage. Keep authenticated users on Supabase-backed server records. Archive UI should render records first and show login prompts as secondary backup messaging.

**Tech Stack:** Next.js App Router, React 19, TypeScript, localStorage, Supabase auth, Vitest, existing Manyang archive hooks.

---

## Product Decisions

- Guest users can open `/archive`, `/archive/records`, and routine detail pages.
- Guest records are local-only and device-bound.
- Login messaging should explain backup/sync, not block reading records.
- Authenticated users continue to use server records.
- If server data is loading but local records exist, keep local records visible instead of showing only a blocking loader.
- Morning footprint and night record creation should save locally for guests.

## Task 1: Resolve Dream Archive Guest State to Local Records

**Files:**
- Modify `frontend/src/lib/use-archive-dream-records.ts`
- Modify `frontend/src/lib/use-archive-dream-records.test.ts`

**Steps:**
1. Update tests so `guest` remote status returns local dream records.
2. Add test for loading state with local records.
3. Update `ArchiveDreamRecordSource` to include `local`.
4. Return local records for `guest` and `loading` when available.
5. Keep server records preferred for authenticated users.
6. Run `npm --prefix frontend test -- src/lib/use-archive-dream-records.test.ts`.

## Task 2: Resolve Routine Guest State to Local Records

**Files:**
- Modify `frontend/src/lib/use-routine-records.ts`
- Modify `frontend/src/lib/use-routine-records.test.ts`

**Steps:**
1. Update tests so `guest` remote status returns local pawprints and night check-ins.
2. Add local browser snapshots through `useSyncExternalStore`.
3. Return `source: "local"` for local-only records.
4. Keep server records preferred when authenticated fetch succeeds.
5. Run `npm --prefix frontend test -- src/lib/use-routine-records.test.ts`.

## Task 3: Allow Guest Local Routine Saves

**Files:**
- Modify `frontend/src/lib/pawprints.ts`
- Modify `frontend/src/lib/pawprints.test.ts`
- Modify `frontend/src/lib/night-checkin.ts`
- Modify `frontend/src/lib/night-checkin.test.ts`
- Modify `frontend/src/components/morning-mood-form.tsx`
- Modify `frontend/src/components/night-checkin-form.tsx`

**Steps:**
1. Update persistence tests so guest local saves are allowed.
2. Save morning mood and pawprint locally before server save.
3. Save night check-in locally before server save.
4. For guests, show “이 기기에 저장됨 / 로그인하면 백업” prompt instead of returning early.
5. For authenticated users, still attempt API save and merge remote result.
6. Run focused tests for pawprints, night-checkin, morning/night forms.

## Task 4: Remove Archive Hard Gates

**Files:**
- Modify `frontend/src/components/dream-archive-list.tsx`
- Modify `frontend/src/components/archive-records-client.tsx`
- Modify `frontend/src/components/archive-record-detail-client.tsx`
- Modify `frontend/src/components/archive-calendar.tsx`

**Steps:**
1. Stop returning `ArchiveLoginGate` just because source is guest/local.
2. Use hook-returned routine records directly.
3. Show a compact backup banner for local-only records.
4. Keep empty states visible for users with no local records.
5. Run component tests and update copy assertions.

## Task 5: Final Verification

**Commands:**
- `npm --prefix frontend test -- src/lib/use-archive-dream-records.test.ts src/lib/use-routine-records.test.ts src/lib/pawprints.test.ts src/lib/night-checkin.test.ts`
- `npm --prefix frontend test -- src/lib/archive-record-view.test.ts src/components/dream-archive-list.test.tsx src/components/archive-records-client.test.tsx src/components/archive-record-detail-client.test.tsx`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

**Manual checks:**
- Guest `/archive` opens without blocking login gate.
- Guest `/archive/records` shows search/filter UI.
- Guest routine records saved on the same device appear in archive.
- Login prompt appears as backup/sync guidance only.

