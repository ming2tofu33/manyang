# Evidence Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent the dream-reading LLM from assigning symbolic meanings to user-mentioned elements that were not retrieved from the symbol encyclopedia.

**Architecture:** Add a backend evidence gate that compares structured dream candidates and safety terms against retrieved symbol matches. The prompt receives verified symbols and scene-only elements separately, and LLM draft symbol readings are filtered so only verified symbols survive.

**Tech Stack:** TypeScript, Vitest, Next.js API route, local runtime symbol matcher.

---

### Task 1: Evidence Gate

**Files:**
- Create: `backend/src/services/evidence-gate.ts`
- Test: `backend/tests/evidence-gate.test.ts`

**Steps:**
1. Write failing tests for a hospital/blood dream where `병원` is verified and `피` is scene-only.
2. Run focused tests and confirm RED.
3. Implement verified symbol and scene-only classification.
4. Run focused tests and confirm GREEN.

### Task 2: Prompt Boundary

**Files:**
- Modify: `backend/src/services/dream-reading-prompt.ts`
- Test: `backend/tests/dream-reading-prompt.test.ts`

**Steps:**
1. Write a failing test that prompt input includes `evidenceBoundaries`.
2. Confirm prompt instructions mention scene-only elements cannot receive symbolic meanings.
3. Implement prompt injection.
4. Run focused tests.

### Task 3: LLM Draft Filtering

**Files:**
- Modify: `backend/src/services/llm-dream-analysis.ts`
- Test: `backend/tests/llm-dream-analysis.test.ts`

**Steps:**
1. Write a failing test where the fake provider returns a `Blood` symbol reading even though only `Hospital` was retrieved.
2. Confirm RED.
3. Filter LLM `symbolReadings` against verified symbols, falling back to baseline readings if all draft readings are unverified.
4. Run focused tests.

### Task 4: Verification

**Commands:**
- `npm --prefix backend run typecheck`
- `npm --prefix backend test`
- `npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts`
- `npm --prefix frontend run build`
