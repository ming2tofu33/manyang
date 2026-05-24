# Backend Mock Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a separate `backend/` TypeScript domain module that provides Korean dream-symbol seed data, symbol matching, and mock dream-analysis responses compatible with the Manyang MVP API contract.

**Architecture:** Keep the first backend step as a framework-free TypeScript library instead of a separate HTTP server. The frontend can later call this module from a Next.js API route, while Supabase and real LLM calls can replace the mock service behind the same response contract.

**Tech Stack:** TypeScript, Vitest, Node.js ESM, local seed data, deterministic matching logic, no database or external runtime service yet.

---

### Task 1: Backend Package Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`

**Step 1: Create package config**

Add scripts:

```json
{
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```

**Step 2: Install backend dev dependencies**

Run:

```powershell
cd backend
npm install
```

Expected: `backend/package-lock.json` is created and `node_modules/` is ignored by the nested package behavior or by Git ignore rules.

### Task 2: Contract Types

**Files:**
- Create: `backend/src/contracts/dream.ts`

**Step 1: Define contract types**

Create `DreamAnalysisRequest`, `DreamAnalysisResponse`, `DreamCardResponse`, `EncyclopediaEntry`, and `DreamSymbolCategory`.

**Step 2: Export from index**

Expose the contract types through `backend/src/index.ts`.

### Task 3: Symbol Matching TDD

**Files:**
- Create: `backend/tests/symbol-matcher.test.ts`
- Create: `backend/src/services/symbol-matcher.ts`

**Step 1: Write failing tests**

Tests must cover:
- canonical symbol matching from a sentence such as `학교 복도에서 신발을 잃어버렸어요`
- alias/action matching such as `찾고 있었어요`
- avoiding false positives for short symbols such as `문득`

**Step 2: Run test to verify RED**

Run:

```powershell
cd backend
npm test -- tests/symbol-matcher.test.ts
```

Expected: fails because `symbol-matcher.ts` does not exist.

**Step 3: Implement matcher**

Implement `findMatchingSymbols(text, options)` using the seed data and Korean particle-aware matching.

**Step 4: Run test to verify GREEN**

Run:

```powershell
cd backend
npm test -- tests/symbol-matcher.test.ts
```

Expected: all symbol matcher tests pass.

### Task 4: Encyclopedia Seed Data

**Files:**
- Create: `backend/src/data/encyclopedia.ts`

**Step 1: Add seed entries**

Start with the 10 documented MVP symbols:

```text
문, 열쇠, 복도, 신발, 엘리베이터, 물, 비, 학교, 고양이, 계단
```

Add expansion symbols from the existing vault plan:

```text
집, 병원, 바다, 방, 지하철, 공항, 가방, 거울, 책, 시계, 전화, 창문,
잃어버림, 찾기, 뛰기, 기다림, 불, 바람, 어둠, 안개, 별, 개, 새, 물고기,
모르는 사람, 어린아이
```

Use the external references only as category and tone inspiration:
- SajuForum dream search uses broad symbol groups such as animals, weather/nature, places, objects, emotions, and actions.
- Sleep Foundation and Cleveland Clinic describe dreams as subjective and often tied to emotions, memory, stress, and waking life.
- NCBI notes that no single theory of why we dream is generally accepted.

Do not copy source interpretations verbatim.

### Task 5: Mock Analysis TDD

**Files:**
- Create: `backend/tests/mock-analysis.test.ts`
- Create: `backend/src/services/mock-analysis.ts`

**Step 1: Write failing tests**

Tests must cover:
- analysis for `학교 복도에서 신발을 잃어버렸어요`
- fallback analysis for low-signal dream text
- validation for empty dream text

**Step 2: Run test to verify RED**

Run:

```powershell
cd backend
npm test -- tests/mock-analysis.test.ts
```

Expected: fails because `mock-analysis.ts` does not exist.

**Step 3: Implement mock analyzer**

Implement `analyzeDream(request)`:
- return `dreamId`, `analysisId`, `cardId`
- return matched `symbols`, inferred `emotions`, `themes`
- generate non-diagnostic `interpretation`
- generate `smallPrescription`
- generate `card` with `name`, `type`, `keywords`, `summary`, `message`

**Step 4: Run test to verify GREEN**

Run:

```powershell
cd backend
npm test -- tests/mock-analysis.test.ts
```

Expected: all mock analysis tests pass.

### Task 6: Full Verification

**Files:**
- Modify only backend files created above.

**Step 1: Run backend tests**

Run:

```powershell
cd backend
npm test
```

Expected: all backend tests pass.

**Step 2: Run backend typecheck**

Run:

```powershell
cd backend
npm run typecheck
```

Expected: TypeScript reports no errors.

**Step 3: Check Git status**

Run:

```powershell
git status --short
```

Expected: only `backend/` and this plan are new from this task; existing frontend/ref modifications from the other session remain untouched.
