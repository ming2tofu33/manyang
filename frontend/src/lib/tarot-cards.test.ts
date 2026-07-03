import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  getTarotCardById,
  getTarotCardByKey,
  tarotCards,
  tarotMinorCards,
} from "./tarot-cards";

const publicAssetExists = (assetPath: string) =>
  existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));

describe("tarot cards", () => {
  test("combines the major arcana and all minor arcana into a 78-card deck", () => {
    expect(tarotCards).toHaveLength(78);
    expect(tarotMinorCards).toHaveLength(56);
    expect(tarotCards.map((card) => card.id)).toEqual(Array.from({ length: 78 }, (_, id) => id));
    expect(new Set(tarotCards.map((card) => card.cardKey)).size).toBe(78);
  });

  test("exposes minor cards with cutout images and stable card keys", () => {
    const aceOfWands = getTarotCardByKey("minor:wands:01");
    const knightOfPentacles = getTarotCardById(75);

    expect(aceOfWands).toMatchObject({
      id: 22,
      arcana: "minor",
      suit: "wands",
      rank: 1,
      cardKey: "minor:wands:01",
      nameKo: "완드 에이스",
      image: "/manyang/tarot/minor-cutout/wands/01-ace-of-wands.png",
    });
    expect(knightOfPentacles).toMatchObject({
      id: 75,
      arcana: "minor",
      suit: "pentacles",
      rank: 12,
      cardKey: "minor:pentacles:12",
      nameKo: "펜타클 기사",
      image: "/manyang/tarot/minor-cutout/pentacles/12-knight-of-pentacles.png",
    });
  });

  test("keeps every runtime tarot card usable by the LLM prompt and result UI", () => {
    tarotCards.forEach((card) => {
      expect(card.nameKo.trim().length).toBeGreaterThan(0);
      expect(card.nameEn).toBe(card.nameEn.toUpperCase());
      expect(card.keywords.length).toBeGreaterThanOrEqual(3);
      expect(card.visualSymbols.length).toBeGreaterThanOrEqual(2);
      expect(card.symbolMeanings.length).toBeGreaterThanOrEqual(1);
      expect(card.upright.summary.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.upright.dailyFlow.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.upright.cardMessage.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.upright.readingScene.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.reversed.summary.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.reversed.dailyFlow.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.reversed.cardMessage.trim().length).toBeGreaterThanOrEqual(12);
      expect(card.reversed.readingScene.trim().length).toBeGreaterThanOrEqual(12);
      expect(publicAssetExists(card.image)).toBe(true);
    });
  });
});
