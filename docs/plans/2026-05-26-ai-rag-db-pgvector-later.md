# AI RAG DB pgvector Later Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the symbol encyclopedia from TypeScript seed data to Supabase/Postgres tables with pgvector semantic search only after the alias/exact MVP retrieval is validated.

**Architecture:** Keep `vault/05-Content/symbols/*.yaml` as the editorial source of truth. Generate or seed Postgres rows from that source, then build `symbol_embeddings` as a derived search index, not as canonical content. Runtime retrieval should remain hybrid: exact/alias first, keyword/BM25 next, pgvector semantic search as a recall layer.

**Tech Stack:** TypeScript, Supabase/Postgres, pgvector, backend Vitest, future migration tooling.

---

## Defer Criteria

Do not add pgvector in the current MVP pass. Start this plan only when at least one of these is true:

- Pilot encyclopedia grows beyond 50 to 100 active symbols and alias matching misses real user phrasing.
- Golden cases fail because the correct symbol is semantically implied but not directly named.
- We need multilingual semantic recall across Korean and English expressions.
- User history/personalization requires DB-backed symbol and retrieval audit storage.

## Target Tables

These tables mirror [[../../vault/05-Content/Symbol-Encyclopedia-Schema|Symbol Encyclopedia Schema]]:

```text
symbol_entries
- id text primary key
- status text
- category text
- safety_level text
- access_tier text
- universal_meanings jsonb
- tension_axis jsonb
- related_ids text[]
- source_basis jsonb
- created_at timestamptz
- updated_at timestamptz

symbol_localizations
- symbol_id text references symbol_entries(id)
- locale text
- label text
- aliases text[]
- search_text text
- core_meanings jsonb
- light_readings jsonb
- shadow_readings jsonb
- safe_reading text

symbol_scene_modifiers
- symbol_id text references symbol_entries(id)
- locale text
- modifier_key text
- trigger_terms text[]
- reading text
- weight numeric

symbol_generation_assets
- symbol_id text references symbol_entries(id)
- locale text
- metaphor_hooks jsonb
- card_title_seeds jsonb
- small_prescriptions jsonb
- avoid_expressions jsonb

symbol_culture_notes
- symbol_id text references symbol_entries(id)
- locale text
- weight numeric
- expose_by_default boolean
- notes jsonb
- safe_transform jsonb

symbol_embeddings
- id uuid primary key
- symbol_id text references symbol_entries(id)
- locale text
- chunk_type text
- chunk_key text
- content text
- embedding vector
- metadata jsonb
```

## Embedding Chunk Types

Use small, purpose-built chunks. Do not embed the entire symbol entry as one blob.

| chunk_type | chunk_key example | content source | Purpose |
| --- | --- | --- | --- |
| `searchText` | `ko.searchText` | localized `searchText` | broad semantic recall |
| `sceneModifier` | `ko.sceneModifiers.changing` | modifier reading + trigger terms | scene-level matching |
| `metaphorHook` | `ko.metaphorHooks.0` | metaphor hook text | generation flavor recall |
| `safeReading` | `ko.safeReading` | safe reading text | grounded fallback phrasing |

## Implementation Order

### Task 1: Migration Contract Test

**Files:**
- Create: `backend/tests/symbol-db-schema.test.ts`
- Create later: `supabase/migrations/<timestamp>_symbol_encyclopedia.sql`

**Steps:**

1. Write a test or migration snapshot check that verifies table names and required columns.
2. Run the focused test and confirm it fails before the migration exists.
3. Add the SQL migration.
4. Re-run the focused test.

### Task 2: YAML to DB Seed Converter

**Files:**
- Create: `backend/scripts/seed-symbol-encyclopedia.ts`
- Test: `backend/tests/symbol-seed-converter.test.ts`

**Steps:**

1. Test that the current 10 YAML files produce rows for every target table except `symbol_embeddings`.
2. Implement parser/mapper from YAML shape to normalized rows.
3. Validate that `ko` and `en` rows are both generated for every active symbol.

### Task 3: Embedding Job

**Files:**
- Create: `backend/scripts/build-symbol-embeddings.ts`
- Test: `backend/tests/symbol-embedding-chunks.test.ts`

**Steps:**

1. Test chunk generation without calling a real embedding API.
2. Generate chunks for `searchText`, `sceneModifier`, `metaphorHook`, and `safeReading`.
3. Store embedding metadata with `symbol_id`, `locale`, `chunk_type`, and `chunk_key`.
4. Add idempotent upsert behavior by `(symbol_id, locale, chunk_type, chunk_key)`.

### Task 4: Hybrid Retrieval

**Files:**
- Modify: `backend/src/services/symbol-matcher.ts`
- Create: `backend/src/services/symbol-vector-search.ts`
- Test: `backend/tests/hybrid-symbol-retrieval.test.ts`

**Steps:**

1. Keep exact/alias matcher as the first layer.
2. Add vector candidates as `matchType: "semantic"` only when exact/alias confidence is insufficient or more recall is needed.
3. Merge duplicate `entryId` results using [[../../vault/04-AI-System/Retrieval-Scoring-Contract|Retrieval Scoring Contract]].
4. Preserve `rankReason`, `matchedText`, `usedFields`, and `confidence` in the same public payload.

### Task 5: Golden Regression

**Files:**
- Modify: `backend/tests/dream-reading-golden.test.ts`

**Steps:**

1. Re-run every existing golden case with hybrid retrieval enabled.
2. Add at least three semantic-only cases where the user describes a scene without naming the symbol.
3. Confirm forbidden fortune, medical, and deterministic claims remain absent.

## Verification Commands

Run from `backend/`:

```bash
npm test
npm run typecheck
```

Run DB checks only after Supabase migration tooling exists:

```bash
supabase db reset
```

## Non-Goals

- Do not replace YAML as the editorial source.
- Do not put raw culture notes into the user-facing prompt by default.
- Do not expose vector scores directly to the frontend.
- Do not use pgvector to justify vague or unsupported interpretations.
