# Cat Theme Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert cats from dream-reading personas into visual themes so cat choice never changes dream interpretation content, tone, access, or prompt behavior.

**Status:** Implemented on 2026-05-31. Frontend tests, lint, build, backend tests, and backend typecheck passed after implementation.

**Architecture:** Keep the current `catReaderType` storage/API field for compatibility in this pass, but treat it as a presentation theme id. Remove cat-based reading kind, prompt persona branching, and mock `readerNote` differences. Update UI copy so users understand they are choosing a theme, not a different interpreter.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, local `@manyang/backend` TypeScript package.

---

## Constraints

- Do not rename DB column `cat_reader_type` in this pass; keep it as a compatibility field and migrate later.
- Do not introduce payment or actual Moon Pass logic beyond existing access plans.
- Do not remove cat visuals from home/loading/result screens.
- Do not revert unrelated dirty files already in the worktree.
- Do not commit automatically unless explicitly requested.

## Task 1: Make Cat Choice Non-Authoritative For Access

**Files:**
- Modify: `frontend/src/lib/access-policy.ts`
- Test: `frontend/src/lib/access-policy.test.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Step 1: Update failing expectations**

Change the test currently named `maps gray cat to detailed reading and other cats to basic reading` to assert every cat theme maps to `basic`:

```ts
expect(getReadingKindForCatReader("gray_cat")).toBe("basic");
```

Change `hasUsedBasicReadingOnDate` expectation for `gray_cat` to `true`.

In `route.test.ts`, replace the old "gray cat is detailed locked" behavior with "gray cat theme still receives a basic reading." Keep dedicated detailed locking tests for future explicit `readingKind` work out of this pass.

**Step 2: Implement minimal policy change**

In `getReadingKindForCatReader`, always return `"basic"`:

```ts
export function getReadingKindForCatReader(_catReaderId: string | null | undefined): ReadingKind {
  return "basic";
}
```

Change the detailed lock message so it no longer says "잿빛냥 꿈+타로":

```ts
message: "상징별 세부 해석, 감정 흐름, 타로 추가 리딩은 Moon Pass에서 열려요.",
```

**Step 3: Verify**

Run:

```bash
npm --prefix frontend test -- access-policy analyze/route
```

Expected: access policy and analyze route tests pass after updating expectations.

## Task 2: Stop Frontend From Sending A Fallback Reader As Analysis Persona

**Files:**
- Modify: `frontend/src/lib/cat-readers.ts`
- Test: `frontend/src/lib/cat-readers.test.ts`
- Modify: `frontend/src/components/dream-entry-form.tsx`

**Step 1: Update tests**

Change cat metadata expectations from reader roles to theme roles:

```ts
expect(catReaders.map((reader) => reader.role)).toEqual([
  "기본 밤하늘 테마",
  "부드러운 달빛 테마",
  "따뜻한 노을 테마",
  "달빛 서재 테마",
]);
```

Change availability tests so `gray_cat` is a selectable theme for all plans:

```ts
expect(isCatReaderDreamReadingAvailable("gray_cat")).toBe(true);
expect(resolveCatReaderForDreamReading("gray_cat", "guest")).toEqual({
  selectedReaderId: "gray_cat",
  requestReaderId: "gray_cat",
  isFallback: false,
  blockedLabel: null,
});
```

**Step 2: Implement theme metadata**

Keep type names for compatibility but change strings and availability semantics:

- `role`: visual theme role, not reader role.
- `shortDescription`: visual mood, not interpretation style.
- `tone`: visual mood.
- `ctaLabel`: theme apply/save copy.
- `isCatReaderDreamReadingAvailable`: return true for any valid cat id.
- `resolveCatReaderForDreamReading`: never fallback from `gray_cat` to `black_cat`.

**Step 3: Update `DreamEntryForm` behavior**

Keep using `selectedCatReader` for visuals. Set request id to selected id only for storage/theme compatibility, not as a fallback reader:

```ts
const requestCatReaderId = selectedCatReaderId;
const requestCatReader = selectedCatReader;
const readingKind = getReadingKindForCatReader(requestCatReaderId);
```

Change CTA copy from "무료 체험 해몽은 X으로" to theme wording:

```ts
`선택한 ${selectedCatReader.name} 테마로 꿈 영수증을 만들어요.`
```

**Step 4: Verify**

Run:

```bash
npm --prefix frontend test -- cat-readers dream-entry-form
```

Expected: cat reader tests pass; dream entry form tests either pass or reveal copy assertions to update.

## Task 3: Rewrite Cat Picker And Profile Copy As Theme Copy

**Files:**
- Modify: `frontend/src/lib/cat-reader-home-copy.ts`
- Test: `frontend/src/lib/cat-reader-home-copy.test.ts`
- Modify: `frontend/src/components/cat-reader-picker.tsx`
- Test: `frontend/src/components/cat-reader-picker.test.tsx`
- Modify: `frontend/src/components/profile-room.tsx`
- Test: `frontend/src/components/profile-room.test.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/encyclopedia/page.tsx`
- Modify: `frontend/src/lib/seo-encyclopedia.ts`

**Step 1: Update copy tests**

Expected picker sheet copy:

```ts
{
  eyebrow: "오늘의 테마",
  title: "어떤 고양이 테마로 남길까요?",
  description: "고양이에 따라 홈 배경과 꿈 영수증 분위기만 달라져요.",
}
```

Use visual tags:

- 검은냥: `밤하늘`
- 하얀냥: `달빛`
- 치즈냥: `노을`
- 잿빛냥: `서재`

**Step 2: Update component labels**

Replace accessibility labels and visible text:

- `고양이 해몽사 선택` -> `고양이 테마 선택`
- `{name}이 꿈을 읽어요` -> `{name} 테마로 남겨요`
- compact headings using "대표 해몽사" -> "대표 테마"

**Step 3: Update SEO/app copy**

Replace public metadata that says "고양이 해몽사" with "고양이 테마" or neutral dream receipt copy.

**Step 4: Verify**

Run:

```bash
npm --prefix frontend test -- cat-reader-home-copy cat-reader-picker profile-room seo
```

Expected: updated copy tests pass.

## Task 4: Remove Backend Persona Branching From LLM Prompt

**Files:**
- Modify: `backend/src/services/dream-reading-prompt.ts`
- Modify: `backend/src/services/cat-reader-personas.ts`
- Test: `backend/tests/dream-reading-prompt.test.ts`
- Test: `backend/tests/cat-reader-personas.test.ts`
- Modify: `backend/src/index.ts`

**Step 1: Update prompt tests**

Replace tests that assert distinct personas with tests that assert:

- `payload.readerPersona` is absent.
- `payload.request.catReaderType` is absent or ignored by instructions.
- `outputContract.personaSpecific` is absent for all cats.
- Instructions do not contain `readerPersona`, `Black Cat`, `White Cat`, `Cheese Cat`, or `gray-cat`.

Example:

```ts
expect(payload.readerPersona).toBeUndefined();
expect(payload.outputContract?.personaSpecific).toBeUndefined();
expect(prompt.instructions).not.toContain("readerPersona");
```

**Step 2: Implement prompt simplification**

In `dream-reading-prompt.ts`:

- Remove `getCatReaderPersona` import.
- Remove `readerPersona`.
- Remove `personaSpecificOutputContract`.
- Remove `catReaderType` from `promptPayload.request`.
- Make `smallPrescription.shape` common:

```ts
shape: "One compact, gentle, usable sentence tied to the dream details and selected feelings.",
```

- Replace persona instructions with common tone instructions.

**Step 3: Simplify persona module**

Keep `cat-reader-personas.ts` only as compatibility if tests/imports still need it:

```ts
export function normalizeCatReaderPersonaId(...) { ... }
export function getCatReaderPersona(...) { return commonCatReaderPersona; }
```

Do not export distinct `readingProfile` or `premiumDepthProfile`.

**Step 4: Verify**

Run:

```bash
npm --prefix backend test -- dream-reading-prompt cat-reader-personas
npm --prefix backend run typecheck
```

Expected: prompt payload no longer branches on cats.

## Task 5: Make Mock Analysis Content Stable Across Cats

**Files:**
- Modify: `backend/src/services/mock-analysis.ts`
- Test: `backend/tests/mock-analysis.test.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Step 1: Update tests**

