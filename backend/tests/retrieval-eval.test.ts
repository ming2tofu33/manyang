import { describe, expect, test } from "vitest";

import { symbolEntries } from "../src/data/symbol-encyclopedia";
import { evaluateRetrieval, RETRIEVAL_EVAL_CASES } from "../src/services/retrieval-eval";

describe("retrieval eval harness", () => {
  test("every expected symbol id is a real encyclopedia entry", () => {
    const ids = new Set(symbolEntries.map((entry) => entry.id));
    const unknown = RETRIEVAL_EVAL_CASES.flatMap((c) => c.expected).filter((id) => !ids.has(id));
    expect(unknown).toEqual([]);
  });

  test("computes recall/precision and guards against regression below the 2026-06-03 baseline", () => {
    const report = evaluateRetrieval(undefined, 5);

    expect(report.aggregate.caseCount).toBe(RETRIEVAL_EVAL_CASES.length);

    // 2026-06-03 baseline: micro 0.842 / macro 0.781 / precision 0.698.
    // After alias + lemma-friendly aliases (water/funeral/being_chased 등): micro 0.912 / macro 0.891 / precision 0.823.
    // 2026-06-04 RAG-IMP-04 (past-tense/molar aliases, "와서" suffix): micro 1.0 / macro 1.0 / precision 0.885 — all tags 1.0.
    // (Lexical only — no lemma/vector. Hybrid+lemma reaches macro ~0.938, measured via `npm run eval:retrieval:vector`.)
    // Floors sit just under the improved numbers to lock the gain and catch regressions.
    expect(report.aggregate.microRecall).toBeGreaterThanOrEqual(0.95);
    expect(report.aggregate.macroRecall).toBeGreaterThanOrEqual(0.95);
    expect(report.aggregate.macroPrecision).toBeGreaterThanOrEqual(0.85);

    const common = report.aggregate.byTag.common;
    const tradition = report.aggregate.byTag.tradition;
    expect(common).toBeDefined();
    expect(tradition).toBeDefined();
    expect(common?.macroRecall ?? 0).toBeGreaterThanOrEqual(0.95);
    expect(tradition?.macroRecall ?? 0).toBeGreaterThanOrEqual(0.95);
  });
});
