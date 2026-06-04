import { describe, expect, test } from "vitest";

import { symbolEntries } from "../src/data/symbol-encyclopedia";
import { BICULTURAL_REVIEWED, getEncyclopediaReviewStatus } from "../src/services/encyclopedia-review-status";

describe("encyclopedia review status", () => {
  test("every reviewed id is a real symbol entry (no typos / ghosts)", () => {
    const ids = new Set(symbolEntries.map((entry) => entry.id));
    const unknown = [...BICULTURAL_REVIEWED].filter((id) => !ids.has(id));
    expect(unknown).toEqual([]);
  });

  test("status totals reconcile with the encyclopedia", () => {
    const status = getEncyclopediaReviewStatus();
    expect(status.total).toBe(symbolEntries.length);
    expect(status.reviewed + status.pendingCount).toBe(status.total);
    expect(status.reviewed).toBe(BICULTURAL_REVIEWED.size);
  });
});
