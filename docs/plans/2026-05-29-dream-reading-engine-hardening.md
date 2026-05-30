# Dream Reading Engine Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the current safety-first dream reading pipeline into a broader production engine by adding API validation, expanding the symbol knowledge base, replacing demo-style structure extraction, and making RAG recall useful without sacrificing evidence control.

**Architecture:** Keep the existing deterministic baseline, evidence gate, safety policy, and LLM fallback architecture. Improve the weak layers in order: request boundary, content coverage, structure extraction, retrieval policy, safety matching, then live quality evaluation.

**Tech Stack:** TypeScript, Next.js route handlers, Vitest, local curated YAML/runtime symbol data, OpenAI Responses/Embeddings providers, future pgvector migration.

---

## Phase Overview

### Phase 1: API Boundary Validation

**Goal:** Stop invalid, oversized, or unexpected request bodies before they reach LLM/RAG code.

**Files:**
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Test: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Validation Contract:**
- `dreamText` is required, must be a non-empty string after trim, and must be at most `1000` characters to match the write form.
- `locale`, when present, must be `ko` or `en`.
- `catReaderType`, when present, must be `black_cat`, `white_cat`, `cheese_cat`, or `gray_cat`.
- `dreamDate`, when present, must be `YYYY-MM-DD`.
- `wakeMood`, `dreamMood`, and `userTimeZone`, when present, must be bounded strings.
- Invalid JSON returns `400`.
- Unknown fields are ignored by passing only the sanitized request to the backend.

**TDD Steps:**
1. Add failing route tests for malformed JSON, non-object body, invalid enum fields, oversized `dreamText`, and sanitized valid body.
2. Run `npm --prefix frontend test -- src/app/api/dreams/analyze/route.test.ts` and verify failures are validation-related.
3. Add a small local validator in `route.ts`; do not introduce a new dependency yet.
4. Pass only the sanitized request into `analyzeDream` / `analyzeDreamWithLlm`.
5. Run focused route tests, then frontend tests/build.

### Phase 2: Knowledge Base Expansion

**Goal:** Increase practical dream-symbol coverage from 30 entries to at least 100 entries before loosening RAG recall.

**Files:**
- Modify: `backend/src/data/symbol-encyclopedia.ts`
- Create/Modify: `vault/05-Content/symbols/*.yaml`
- Test: `backend/tests/symbol-encyclopedia-data.test.ts`, `backend/tests/symbol-encyclopedia-contract.test.ts`

**Approach:**
- Add entries by usage category, not random lists: family/person, body/health, home/rooms, work/school, transport, money, relationship, death/loss, animals, weather/nature, conflict/chase, public places.
- Keep v0.2 fields complete: aliases, sceneModifiers, facets, symbolRole, interpretationLenses, embeddingProfile, avoidExpressions.
- Add 10 to 20 entries per batch with tests passing after each batch.

**Progress:**
- 2026-05-29 Phase 2A added the first 20 coverage entries, expanding the runtime and YAML encyclopedia from 30 to 50 symbols: `mother`, `father`, `friend`, `partner`, `ex_partner`, `death`, `funeral`, `baby`, `pregnancy`, `toilet`, `bathroom`, `car`, `bus`, `train`, `airplane`, `workplace`, `money`, `phone`, `teeth`, `hair`.
- Sensitive symbolic areas are marked `sensitive` where needed: death/funeral, pregnancy, money, and teeth.
- 2026-05-29 Phase 2B added the next 20 coverage entries, expanding the runtime and YAML encyclopedia from 50 to 70 symbols: `road`, `bridge`, `bed`, `kitchen`, `food`, `clothes`, `body`, `blood`, `crying`, `falling`, `flying`, `swimming`, `fighting`, `being_chased`, `exam`, `wedding`, `crowd`, `mountain`, `tree`, `flower`.
- `body`, `blood`, and `wedding` are marked `sensitive`. Because `blood` is now registered evidence, medical-safety scene-only tests were updated so unregistered health terms such as `cancer` remain scene-only while `blood` can be interpreted only when directly matched.

### Phase 3: Structure Analysis Refactor

**Goal:** Replace hardcoded `if includes(...)` extraction with KB-driven candidate extraction.

**Files:**
- Modify: `backend/src/services/structured-dream-analysis.ts`
- Test: `backend/tests/structured-dream-analysis.test.ts`, `backend/tests/dream-reading-golden.test.ts`

**Approach:**
- Build candidates from runtime symbol aliases and scene modifier triggers.
- Extract scene facts from matched symbols/modifiers rather than hand-coded demo cases.
- Preserve current golden behavior for snake/land and school/door/corridor.
- Mark unmatched noun-like details as scene-only candidates rather than symbolic evidence.

**Progress:**
- 2026-05-29 Phase 3 replaced the demo `if includes(...)` chain in `structured-dream-analysis` with runtime encyclopedia extraction. The analyzer now scans localized labels, aliases, and `sceneModifiers.triggerTerms` across the active symbol KB.
- Existing snake/owned-land and school/door/corridor behavior is preserved through compatibility query labels such as `largeSnake`, `manySnakes`, `ownedLand`, and `changingDoor`.
- English unmatched noun-like details are emitted as low-confidence inferred candidates without `candidateId`, so the evidence gate can keep them scene-only instead of letting the LLM interpret them symbolically.

