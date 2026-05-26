# Cat Reader Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users choose a default cat reader from the home screen and override the reader while writing a dream.

**Architecture:** Keep cat reader metadata and default selection in frontend library modules backed by localStorage. Pass the selected `catReaderType` through the existing analyze API and persist it with latest analysis and dream records so result/archive history remains stable.

**Tech Stack:** Next.js App Router, React client components, localStorage, Vitest, existing image assets under `frontend/public/manyang`.

---

### Task 1: Cat Reader Metadata And Selection Storage

**Files:**
- Create: `frontend/src/lib/cat-readers.ts`
- Test: `frontend/src/lib/cat-readers.test.ts`
- Modify: `frontend/src/lib/manyang-assets.ts`

**Step 1: Write failing tests**

Cover:
- `catReaders` contains `black_cat`, `white_cat`, `cheese_cat`, `gray_cat`.
- `getCatReaderById(undefined)` returns the black cat.
- free readers exclude the gray cat.
- saving a free reader updates the stored default.
- trying to save `gray_cat` does not replace the default reader.
- corrupted storage falls back to the black cat.

**Step 2: Verify RED**

Run:

```bash
npm test -- cat-readers.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement minimal storage**

Create:
- `CatReaderId = "black_cat" | "white_cat" | "cheese_cat" | "gray_cat"`
- `CatReaderAccess = "free" | "annual_premium"`
- `catReaders`, `freeCatReaders`, `defaultCatReaderId`
- `selectedCatReaderKey = "manyang:selected-cat-reader"`
- `getSelectedCatReaderId`, `saveSelectedCatReaderId`, browser snapshot/subscribe helpers

Use localStorage and a same-tab custom event, following the pattern in `pawprints.ts`.

**Step 4: Verify GREEN**

Run:

```bash
npm test -- cat-readers.test.ts
```

Expected: PASS.

---

### Task 2: API Contract And Dream Storage

**Files:**
- Modify: `backend/src/contracts/dream.ts`
- Modify: `backend/src/services/mock-analysis.ts`
- Modify: `frontend/src/lib/dream-storage.ts`
- Test: `frontend/src/lib/dream-storage.test.ts`
- Test: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Step 1: Write failing tests**

Cover:
- `LatestAnalysisPayload` can persist `catReaderType`.
- saved dream records retain `catReaderType`.
- analyze route accepts `catReaderType: "white_cat"` and response includes `reader.id`.

**Step 2: Verify RED**

Run:

```bash
npm test -- dream-storage.test.ts route.test.ts
```

Expected: FAIL because `reader` is not returned and storage types do not yet require the field.

**Step 3: Implement contract**

Extend backend:
- `CatReaderType = "black_cat" | "white_cat" | "cheese_cat" | "gray_cat"`
- response includes `reader: { id, name, access }`
- mock analysis adds a small `readerNote` string per free reader.

Extend frontend storage payload:
- `catReaderType?: CatReaderId`
- preserve older records without the field by defaulting at display time.

**Step 4: Verify GREEN**

Run:

```bash
npm test -- dream-storage.test.ts route.test.ts
```

Expected: PASS.

---

### Task 3: Home Reader Picker

**Files:**
- Create: `frontend/src/components/cat-reader-picker.tsx`
- Modify: `frontend/src/components/today-home-actions.tsx`

**Step 1: Implement UI after storage tests pass**

Add a compact home panel:
- title: `오늘 나를 읽어줄 고양이`
- three free reader buttons are selectable.
- gray cat appears locked with a disabled/interest CTA.
- selecting a free reader persists the default reader.

Keep it below the home question and above the primary action so it is visible before entering the write flow.

**Step 2: Browser check**

Open `/`, click white/cheese/black reader buttons, then reload.

Expected:
- selected reader remains active after reload.
- primary dream button still navigates to `/write`.

---

### Task 4: Dream Write Override

**Files:**
- Modify: `frontend/src/components/dream-entry-form.tsx`

**Step 1: Connect selected reader**

Use the stored home reader as the default for this form.

Add a compact reader selector near the existing cat speech area:
- free readers can be switched while writing.
- gray cat is shown as locked but cannot be submitted.

Submit:
- pass selected `catReaderType` to `/api/dreams/analyze`
- include `catReaderType` in both `saveLatestAnalysisToBrowser` and `saveDreamRecordToBrowser`

**Step 2: Browser check**

Open `/write`, switch readers, submit a dream with a mocked backend response through the actual local route.

Expected:
- request body contains selected reader.
- result page shows the same reader.

---

### Task 5: Result Reader Display

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Modify: `frontend/src/lib/result-actions.ts`

**Step 1: Display persisted reader**

Use `payload.catReaderType ?? analysis.reader?.id ?? "black_cat"` to resolve the display reader.

Show:
- reader name near receipt metadata or signature.
- `analysis.readerNote` below interpretation when present.
- share text/SVG uses the selected reader name.

**Step 2: Verification**

Run:

```bash
npm test -- cat-readers.test.ts dream-storage.test.ts route.test.ts result-actions.test.ts
npm run lint
npm run build
```

Then run browser verification for:
- `/` selection persistence.
- `/write` override.
- `/result` reader display.

Expected:
- focused tests pass.
- lint/build pass.
- full `npm test` may still fail on existing home background layout tests unless those unrelated expectations are updated separately.
