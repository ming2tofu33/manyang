# AI RAG Implementation Handoff Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the accepted dream-reading contracts and pilot symbol YAML files into backend runtime data, retrieval scoring, and golden-case validation.

**Architecture:** Keep `vault/05-Content/symbols/*.yaml` as the editorial source of truth. Convert or load those symbols into backend runtime entries, then use exact/alias matching first and keep the shape vector-ready for later pgvector. The LLM pipeline should consume structured analysis, retrieval matches, and generated readings according to `Dream-Reading-Contracts`.

**Tech Stack:** TypeScript, Node.js, backend Vitest, existing `@manyang/backend` package, future Supabase/Postgres/pgvector.

---

## Implementation Status

Completed on 2026-05-26.

- Runtime symbol contracts, pilot data, retrieval scoring, runtime matcher, structured analysis mock, enriched mock analysis response, golden tests, public exports, and pgvector deferral plan are implemented.
- Verification: `backend` `npm test` and `npm run typecheck` pass.
- pgvector remains post-MVP. See `docs/plans/2026-05-26-ai-rag-db-pgvector-later.md`.

---

## References

- `vault/04-AI-System/Dream-Reading-Contracts.md`
- `vault/04-AI-System/Retrieval-Scoring-Contract.md`
- `vault/05-Content/Symbol-Encyclopedia-Schema.md`
- `vault/05-Content/symbols/*.yaml`
- `vault/07-Operations/Dream-Reading-Golden-Test-Set.md`
- `backend/src/contracts/dream.ts`
- `backend/src/services/symbol-matcher.ts`
- `backend/src/services/mock-analysis.ts`

## Implementation Order

### Task 1: Add Symbol Encyclopedia Runtime Types

**Files:**
- Create: `backend/src/contracts/symbol-encyclopedia.ts`
- Test: `backend/tests/symbol-encyclopedia-contract.test.ts`

**Steps:**

1. Write tests for allowed categories, locale keys, scene modifier shape, and required runtime fields.
2. Add TypeScript types that mirror `Symbol-Encyclopedia-Schema`.
3. Run `npm test -- symbol-encyclopedia-contract` in `backend`.
4. Run `npm run typecheck` in `backend`.

**Done when:** types compile and tests prove `ko/en`, `searchText`, `sceneModifiers`, and `avoidExpressions` are required by shape.

### Task 2: Add Pilot Symbol Runtime Data

**Files:**
- Create: `backend/src/data/symbol-encyclopedia.ts`
- Test: `backend/tests/symbol-encyclopedia-data.test.ts`
- Source reference: `vault/05-Content/symbols/*.yaml`

**Steps:**

1. Start with a manual TypeScript seed copied from the 10 YAML pilot files. Avoid YAML parsing in this first implementation unless a generation script is explicitly needed.
2. Include `snake`, `owned_land`, `door`, `school`, `corridor`, `searching`, `many`, `dawn`, `water`, `cat`.
3. Test every active symbol has `ko` and `en` localizations.
4. Test every locale has at least 3 scene modifiers and at least 2 `avoidExpressions`.
5. Run backend tests and typecheck.

**Done when:** backend has runtime data equivalent to the pilot YAML and all completeness tests pass.

### Task 3: Implement Retrieval Scoring

**Files:**
- Create: `backend/src/services/retrieval-scoring.ts`
- Test: `backend/tests/retrieval-scoring.test.ts`

**Steps:**

1. Add base scores for `exact`, `alias`, `keyword`, `semantic`, `related`, `fallback`.
2. Add boosts and penalties from `Retrieval-Scoring-Contract`.
3. Implement `clamp` and `importance` boost.
4. Test exact/alias candidates rank above semantic candidates.
5. Test `evidenceText` missing candidates are penalized.
6. Test `fallback` cannot become primary.

**Done when:** scoring returns deterministic confidence and primary/supporting/excluded group decisions.

### Task 4: Replace Legacy Symbol Matcher with Runtime Symbol Search

