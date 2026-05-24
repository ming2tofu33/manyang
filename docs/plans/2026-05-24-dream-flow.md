# Dream Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the prototype loop from dream entry to mock analysis, result display, localStorage save, and archive rendering.

**Architecture:** Keep the backend analysis behind `POST /api/dreams/analyze`. Add client-side components for browser-only form submission and storage access, while keeping route pages as thin wrappers. Use a small storage module with injectable storage for tests and localStorage in the browser.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, localStorage, existing `@manyang/backend` API contract.

---

### Task 1: Storage Contract and Tests

**Files:**
- Create: `frontend/src/lib/dream-storage.ts`
- Create: `frontend/src/lib/dream-storage.test.ts`

**Step 1: Write failing tests**

Test that:
- `saveLatestAnalysis` stores a latest result payload.
- `getLatestAnalysis` returns the saved payload or `null`.
- `saveDreamRecord` prepends a saved record to `manyang:dreams`.
- corrupted JSON returns empty/null fallback instead of throwing.

Run:

```powershell
cd frontend
npm test -- src/lib/dream-storage.test.ts
```

Expected: fails because the module does not exist.

**Step 2: Implement minimal storage helpers**

Create typed helpers around:
- `manyang:latest-analysis`
- `manyang:dreams`

Keep JSON parsing defensive and browser access isolated behind explicit `StorageLike` arguments plus browser wrappers.

**Step 3: Verify tests**

Run:

```powershell
cd frontend
npm test -- src/lib/dream-storage.test.ts
```

Expected: tests pass.

### Task 2: Dream Entry Client Flow

**Files:**
- Create: `frontend/src/components/dream-entry-form.tsx`
- Modify: `frontend/src/app/write/page.tsx`

**Step 1: Convert the write form to a client component**

Move the textarea, mood chips, submit image button, loading/error state, and API call into `DreamEntryForm`.

**Step 2: Submit to API**

On submit:
- validate non-empty dream text
- call `/api/dreams/analyze`
- store latest payload via `saveLatestAnalysisToBrowser`
- route to `/result`

**Step 3: Keep visual structure**

Preserve the existing panel/button image design.

### Task 3: Result Save Flow

**Files:**
- Create: `frontend/src/components/dream-result-receipt.tsx`
- Modify: `frontend/src/app/result/page.tsx`

**Step 1: Add client result component**

Read latest analysis from localStorage. If absent, show the current static fallback copy.

**Step 2: Save to archive**

The save button writes a `DreamRecord` to `manyang:dreams` and navigates to `/archive`.

**Step 3: Keep visual structure**

Preserve the existing receipt image and layout, including current image changes from the other session.

### Task 4: Archive Stored Records

**Files:**
- Create: `frontend/src/components/dream-archive-list.tsx`
- Modify: `frontend/src/app/archive/page.tsx`

**Step 1: Add client archive list**

Read saved records from localStorage and render the newest record first.

**Step 2: Keep existing calendar work**

Do not replace the current image-based calendar implementation. Only make `dreamDays` include stored record days and replace/add the lower list section.

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

### Task 6: Commit

Stage only the flow implementation, tests, plan, and sprint status changes. Leave unrelated image/shell changes from the other session unstaged.

Commit:

```powershell
git commit -m "feat(flow): connect dream entry to archive"
```
