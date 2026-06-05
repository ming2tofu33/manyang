import { describe, expect, test } from "vitest";

import { analyzeDream } from "../src/services/mock-analysis";
import { analyzeDreamStructure } from "../src/services/structured-dream-analysis";
import { GENERAL_DREAM_GROUNDING, resolveFallbackGrounding } from "../src/services/dream-fallback-grounding";

// 점/예언/의료 단정이 새어 들어가면 안 된다(폴백도 안전해야 한다).
const FORBIDDEN = /재물|길몽|길조|태몽|재물운|반드시|무조건|질병|횡재|돈을 번다|will get rich|guaranteed|disease/i;

describe("RAG-IMP-06 fallback grounding", () => {
  test("general grounding lines are safe and provided in both locales", () => {
    expect(GENERAL_DREAM_GROUNDING.length).toBeGreaterThanOrEqual(3);

    for (const line of GENERAL_DREAM_GROUNDING) {
      expect(line.ko.length).toBeGreaterThan(10);
      expect(line.en.length).toBeGreaterThan(10);
      expect(line.ko).not.toMatch(FORBIDDEN);
      expect(line.en).not.toMatch(FORBIDDEN);
    }
  });

  test("resolveFallbackGrounding is deterministic for the same salt", () => {
    const a = resolveFallbackGrounding({ locale: "ko", salt: 42 });
    const b = resolveFallbackGrounding({ locale: "ko", salt: 42 });

    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
    expect(a).not.toMatch(FORBIDDEN);
  });

  test("anchors on a provided feeling when present", () => {
    const grounded = resolveFallbackGrounding({ locale: "ko", anchorLabels: ["불안함"], salt: 1 });
    const groundedEn = resolveFallbackGrounding({ locale: "en", anchorLabels: ["anxiety"], salt: 1 });

    expect(grounded).toContain("불안함");
    expect(groundedEn).toContain("anxiety");
    expect(grounded).not.toMatch(FORBIDDEN);
    expect(groundedEn).not.toMatch(FORBIDDEN);
  });

  test("ignores empty anchor labels and falls back to a general line", () => {
    const grounded = resolveFallbackGrounding({ locale: "ko", anchorLabels: ["", "   "], salt: 2 });
    const expected = GENERAL_DREAM_GROUNDING[2 % GENERAL_DREAM_GROUNDING.length];

    expect(grounded).toBe(expected?.ko);
  });

  test("structured analysis sets fallbackGrounding only when no symbol is matched", () => {
    const noSymbol = analyzeDreamStructure({
      dreamText: "도무지 무엇인지 모를 어렴풋한 기분만 남아 맴돌았어.",
      locale: "ko",
    });
    const withSymbol = analyzeDreamStructure({
      dreamText: "큰 구렁이가 우리 땅에 나타났어.",
      locale: "ko",
    });

    expect(noSymbol.symbolCandidates.some((candidate) => candidate.source === "explicit")).toBe(false);
    expect(noSymbol.fallbackGrounding).toBeDefined();
    expect(noSymbol.fallbackGrounding ?? "").not.toMatch(FORBIDDEN);

    expect(withSymbol.symbolCandidates.some((candidate) => candidate.source === "explicit")).toBe(true);
    expect(withSymbol.fallbackGrounding).toBeUndefined();
  });

  test("anchors the fallback on the user's selected atmosphere", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "도무지 무엇인지 모를 어렴풋한 기분만 남아 맴돌았어.",
      dreamAtmospheres: ["anxious"],
      locale: "ko",
    });

    expect(analysis.fallbackGrounding).toContain("불안함");
  });

  test("mock baseline uses fallback grounding for an unregistered dream and stays safe", () => {
    const result = analyzeDream({
      dreamText: "도무지 무엇인지 모를 어렴풋한 기분만 남아 맴돌았어.",
      dreamAtmospheres: ["anxious"],
      locale: "ko",
    });

    expect(result.symbols).toEqual([]);
    expect(result.interpretation).toContain("불안함");
    expect(
      [result.interpretation, result.smallPrescription, result.card.message].join(" "),
    ).not.toMatch(FORBIDDEN);
  });
});
