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

  test("provides symbolic reading content and public images for every card", () => {
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
      expect(publicAssetExists(card.image)).toBe(true);
      expect(card.nameEn).toBe(card.nameEn.toUpperCase());
      expect(card.image).toBe(`/manyang/tarot/major/${String(card.id).padStart(2, "0")}-${card.slug}.png`);
    });
  });

  test("finds major arcana cards by id", () => {
    expect(getTarotMajorCardById(18)?.nameKo).toBe("달");
    expect(getTarotMajorCardById(999)).toBeNull();
  });
});
