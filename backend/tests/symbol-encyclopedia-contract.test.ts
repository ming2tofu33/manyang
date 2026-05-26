import { describe, expect, expectTypeOf, test } from "vitest";

import {
  SYMBOL_ACCESS_TIERS,
  SYMBOL_CATEGORIES,
  SYMBOL_SAFETY_LEVELS,
  SYMBOL_STATUSES,
  SUPPORTED_LOCALES,
  type LocalizedSymbolEntry,
  type SceneModifier,
  type SymbolEntry,
} from "../src/contracts/symbol-encyclopedia";

describe("symbol encyclopedia contract", () => {
  test("defines the supported locales used by the multilingual encyclopedia", () => {
    expect(SUPPORTED_LOCALES).toEqual(["ko", "en"]);
  });

  test("defines the categories and metadata enums required by retrieval", () => {
    expect(SYMBOL_CATEGORIES).toEqual([
      "place",
      "object",
      "action",
      "nature",
      "animal",
      "person",
      "emotion",
      "quantity",
      "time",
    ]);
    expect(SYMBOL_STATUSES).toEqual(["draft", "active", "deprecated"]);
    expect(SYMBOL_SAFETY_LEVELS).toEqual(["safe", "sensitive"]);
    expect(SYMBOL_ACCESS_TIERS).toEqual(["free", "premium"]);
  });

  test("requires localized entries to carry search, scene, generation, and safety fields", () => {
    const localized: LocalizedSymbolEntry = {
      label: "뱀",
      aliases: ["뱀", "구렁이", "큰 뱀"],
      searchText: "뱀, 구렁이, 생명력, 경계",
      coreMeanings: ["본능", "경계", "변화"],
      lightReadings: ["조용히 커지는 가능성", "감각이 예민해지는 흐름"],
      shadowReadings: ["압도감", "예측하기 어려운 긴장"],
      sceneModifiers: {
        many: {
          triggerTerms: ["수십 마리", "가득"],
          reading: "여러 갈래의 신호나 감각이 한꺼번에 올라오는 장면",
          weight: 0.85,
        },
      },
      contextQuestions: ["뱀이 위협했나요, 그냥 있었나요?"],
      metaphorHooks: ["조용히 움직이는 힘"],
      cardTitleSeeds: ["땅 아래 깨어난 구렁이"],
      smallPrescriptions: ["오늘은 지켜야 한다고 느끼는 영역 하나를 적어보세요."],
      safeReading: "뱀은 본능적 감각이나 조용히 커지는 움직임으로 읽을 수 있어요.",
      avoidExpressions: ["태몽이다", "위험한 일이 생긴다"],
    };

    expect(localized.sceneModifiers.many?.weight).toBe(0.85);
    expect(localized.avoidExpressions).toContain("태몽이다");
    expectTypeOf(localized.sceneModifiers.many).toEqualTypeOf<SceneModifier | undefined>();
  });

  test("requires symbol entries to include both Korean and English localizations", () => {
    const entry: SymbolEntry = {
      id: "snake",
      status: "active",
      category: "animal",
      safetyLevel: "sensitive",
      accessTier: "free",
      universalMeanings: ["instinct", "hidden movement", "change"],
      tensionAxis: ["fascination", "wariness"],
      relatedIds: ["owned_land", "many"],
      sourceBasis: ["everyday metaphor", "scene function"],
      locales: {
        ko: {
          label: "뱀",
          aliases: ["뱀", "구렁이", "큰 뱀"],
          searchText: "뱀, 구렁이, 생명력, 경계",
          coreMeanings: ["본능", "경계", "변화"],
          lightReadings: ["조용히 커지는 가능성", "감각이 예민해지는 흐름"],
          shadowReadings: ["압도감", "예측하기 어려운 긴장"],
          sceneModifiers: {},
          contextQuestions: ["뱀이 위협했나요, 그냥 있었나요?"],
          metaphorHooks: ["조용히 움직이는 힘"],
          cardTitleSeeds: ["땅 아래 깨어난 구렁이"],
          smallPrescriptions: ["오늘은 지켜야 한다고 느끼는 영역 하나를 적어보세요."],
          safeReading: "뱀은 본능적 감각이나 조용히 커지는 움직임으로 읽을 수 있어요.",
          avoidExpressions: ["태몽이다", "위험한 일이 생긴다"],
        },
        en: {
          label: "Snake",
          aliases: ["snake", "serpent", "large snake"],
          searchText: "snake, serpent, instinct, alertness",
          coreMeanings: ["instinct", "alertness", "change"],
          lightReadings: ["a quiet force becoming visible"],
          shadowReadings: ["feeling overwhelmed"],
          sceneModifiers: {},
          contextQuestions: ["Was the snake threatening you, or simply present?"],
          metaphorHooks: ["a quiet force moving under the surface"],
          cardTitleSeeds: ["The Snake Beneath the Ground"],
          smallPrescriptions: ["Write down one area of life that feels important to protect today."],
          safeReading: "A snake can point to instinctive movement or a change that feels hard to ignore.",
          avoidExpressions: ["this is a pregnancy dream", "something dangerous will happen"],
        },
      },
    };

    expect(entry.locales.ko.label).toBe("뱀");
    expect(entry.locales.en.label).toBe("Snake");
  });
});
