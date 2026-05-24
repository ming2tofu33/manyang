# Dream Record Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users delete saved dream records from the archive without leaving stale sample data behind.

**Architecture:** Keep deletion in the local storage layer so the archive UI only calls one typed helper. Emit an in-window storage change event after browser writes so `useSyncExternalStore` subscribers update immediately in the same tab.

**Tech Stack:** Next.js App Router, React client components, Vitest, localStorage.

---

### Task 1: Storage Delete Behavior

**Files:**
- Modify: `frontend/src/lib/dream-storage.test.ts`
- Modify: `frontend/src/lib/dream-storage.ts`

**Steps:**
1. Add a failing Vitest case proving `deleteDreamRecord(storage, id)` removes only the matching record.
2. Add a second case proving deleting a missing id keeps the record list unchanged.
3. Run `npm test -- dream-storage.test.ts` from `frontend` and verify the tests fail because `deleteDreamRecord` does not exist.
4. Implement `deleteDreamRecord` and `deleteDreamRecordToBrowser`.
5. Re-run the focused storage tests and verify they pass.

### Task 2: Same-Tab Archive Refresh

**Files:**
- Modify: `frontend/src/lib/dream-storage.ts`
- Modify: `frontend/src/components/dream-archive-list.tsx`

**Steps:**
1. Export a `subscribeToDreamRecords` helper that listens to both native `storage` events and an internal dream-storage event.
2. Dispatch the internal event from browser storage write helpers.
3. Update the archive component to use the shared subscriber.

### Task 3: Archive Delete UI

**Files:**
- Modify: `frontend/src/components/dream-archive-list.tsx`

**Steps:**
1. Add a small trash icon button to each saved dream card.
2. Ask for browser confirmation before deleting.
3. Remove fallback sample records from the archive list and show a real empty state when no records remain.

### Task 4: Verification

**Commands:**
- `cd frontend; npm test`
- `cd frontend; npm run lint`
- `cd frontend; npm run build`
