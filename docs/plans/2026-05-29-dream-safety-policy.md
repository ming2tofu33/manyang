# Dream Safety Policy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a shared safety policy so dream readings do not make medical, pregnancy, financial, crisis, or violence predictions and always surface the right user-facing notice.

**Architecture:** Add a backend safety policy module that classifies risky user input before LLM generation. Feed that policy into the prompt and apply the same policy as a final post-processing step for both mock and LLM responses.

**Tech Stack:** TypeScript, Vitest, Next.js route using `@manyang/backend`.

---

### Task 1: Safety Policy Module

**Files:**
- Create: `backend/src/services/dream-safety-policy.ts`
- Test: `backend/tests/dream-safety-policy.test.ts`

**Steps:**
1. Write failing tests for medical, pregnancy, financial, crisis, and death/violence detection.
2. Verify the tests fail because the module does not exist.
3. Implement `analyzeDreamSafetyPolicy` with locale-aware notices and prompt directives.
4. Run the focused test until it passes.

### Task 2: Response Post-Processing

**Files:**
- Modify: `backend/src/services/mock-analysis.ts`
- Modify: `backend/src/services/llm-dream-analysis.ts`
- Test: `backend/tests/mock-analysis.test.ts`
- Test: `backend/tests/llm-dream-analysis.test.ts`

**Steps:**
1. Write failing tests proving `safetyNotice` is present for risky inputs even when the model draft omits it.
2. Verify red.
3. Apply the safety policy after baseline/mock analysis and after LLM draft merge.
4. Verify green.

### Task 3: Prompt Safety Context

**Files:**
- Modify: `backend/src/services/dream-reading-prompt.ts`
- Test: `backend/tests/dream-reading-prompt.test.ts`

**Steps:**
1. Write a failing test that `safetyPolicy` is included in the prompt payload.
2. Verify red.
3. Inject policy result and explicit output constraints into prompt payload/instructions.
4. Verify green.

### Task 4: Verification

**Commands:**
- `npm --prefix backend run typecheck`
- `npm --prefix backend test`
- `npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts`
- `npm --prefix frontend run build`

**Expected:** All checks pass.