**Files:**
- Modify: `backend/src/services/symbol-matcher.ts`
- Test: `backend/tests/symbol-matcher.test.ts`

**Steps:**

1. Keep current exact/alias matching behavior as the first search layer.
2. Return the new payload shape: `entryId`, `locale`, `label`, `matchType`, `confidence`, `matchedText`, `usedFields`, `rankReason`, `evidence`.
3. Add locale support with default `ko`.
4. Add scene modifier detection from `triggerTerms`.
5. Keep vector search out of scope for this task.
6. Run existing symbol matcher tests and add new tests for `snake`, `owned_land`, and `door.changing`.

**Done when:** current mock analyzer can still match old symbols, while new matches include confidence and evidence.

### Task 5: Add Structured Analysis Mock

**Files:**
- Create: `backend/src/services/structured-dream-analysis.ts`
- Test: `backend/tests/structured-dream-analysis.test.ts`

**Steps:**

1. Implement a deterministic mock that returns `StructuredDreamAnalysis` for the golden cases without calling an LLM.
2. Cover the snake/owned land case, school/corridor/changing door case, and ambiguous searching case.
3. Include `literalQueries`, `sceneQueries`, `themeQueries`, `modifierQueries`.
4. Include `safetySignals` for distress and medical request cases.

**Done when:** the backend can simulate stage 1 outputs for retrieval tests.

### Task 6: Update Mock Analysis to Use New Retrieval

**Files:**
- Modify: `backend/src/services/mock-analysis.ts`
- Test: `backend/tests/mock-analysis.test.ts`

**Steps:**

1. Pipe mock structured analysis into new symbol retrieval.
2. Generate public response with `readingBasis`.
3. Keep existing public fields so the frontend does not break.
4. Add `symbolReadings` if the frontend can ignore unknown fields safely.
5. Ensure forbidden claims are not emitted in mock output.

**Done when:** current API route can keep returning displayable mock results with richer retrieval metadata.

### Task 7: Add Golden Case Tests

**Files:**
- Create: `backend/tests/dream-reading-golden.test.ts`
- Reference: `vault/07-Operations/Dream-Reading-Golden-Test-Set.md`

**Steps:**

1. Encode GOLD-KO-001, GOLD-KO-002, GOLD-EN-003, GOLD-KO-004, and GOLD-EN-008 as tests first.
2. Assert required symbols are present in `readingBasis.usedSymbols`.
3. Assert `mustAvoid` strings are absent from `interpretation`, `symbolReadings`, `card.message`, and `smallPrescription`.
4. Assert distress/medical cases set an appropriate safety notice or route flag.
5. Add remaining golden cases after core pass.

**Done when:** golden tests protect the main failure modes before a real LLM is connected.

### Task 8: Document DB and pgvector Migration Later

**Files:**
- Create: `docs/plans/2026-05-26-ai-rag-db-pgvector-later.md`

**Steps:**

1. Convert `Symbol-Encyclopedia-Schema` DB tables into a future migration outline.
2. Define `symbol_embeddings` chunk types: `searchText`, `sceneModifier`, `metaphorHook`.
3. Mark pgvector as post-MVP unless alias/exact search fails on golden cases.

**Done when:** vector DB is clearly deferred without blocking MVP implementation.

## Verification Commands

Run from `backend/`:

```bash
npm test
npm run typecheck
```

Run from `frontend/` after API response changes:

```bash
npm test
npm run lint
npm run build
```

## Non-Goals

- Do not connect a real LLM in this pass.
- Do not add pgvector in the first implementation pass.
- Do not expose internal `grounding` or evaluation details to the frontend by default.
- Do not replace existing frontend result UI unless the public response contract changes.

## Commit Sequence

1. `feat(backend): add symbol encyclopedia contracts`
2. `feat(backend): add pilot symbol runtime data`
3. `feat(backend): add retrieval scoring`
4. `feat(backend): use scored symbol retrieval in mock analysis`
5. `test(backend): add dream reading golden cases`
