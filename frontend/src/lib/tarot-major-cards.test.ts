import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { getTarotMajorCardById, tarotMajorCards } from "./tarot-major-cards";

const publicAssetExists = (assetPath: string) =>
  existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));

const expectNonTrivialText = (value: string) => {
  expect(value.trim().length).toBeGreaterThanOrEqual(12);
};

const expectedSlugs = [
  "the-fool",
  "the-magician",
  "the-high-priestess",
  "the-empress",
  "the-emperor",
  "the-hierophant",
  "the-lovers",
  "the-chariot",
  "strength",
  "the-hermit",
  "wheel-of-fortune",
  "justice",
  "the-hanged-man",
  "death",
  "temperance",
  "the-devil",
  "the-tower",
  "the-star",
  "the-moon",
  "the-sun",
  "judgement",
  "the-world",
] as const;

describe("tarot major cards", () => {
  test("defines all major arcana cards in id order", () => {
    expect(tarotMajorCards).toHaveLength(22);
    expect(tarotMajorCards.map((card) => card.id)).toEqual(Array.from({ length: 22 }, (_, id) => id));
    expect(tarotMajorCards.map((card) => card.slug)).toEqual(expectedSlugs);
  });

  test("uses expected display names and slugs for the first and final cards", () => {
    expect(tarotMajorCards[0]).toMatchObject({
      slug: "the-fool",
      nameKo: "바보",
      nameEn: "THE FOOL",
    });
    expect(tarotMajorCards[21]).toMatchObject({
      slug: "the-world",
      nameKo: "세계",
      nameEn: "THE WORLD",
    });
  });

  test("provides concise initial reading content and public images for every card", () => {
    tarotMajorCards.forEach((card) => {
      expect(card.keywords.length).toBeGreaterThanOrEqual(3);
      expect(card.visualSymbols.length).toBeGreaterThanOrEqual(2);
      expectNonTrivialText(card.mood);
      expectNonTrivialText(card.upright.summary);
      expectNonTrivialText(card.upright.dailyFlow);
      expectNonTrivialText(card.upright.advice);
      expectNonTrivialText(card.reversed.summary);
      expectNonTrivialText(card.reversed.dailyFlow);
      expectNonTrivialText(card.reversed.advice);
      expect("symbolMeanings" in card).toBe(false);
      expect("story" in card.upright).toBe(false);
      expect("reflectionQuestion" in card.upright).toBe(false);
      expect("smallAction" in card.upright).toBe(false);
      expect("story" in card.reversed).toBe(false);
      expect("reflectionQuestion" in card.reversed).toBe(false);
      expect("smallAction" in card.reversed).toBe(false);
      expect(publicAssetExists(card.image)).toBe(true);
      expect(card.nameEn).toBe(card.nameEn.toUpperCase());
      expect(card.image).toBe(`/manyang/tarot/major/${String(card.id).padStart(2, "0")}-${card.slug}.png`);
    });
  });

  test("keeps the original concise tarot dictionary wording", () => {
    expect(getTarotMajorCardById(2)).toMatchObject({
      mood: "겉으로 드러난 정보보다 조용한 감각과 숨은 흐름이 중요한 분위기입니다.",
      upright: {
        advice: "말을 늘리기보다 정보를 모으고 내면의 감각을 차분히 확인하세요.",
      },
    });
    expect(getTarotMajorCardById(8)).toMatchObject({
      upright: {
        dailyFlow: "강한 반응보다 차분한 태도가 더 큰 영향력을 만들 수 있습니다.",
      },
    });
    expect(getTarotMajorCardById(17)).toMatchObject({
      reversed: {
        advice: "거창한 확신보다 오늘 회복을 돕는 작은 행동 하나를 선택하세요.",
      },
    });
  });

  test("finds major arcana cards by id", () => {
    expect(getTarotMajorCardById(18)?.nameKo).toBe("달");
    expect(getTarotMajorCardById(999)).toBeNull();
  });
});