### Phase 4: RAG Evidence Policy

**Goal:** Let RAG improve recall while preventing unrelated symbols from entering final interpretation.

**Files:**
- Modify: `backend/src/services/dream-rag-retriever.ts`
- Modify: `backend/src/services/evidence-gate.ts`
- Modify: `backend/src/services/dream-reading-prompt.ts`
- Test: `backend/tests/dream-rag-retriever.test.ts`, `backend/tests/evidence-gate.test.ts`, `backend/tests/llm-dream-analysis.test.ts`

**Approach:**
- Split retrieval into `confirmedEvidence` and `candidateEvidence`.
- Confirmed evidence can be interpreted symbolically.
- Candidate evidence can be shown to LLM as possible context, but cannot be used for symbolic claims unless promoted by stronger evidence.
- Add tests for broad semantic false positives such as fish appearing in snake-land dreams.

**Progress:**
- 2026-05-30 Phase 4 split RAG retrieval into `confirmedEvidence` and `candidateEvidence`. The legacy `retrieveDreamEvidence` API now returns only confirmed evidence, while `retrieveDreamEvidenceSet` exposes both lanes for prompt/evidence-gate use.
- Confirmed evidence is explicit alias/label matches plus semantic/vector support for those same explicit symbols. Candidate evidence may introduce new semantic/vector symbols even when explicit symbols already exist, but chunk-only or vector-only candidates stay context-only.
- 2026-05-30 follow-up: a non-sensitive new symbol can be promoted to confirmed evidence only when strong semantic chunks and high-scoring vector search agree on the same symbol. Sensitive symbols are not auto-promoted without explicit text.
- Semantic chunk candidates now require multiple meaningful matched terms and ignore broad terms such as emotion/mind/scene/difficult/blurry, reducing false positives from generic chunk overlap.
- Vector-only matches require a configurable high score threshold and remain candidate evidence instead of being interpreted symbolically by default.
- Candidate evidence is passed to the prompt as context-only payload and to the evidence gate as scene-only terms, so the LLM can notice the literal scene without adding symbolic claims for unconfirmed symbols.

### Phase 5: Safety Matching Precision

**Goal:** Reduce substring false positives while keeping medical, financial, pregnancy, and self-harm safety protections.

**Files:**
- Modify: `backend/src/services/dream-safety-policy.ts`
- Test: `backend/tests/dream-safety-policy.test.ts`

**Approach:**
- Add token/phrase-boundary matching for Korean and English.
- Keep high-risk exact phrases sensitive.
- Add negative tests for `커피`, `피곤`, `피아노`, unrelated `암` substrings, and unrelated `돈` substrings.

**Progress:**
- 2026-05-30 Phase 5 replaced raw substring safety matching with boundary-aware matching.
- Korean safety terms now match exact tokens plus common particles/endings, so `피가`, `암을`, `돈이`, `큰 병이나`, and `죽고 싶었어` still trigger the right safety policy.
- Korean ordinary words that merely contain sensitive substrings no longer trigger safety notices, including `커피`, `피곤`, `피아노`, `암막`, `암호`, `돈까스`, and `돈독한`.
- English safety terms now require word/phrase boundaries, preventing matches inside longer unrelated words such as `diet`, `birthday`, `skilled`, and `enriched`-style compounds while preserving real terms like `blood`, `cancer`, `pregnancy dream`, `lottery`, `death`, and `don't want to live`.

### Phase 6: Live Quality Evaluation Harness

**Goal:** Make quality changes measurable before and after every prompt/RAG/KB update.

**Files:**
- Modify: `backend/src/scripts/live-prompt-quality-check.ts`
- Create: `output/eval/*.md` reports as generated artifacts
- Test: focused backend tests plus optional live smoke

**Approach:**
- Maintain 15 to 20 fixed live cases.
- Report specificity, grounded symbols, scene-only violations, safety notice placement, persona difference, provider errors, and latency.
- Track fallback separately from successful LLM output.

**Progress:**
- 2026-05-30 Phase 6 added a testable live quality evaluation harness in `dream-reading-quality-eval`.
- The fixed eval set contains 16 Korean/English cases covering specificity, safety-sensitive readings, persona comparison, RAG grounding, and timeout fallback.
- The harness produces before/after JSON and Markdown reports with detail hit rate, expected symbol hit rate, safety notice/forbidden-claim checks, persona group comparison, provider errors, latency, fallback count, and timeout fallback count.
- `npm --prefix backend run quality:live -- <caseId>` runs selected live cases; omitting case IDs runs the full fixed set.
- A one-case live smoke for `ko_school_corridor_black` generated `output/eval/live-dream-quality-2026-05-29T15-43-17-581Z.json` and `.md`, with totalCases 1, fallbackCount 0, averageDetailHitRate 1.0, and averageExpectedSymbolHitRate 1.0.

## Execution Order

1. Finish Phase 1 completely before expanding KB.
2. Expand KB in batches and keep all backend tests green after each batch.
3. Refactor structure analysis only after the KB has enough aliases/modifiers to power it.
4. Loosen RAG recall only after confirmed/candidate evidence can be represented.
5. Tighten safety matching with regression tests.
6. Use the live eval harness after each major phase, not as a replacement for unit tests.
