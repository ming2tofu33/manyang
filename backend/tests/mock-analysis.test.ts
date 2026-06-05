import { describe, expect, test } from "vitest";

import { GENERAL_DREAM_GROUNDING } from "../src/services/dream-fallback-grounding";
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
    expect(result.symbols).toEqual(expect.arrayContaining(["뱀", "땅", "여럿"]));
    expect(result.themes).toEqual(expect.arrayContaining(["영역", "생명력", "압도감"]));
    expect(result.interpretation).toContain("내 영역");
    expect(result.symbolReadings.length).toBeGreaterThanOrEqual(2);
    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["뱀", "땅"]));
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

    expect(result.symbols).toEqual([]);
    expect(result.symbolReadings).toEqual([]);
    expect(result.readingBasis.usedSymbols).toEqual([]);
    // RAG-IMP-06: 무매칭이면 안전 grounding 데이터 세트의 문장으로 폴백한다.
    expect(GENERAL_DREAM_GROUNDING.map((line) => line.ko)).toContain(result.interpretation);
    expect(result.smallPrescription).toContain("한 문장");
    expect(result.readingBasis.confidence).toBeLessThan(0.8);
  });

  test("rejects empty dream text", () => {
    expect(() => analyzeDream({ dreamText: "   " })).toThrow("dreamText is required");
  });

  test("does not leak the composite wakeMood label into emotions", () => {
    const result = analyzeDream({
      dreamText: "복도를 걸었어.",
      locale: "ko",
      wakeMood: "분위기: 슬픔, 평온함 / 감각: 선명함",
      dreamAtmospheres: ["sad", "calm"],
    });

    expect(result.emotions).not.toContain("분위기: 슬픔, 평온함 / 감각: 선명함");
    expect(result.emotions.every((emotion) => !emotion.includes("분위기:"))).toBe(true);
    // 구조화된 분위기 정서는 정상적으로 들어온다.
    expect(result.emotions).toEqual(expect.arrayContaining(["슬픔", "평온함"]));
  });

  test("adds a safety notice for medical prediction requests", () => {
    const result = analyzeDream({
      dreamText: "꿈에서 병원에 있었고 피가 났어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
      locale: "ko",
      wakeMood: "anxious",
    });

    expect(result.safetyNotice).toContain("의학적 진단");
  });

  test("keeps interpretation content stable across selected cat themes", () => {
    const request = {
      dreamText: "꿈에서 학교 복도에 있었고 문이 계속 바뀌었어.",
      locale: "ko",
      wakeMood: "anxious",
    } as const;
    const black = analyzeDream({ ...request, catReaderType: "black_cat" });
    const white = analyzeDream({ ...request, catReaderType: "white_cat" });
    const gray = analyzeDream({ ...request, catReaderType: "gray_cat" });

    expect(black.readerNote).toBe("");
    expect(white.readerNote).toBe("");
    expect(gray.readerNote).toBe("");
    expect(white.interpretation).toBe(black.interpretation);
    expect(gray.interpretation).toBe(black.interpretation);
    expect(white.smallPrescription).toBe(black.smallPrescription);
    expect(gray.smallPrescription).toBe(black.smallPrescription);
    expect(gray.reader.name).toBe("잿빛냥");
    expect(gray.readerNote).not.toContain("회색냥");
    expect(gray.readerNote).not.toContain("꿈+타로");
  });

  test("localizes deterministic fallback interpretation for English dreams", () => {
    const result = analyzeDream({
      dreamText: "I dreamed an elevator stopped, then I missed a train and saw the sea.",
      locale: "en",
      wakeMood: "anxious",
    });
    const generatedText = [
      result.summary,
      result.interpretation,
      result.smallPrescription,
      result.card.message,
      ...result.symbolReadings.map((reading) => reading.reading),
    ].join(" ");

    expect(result.symbols).toEqual(expect.arrayContaining(["Elevator", "Train", "Sea"]));
    expect(generatedText).not.toMatch(/[가-힣]/);
    expect(result.interpretation).toContain("It is hard to be certain");
    expect(result.smallPrescription).toContain("one scene");
  });

  test("uses natural Korean particles in deterministic fallback readings", () => {
    const result = analyzeDream({
      dreamText: "엘리베이터에 갇혔고 바다를 봤어.",
      locale: "ko",
    });
    const generatedText = [
      result.summary,
      result.interpretation,
      ...result.symbolReadings.map((reading) => reading.reading),
    ].join(" ");

    expect(result.symbolReadings.some((reading) => reading.reading.includes("엘리베이터는"))).toBe(true);
    expect(result.symbolReadings.some((reading) => reading.reading.includes("바다는"))).toBe(true);
    expect(generatedText).not.toContain("엘리베이터은");
    expect(generatedText).not.toContain("바다은");
  });

  test("uses natural Korean and/or particles in deterministic fallback interpretation", () => {
    const result = analyzeDream({
      dreamText: "바다를 봤어.",
      locale: "ko",
    });

    expect(result.interpretation).toContain("큰 감정과 연결되어");
    expect(result.interpretation).not.toContain("큰 감정와");
  });

  test("analyzes real UTF-8 Korean snake and owned-land dream text", () => {
    const result = analyzeDream({
      dreamText: "내 땅에 큰 구렁이와 뱀이 수십 마리 나왔어.",
      locale: "ko",
      wakeMood: "surprised",
    });

    expect(result.symbols).toEqual(expect.arrayContaining(["뱀", "땅", "여럿"]));
    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["뱀", "땅"]));
    expect(result.readingBasis.confidence).toBeGreaterThanOrEqual(0.8);
  });

  test("analyzes real UTF-8 Korean object and nature dream text without falling back", () => {
    const result = analyzeDream({
      dreamText: "엘리베이터에 갇혔고 바다를 봤어.",
      locale: "ko",
      wakeMood: "anxious",
    });

    expect(result.symbols).toEqual(expect.arrayContaining(["엘리베이터", "바다"]));
    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["엘리베이터", "바다"]));
    expect(result.readingBasis.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.symbolReadings.some((reading) => reading.symbol === "엘리베이터")).toBe(true);
    expect(result.symbolReadings.some((reading) => reading.symbol === "바다")).toBe(true);
  });
});
