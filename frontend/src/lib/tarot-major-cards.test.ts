import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { getTarotMajorCardById, tarotMajorCards } from "./tarot-major-cards";

const publicAssetExists = (assetPath: string) =>
  existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));

const expectNonTrivialText = (value: string) => {
  expect(value.trim().length).toBeGreaterThanOrEqual(12);
};

const collectStringValues = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringValues(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap((item) => collectStringValues(item));
  }

  return [];
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
      expect(card.symbolMeanings.length).toBeGreaterThanOrEqual(3);
      card.symbolMeanings.forEach((symbolMeaning) => {
        expect(symbolMeaning.symbol.trim().length).toBeGreaterThanOrEqual(1);
        expectNonTrivialText(symbolMeaning.meaning);
      });
      expectNonTrivialText(card.mood);
      expectNonTrivialText(card.upright.summary);
      expectNonTrivialText(card.upright.dailyFlow);
      expectNonTrivialText(card.upright.cardMessage);
      expectNonTrivialText(card.upright.readingScene);
      expectNonTrivialText(card.reversed.summary);
      expectNonTrivialText(card.reversed.dailyFlow);
      expectNonTrivialText(card.reversed.cardMessage);
      expectNonTrivialText(card.reversed.readingScene);
      expect("advice" in card.upright).toBe(false);
      expect("story" in card.upright).toBe(false);
      expect("advice" in card.reversed).toBe(false);
      expect("story" in card.reversed).toBe(false);
      expect("reflectionQuestion" in card.upright).toBe(false);
      expect("smallAction" in card.upright).toBe(false);
      expect("reflectionQuestion" in card.reversed).toBe(false);
      expect("smallAction" in card.reversed).toBe(false);
      expect(publicAssetExists(card.image)).toBe(true);
      expect(card.nameEn).toBe(card.nameEn.toUpperCase());
      expect(card.image).toBe(`/manyang/tarot/major/${String(card.id).padStart(2, "0")}-${card.slug}.png`);
    });
  });

  test("keeps tarot dictionary copy away from repeated AI-like filler patterns", () => {
    const bannedCopyPatterns = [/차분/, /조용/, /흐름/, /작은 행동/, /행동 하나/, /충분합니다/];

    tarotMajorCards.forEach((card) => {
      collectStringValues(card).forEach((text) => {
        bannedCopyPatterns.forEach((pattern) => {
          expect(text).not.toMatch(pattern);
        });
      });
    });
  });

  test("uses scene-led tarot wording for the rewritten card messages", () => {
    expect(getTarotMajorCardById(2)).toMatchObject({
      symbolMeanings: expect.arrayContaining([
        expect.objectContaining({ symbol: "베일" }),
      ]),
      upright: {
        readingScene: expect.stringContaining("아직 다 드러나지 않은"),
        cardMessage: "여사제는 아직 다 드러나지 않은 일을 가리킵니다. 지금 보이는 말보다 숨겨진 맥락이 더 중요할 수 있습니다.",
      },
    });
    expect(getTarotMajorCardById(8)).toMatchObject({
      upright: {
        readingScene: expect.stringContaining("사자를 억누르지"),
        cardMessage: "힘 카드는 크게 밀어붙이는 장면이 아닙니다. 사자를 억누르지 않고 다루는 그림처럼, 오늘 필요한 힘은 끝까지 태도를 잃지 않는 쪽에 가깝습니다.",
      },
    });
    expect(getTarotMajorCardById(17)).toMatchObject({
      reversed: {
        readingScene: expect.stringContaining("눈이 어둠에 익숙해진"),
        cardMessage: "별 역방향은 희망이 사라졌다는 뜻보다, 아직 눈이 어둠에 익숙해진 상태에 가깝습니다. 남아 있는 빛의 단서를 너무 빨리 의심하지 않는 게 중요합니다.",
      },
    });
  });

  test("finds major arcana cards by id", () => {
    expect(getTarotMajorCardById(18)?.nameKo).toBe("달");
    expect(getTarotMajorCardById(999)).toBeNull();
  });
});
