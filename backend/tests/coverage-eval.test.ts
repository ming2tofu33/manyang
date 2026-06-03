import { describe, expect, test } from "vitest";

import { symbolEntries } from "../src/data/symbol-encyclopedia";
import { COMMON_DREAM_SYMBOLS, evaluateCoverage } from "../src/services/coverage-eval";

describe("coverage eval", () => {
  test("every existsAs id points to a real encyclopedia entry", () => {
    const ids = new Set(symbolEntries.map((entry) => entry.id));
    const unknown = COMMON_DREAM_SYMBOLS.map((p) => p.existsAs).filter(
      (id): id is string => id !== null && !ids.has(id),
    );
    expect(unknown).toEqual([]);
  });

  test("known concepts stay matchable by their bare keyword (no matching gaps)", () => {
    const report = evaluateCoverage();
    const matchingGaps = report.results.filter((r) => r.status === "matching_gap").map((r) => r.keyword);
    // 2026-06-03: 0 matching gaps. This guards that bare-keyword matching of existing
    // symbols does not regress (e.g., a future alias/label change breaking a known concept).
    expect(matchingGaps).toEqual([]);
    expect(report.coverageRateAmongKnown).toBe(1);
  });
});