Add or update a test comparing the same dream with different cats:

```ts
const black = analyzeDream({ ...request, catReaderType: "black_cat" });
const white = analyzeDream({ ...request, catReaderType: "white_cat" });
expect(white.readerNote).toBe(black.readerNote);
expect(white.interpretation).toBe(black.interpretation);
expect(white.smallPrescription).toBe(black.smallPrescription);
```

Update route response tests so `readerNote` does not contain "하얀냥" or "회색냥".

**Step 2: Implement common reader note**

Replace `catReaderProfiles` note differences with a common note:

```ts
const commonReaderNote = "마냥은 꿈속 상징과 감정의 연결을 같은 기준으로 차분히 정리했어요.";
```

Keep `reader.id/name/access` if needed for backward compatibility, but do not let it change content.

**Step 3: Verify**

Run:

```bash
npm --prefix backend test -- mock-analysis
npm --prefix frontend test -- analyze/route
```

Expected: no cat-specific result content remains in mock route output.

## Task 6: Make Result Exports Theme-Based

**Files:**
- Modify: `frontend/src/components/dream-result-receipt.tsx`
- Test: `frontend/src/components/dream-result-receipt.test.tsx`
- Modify: `frontend/src/lib/result-actions.ts`
- Test: `frontend/src/lib/result-actions.test.ts`

**Step 1: Update tests**

Replace export text expectations:

- `From. 하얀냥` -> `테마: 하얀냥`
- `고양이 해석` -> `공통 해몽`
- `{reader.name}이 읽음` -> `{reader.name} 테마`

**Step 2: Implement UI text changes**

Keep theme visuals and selected cat lookup, but render theme labels only:

```tsx
<span>{reader.name} 테마</span>
```

For text/image export:

```ts
`테마: ${reader.name}`
```

**Step 3: Verify**

Run:

```bash
npm --prefix frontend test -- dream-result-receipt result-actions
```

Expected: result output no longer implies different cats authored the interpretation.

## Task 7: Final Verification

**Files:**
- No additional edits unless verification fails.

**Step 1: Run focused search**

Run:

```bash
rg "해몽사 선택|해몽 말투|꿈을 맡길까요|고양이 해석|From\\. .*냥|readerPersona|premiumDepthProfile|deeper gray-cat|getReadingKindForCatReader\\(\"gray_cat\"\\).*detailed" frontend/src backend/src
```

Expected: no active runtime copy or prompt logic conflicts with the theme direction. Historical docs may still mention previous terms only when explicitly describing migration.

**Step 2: Run full checks**

Run:

```bash
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend test
npm --prefix backend run typecheck
```

Expected: all pass.

**Step 3: Review changed files**

Run:

```bash
git diff --stat
git diff --check
```

Expected: no whitespace errors; changed files are limited to the cat-theme refactor plus pre-existing dirty files.
