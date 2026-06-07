import { describe, expect, expectTypeOf, test } from "vitest";

import {
  SYMBOL_ACCESS_TIERS,
  SYMBOL_CATEGORIES,
  SYMBOL_EMBEDDING_CHUNK_TYPES,
  SYMBOL_EDITORIAL_STATUSES,
  SYMBOL_ROLES,
  SYMBOL_SAFETY_LEVELS,
  SYMBOL_STATUSES,
  SUPPORTED_LOCALES,
  type EmbeddingProfile,
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
      "person",
      "animal",
      "nature",
      "object",
      "body",
      "action",
      "event",
      "food",
      "emotion",
      "abstract",
    ]);
    expect(SYMBOL_STATUSES).toEqual(["draft", "active", "deprecated"]);
    expect(SYMBOL_SAFETY_LEVELS).toEqual(["safe", "sensitive"]);
    expect(SYMBOL_ACCESS_TIERS).toEqual(["free", "premium"]);
    expect(SYMBOL_EDITORIAL_STATUSES).toEqual(["needs_review", "approved"]);
    expect(SYMBOL_ROLES).toEqual(["primary_candidate", "modifier", "context_signal"]);
    expect(SYMBOL_EMBEDDING_CHUNK_TYPES).toEqual(["searchText", "sceneModifier", "safeReading", "metaphorHook"]);
  });

  test("defines the embedding profile for controlled RAG retrieval", () => {
    const embeddingProfile: EmbeddingProfile = {
      chunkTypes: ["searchText", "sceneModifier", "safeReading", "metaphorHook"],
    };

    expect(embeddingProfile.chunkTypes).toContain("sceneModifier");
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
      editorialStatus: "approved",
      category: "animal",
      subcategory: "animal",
      facets: ["reptile", "instinct", "hidden_movement"],
      symbolRole: ["primary_candidate"],
      safetyLevel: "sensitive",
      accessTier: "free",
      embeddingProfile: {
        chunkTypes: ["searchText", "sceneModifier", "safeReading", "metaphorHook"],
      },
      universalMeanings: ["instinct", "hidden movement", "change"],
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
    expect(entry.subcategory).toBe("animal");
    expect(entry.facets).toContain("hidden_movement");
    expect(entry.universalMeanings).toContain("change");
  });

  test("allows optional disambiguation rules for risky localized aliases", () => {
    const entry: SymbolEntry = {
      id: "horse",
      status: "active",
      editorialStatus: "approved",
      category: "animal",
      subcategory: "mammal",
      facets: ["advancement", "momentum", "travel"],
      symbolRole: ["primary_candidate"],
      safetyLevel: "safe",
      accessTier: "free",
      embeddingProfile: {
        chunkTypes: ["searchText", "sceneModifier", "safeReading", "metaphorHook"],
      },
      universalMeanings: ["advancement", "momentum", "travel"],
      relatedIds: ["running"],
      sourceBasis: ["everyday metaphor"],
      disambiguation: {
        ko: [
          {
            alias: "말",
            confirmWhen: ["말을 타", "백마", "망아지"],
            rejectWhen: ["말을 걸", "말을 하", "대화", "얘기"],
            fallback: "candidate_only",
          },
        ],
      },
      locales: {
        ko: {
          label: "말",
          aliases: ["말", "백마", "망아지"],
          searchText: "말, 백마, 전진",
          coreMeanings: ["전진", "활력", "이동"],
          lightReadings: ["앞으로 나아가는 기운"],
          shadowReadings: ["속도를 감당하기 어려움"],
          sceneModifiers: {},
          contextQuestions: ["말을 타고 있었나요?"],
          metaphorHooks: ["달리는 말"],
          cardTitleSeeds: ["달리는 말"],
          smallPrescriptions: ["오늘 움직일 방향 하나를 정해보세요."],
          safeReading: "말은 전진과 활력을 보여줄 수 있어요.",
          avoidExpressions: ["무조건 성공한다"],
        },
        en: {
          label: "Horse",
          aliases: ["horse", "white horse", "colt"],
          searchText: "horse, vitality, movement",
          coreMeanings: ["movement", "vitality", "freedom"],
          lightReadings: ["life force moving forward"],
          shadowReadings: ["runaway force"],
          sceneModifiers: {},
          contextQuestions: ["Were you riding it?"],
          metaphorHooks: ["the running horse"],
          cardTitleSeeds: ["The Running Horse"],
          smallPrescriptions: ["Choose one direction for today."],
          safeReading: "A horse can point to movement and vitality.",
          avoidExpressions: ["success is guaranteed"],
        },
      },
    };

    expect(entry.disambiguation?.ko?.[0]?.fallback).toBe("candidate_only");
  });
});
