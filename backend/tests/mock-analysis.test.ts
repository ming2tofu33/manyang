import { describe, expect, test } from "vitest";

import { analyzeDream } from "../src/services/mock-analysis";

describe("analyzeDream", () => {
  test("returns an API-compatible mock analysis with matched symbols", () => {
    const result = analyzeDream({
      dreamText: "낡은 학교 복도에서 신발을 잃어버렸어요.",
      dreamDate: "2026-05-24",
      wakeMood: "anxious",
    });

    expect(result.dreamId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.analysisId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.cardId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.symbols).toEqual(expect.arrayContaining(["학교", "복도", "신발", "잃어버림"]));
    expect(result.emotions).toContain("불안");
    expect(result.interpretation).toContain("단정하긴 어렵지만");
    expect(result.card.keywords.length).toBeGreaterThanOrEqual(3);
  });

  test("returns a reflective fallback for low-signal dream text", () => {
    const result = analyzeDream({
      dreamText: "기억이 잘 나지는 않는데 이상한 느낌만 남았어요.",
      dreamDate: "2026-05-24",
    });

    expect(result.symbols.length).toBeGreaterThan(0);
    expect(result.interpretation).toContain("뚜렷한 상징은 적지만");
    expect(result.smallPrescription).toContain("한 문장");
  });

  test("rejects empty dream text", () => {
    expect(() => analyzeDream({ dreamText: "   " })).toThrow("dreamText is required");
  });
});
