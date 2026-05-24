# Result Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the result screen actions into separate save, share, and encyclopedia actions that match the dream receipt reference.

**Architecture:** Keep dream analysis generation as the point where app archive records are created automatically, so the result screen does not need a confusing "save to records" action. Add a small result action utility module for deterministic receipt filenames, share text, SVG receipt export, and symbol-to-slug routing, then call those utilities from the `DreamResultReceipt` client component.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, localStorage, Web Share API with clipboard fallback, SVG data download.

---

### Task 1: Result Action Utilities

**Files:**
- Create: `frontend/src/lib/result-actions.ts`
- Create: `frontend/src/lib/result-actions.test.ts`

**Step 1: Write failing tests**

Test that:
- `getPrimarySymbolSlug(["복도"])` returns `corridor`.
- unknown symbols fall back to `encodeURIComponent(symbol)`.
- `createReceiptFileName` creates a stable `.svg` filename.
- `createReceiptShareText` includes summary, symbols, and prescription.

**Step 2: Run RED**

Run:

```powershell
cd frontend
npm test -- src/lib/result-actions.test.ts
```

Expected: fails because the module does not exist.

**Step 3: Implement utilities**

Implement symbol slug mapping for the MVP seed symbols and text/SVG helpers.

**Step 4: Run GREEN**

Run:

```powershell
cd frontend
npm test -- src/lib/result-actions.test.ts
```

Expected: tests pass.

### Task 2: Auto Archive Record on Analysis

**Files:**
- Modify: `frontend/src/components/dream-entry-form.tsx`

**Step 1: Save latest analysis**

Keep current latest-analysis save behavior for `/result`.

**Step 2: Save archive record automatically**

After successful analysis, call `saveDreamRecordToBrowser` with the same payload, `id: analysis.dreamId`, and `savedAt`.

**Step 3: Navigate to result**

Keep `router.push("/result")`.

### Task 3: Split Result Buttons

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`

**Step 1: Replace the old button**

Remove `기록에 저장하기`.

**Step 2: Add separate actions**

Add:
- `저장하기`: downloads an SVG receipt image generated from the result data.
- `공유하기`: uses `navigator.share` with fallback to clipboard.
- `상징 백과에서 자세히 보기`: links to the primary symbol detail.

**Step 3: Preserve visual reference**

Use a two-column row for save/share and one full-width secondary action below, matching the provided reference.

### Task 4: Fix LocalStorage Snapshot Runtime Error

**Files:**
- Modify: `frontend/src/lib/dream-storage.ts`
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Modify: `frontend/src/components/dream-archive-list.tsx`

**Step 1: Cache snapshots**

Ensure `useSyncExternalStore` snapshots return stable references until the raw localStorage value changes.

**Step 2: Verify no infinite loop**

Run lint/build and check dev log if possible.

### Task 5: Verification

Run:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

Run:

```powershell
cd backend
npm test
npm run typecheck
```

Expected: all pass.
