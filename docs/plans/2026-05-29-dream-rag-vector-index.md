# Dream RAG Vector Index Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a persistent embedding/vector-index layer for Manyang dream RAG so curated symbol chunks can be embedded, saved, loaded, and used during retrieval.

**Architecture:** Keep the current local hybrid retriever as the fallback. Add a pluggable embedding provider interface, a JSON-backed local vector index, an ingestion pipeline from `buildDreamRagChunks()`, and an optional vector-search branch in `retrieveDreamEvidence()`.

**Tech Stack:** TypeScript, Vitest, Node filesystem APIs, OpenAI embeddings endpoint via `fetch`, local JSON vector index now, external DB adapter later.

---

### Task 1: Local Vector Index

**Files:**
- Create: `backend/src/services/dream-vector-index.ts`
- Test: `backend/tests/dream-vector-index.test.ts`

**Steps:**
1. Write a failing test for cosine search over stored chunk vectors.
2. Write a failing test for saving and loading the index as JSON.
3. Implement `createDreamVectorIndex`, `searchDreamVectorIndex`, `saveDreamVectorIndex`, and `loadDreamVectorIndex`.
4. Run focused tests.

### Task 2: Embedding Interface and Ingestion

**Files:**
- Create: `backend/src/services/dream-embedding-provider.ts`
- Create: `backend/src/services/dream-rag-ingestion.ts`
- Test: `backend/tests/dream-rag-ingestion.test.ts`

**Steps:**
1. Write a failing test using a deterministic fake embedding provider.
2. Implement `ingestDreamRagVectorIndex()` from localized RAG chunks.
3. Ensure vector/chunk counts match and metadata is retained.
4. Run focused tests.

### Task 3: OpenAI Embedding Provider

**Files:**
- Create: `backend/src/services/openai-embeddings-provider.ts`
- Test: `backend/tests/openai-embeddings-provider.test.ts`
- Modify: `frontend/.env.example`

**Steps:**
1. Write a failing test that the provider calls `/embeddings` with model and input.
2. Write a failing env factory test for `MANYANG_OPENAI_EMBEDDING_MODEL`.
3. Implement the provider without printing or exposing API keys.
4. Run focused tests.

### Task 4: Optional Vector Search in Retriever

**Files:**
- Modify: `backend/src/services/dream-rag-retriever.ts`
- Test: `backend/tests/dream-rag-retriever.test.ts`

**Steps:**
1. Write a failing test that vector candidates can be merged with alias/chunk candidates.
2. Add optional `vectorMatches` support to `retrieveDreamEvidence()` without making existing callers async.
3. Keep explicit alias matches ranked above weaker vector hits.
4. Run focused tests.

### Task 5: Exports and Verification

**Files:**
- Modify: `backend/src/index.ts`

**Steps:**
1. Export the new provider, ingestion, and vector index APIs.
2. Run `npm --prefix backend run typecheck`.
3. Run `npm --prefix backend test`.
4. Run `npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts`.
5. Run `npm --prefix frontend run build`.

