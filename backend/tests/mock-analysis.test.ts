import { describe, expect, test } from "vitest";

import { analyzeDream } from "../src/services/mock-analysis";

describe("analyzeDream", () => {
  test("returns an API-compatible mock analysis with runtime retrieval basis", () => {
    const result = analyzeDream({
      dreamText: "오늘 새벽에 꿈을 꾸었는데 우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.",
      dreamDate: "2026-05-24",
      wakeMood: "curious",
      dreamMood: "overwhelming",
      locale: "ko",
    });

    expect(result.dreamId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.analysisId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.cardId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.symbols).toEqual(expect.arrayContaining(["뱀", "우리 땅", "많은 수"]));
    expect(result.themes).toEqual(expect.arrayContaining(["영역", "생명력", "압도감"]));
    expect(result.interpretation).toContain("내 영역");
    expect(result.symbolReadings.length).toBeGreaterThanOrEqual(2);
    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["뱀", "우리 땅"]));
    expect(result.readingBasis.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.card.keywords.length).toBeGreaterThanOrEqual(3);

    const generatedText = [
      result.interpretation,
      result.smallPrescription,
      result.card.message,
      ...result.symbolReadings.map((reading) => reading.reading),
    ].join(" ");

    expect(generatedText).not.toMatch(/재물운|태몽|큰돈|횡재|반드시|조만간/);
  });

  test("returns a reflective fallback for low-signal dream text", () => {
    const result = analyzeDream({
      dreamText: "기억이 잘 나지는 않는데 이상한 느낌만 남았어요.",
      dreamDate: "2026-05-24",
    });

    expect(result.symbols.length).toBeGreaterThan(0);
    expect(result.interpretation).toContain("뚜렷한 상징은 적지만");
    expect(result.smallPrescription).toContain("한 문장");
    expect(result.readingBasis.confidence).toBeLessThan(0.8);
  });

  test("rejects empty dream text", () => {
    expect(() => analyzeDream({ dreamText: "   " })).toThrow("dreamText is required");
  });
});
