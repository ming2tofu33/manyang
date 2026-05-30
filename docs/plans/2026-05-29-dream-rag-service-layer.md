# Dream RAG Service Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first production-shaped RAG layer for Manyang dream readings so LLM output is grounded in curated symbol evidence rather than direct keyword matching alone.

**Architecture:** Keep `symbolEntries` as the runtime source for RAG evidence. Generate retrieval chunks from each localized symbol, retrieve through a hybrid alias + sparse chunk search, then pass only the selected evidence into the existing evidence gate and LLM prompt.

**Tech Stack:** TypeScript, Vitest, Next.js API route, local in-process retrieval now, pluggable vector store later.

---

### Task 1: RAG Chunk Builder

**Files:**
- Create: `backend/src/services/dream-rag-chunks.ts`
- Test: `backend/tests/dream-rag-chunks.test.ts`

**Steps:**
1. Write a failing test that `buildDreamRagChunks("ko")` creates multiple chunk types for `hospital`.
2. Verify the test fails because the module does not exist.
3. Implement chunk generation from `symbolEntries` localized fields.
4. Run the focused test.

### Task 2: Hybrid Retriever

**Files:**
- Create: `backend/src/services/dream-rag-retriever.ts`
- Test: `backend/tests/dream-rag-retriever.test.ts`

**Steps:**
1. Write a failing test that explicit aliases rank first, e.g. `병원` returns `hospital`.
2. Write a failing test that non-alias semantic terms can still retrieve relevant evidence, e.g. `돌봄과 취약함이 느껴지는 장소` returns `hospital`.
3. Implement `retrieveDreamEvidence()` combining `findRuntimeSymbolMatches()` and chunk scoring.
4. Run focused retriever tests.

### Task 3: LLM Analysis Integration

**Files:**
- Modify: `backend/src/services/llm-dream-analysis.ts`
- Test: `backend/tests/llm-dream-analysis.test.ts`

**Steps:**
1. Write a failing test that the LLM prompt uses `retrieveDreamEvidence()` results.
2. Replace direct `findRuntimeSymbolMatches()` use with `retrieveDreamEvidence()`.
3. Preserve evidence gate filtering and safety policy behavior.
4. Run focused LLM tests.

### Task 4: Public Exports and Verification

**Files:**
- Modify: `backend/src/index.ts`
- Test: existing backend tests

**Steps:**
1. Export the new RAG chunk and retriever functions.
2. Run `npm --prefix backend run typecheck`.
3. Run `npm --prefix backend test`.
4. Run `npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts`.
5. Run `npm --prefix frontend run build`.

