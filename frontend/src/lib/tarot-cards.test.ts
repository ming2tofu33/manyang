import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  getTarotCardById,
  getTarotCardByKey,
  tarotCards,
  tarotMinorCards,
  type TarotCard,
} from "./tarot-cards";
import { getTarotMajorCardById, tarotMajorCards } from "./tarot-major-cards";
import {
  getTarotMinorCardById,
  type TarotMinorCard,
} from "./tarot-minor-cards";

const publicAssetExists = (assetPath: string) =>
  existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));

describe("tarot cards", () => {
  test("combines the major arcana and all minor arcana into a 78-card deck", () => {
    expect(tarotCards).toHaveLength(78);
    expect(tarotMinorCards).toHaveLength(56);
    expect(tarotCards.map((card) => card.id)).toEqual(Array.from({ length: 78 }, (_, id) => id));
    expect(new Set(tarotCards.map((card) => card.cardKey)).size).toBe(78);
    expect(tarotCards.every((card) => card.arcana === "major" || card.arcana === "minor")).toBe(
      true,
    );
    expect(tarotCards.every((card) => card.imageKey.length > 0)).toBe(true);
  });

  test("reuses the exact resolved major and minor adapter objects", () => {
    expect(tarotCards[0]).toBe(tarotMajorCards[0]);
    expect(getTarotCardById(0)).toBe(getTarotMajorCardById(0));
    expect(tarotCards[22]).toBe(tarotMinorCards[0]);
    expect(getTarotCardById(22)).toBe(getTarotMinorCardById(22));
  });

  test("exposes the resolved web collections as readonly arrays", () => {
    type HasPush<T> = "push" extends keyof T ? true : false;
    const deckHasPush: HasPush<typeof tarotCards> = false;
    const minorHasPush: HasPush<typeof tarotMinorCards> = false;

    expect({ deckHasPush, minorHasPush }).toEqual({
      deckHasPush: false,
      minorHasPush: false,
    });
  });

  test("keeps legacy stored card snapshots assignable to the public web types", () => {
    const runtimeMajorCard = tarotCards[0];

    if (runtimeMajorCard.arcana !== "major") {
      throw new Error("Expected the first tarot card to be major arcana");
    }

    const { arcana, cardKey, imageKey, ...legacyMajorCard } = runtimeMajorCard;
    const compatibleLegacyMajorCard: TarotCard = legacyMajorCard;
    const { imageKey: legacyMinorImageKey, ...legacyMinorCard } = tarotMinorCards[0];
    const compatibleLegacyMinorCard: TarotMinorCard = legacyMinorCard;
    const compatibleStoredMinorCard: TarotCard = legacyMinorCard;

    expect(compatibleLegacyMajorCard.slug).toBe("the-fool");
    expect(compatibleLegacyMinorCard.cardKey).toBe("minor:wands:01");
    expect(compatibleStoredMinorCard.cardKey).toBe("minor:wands:01");
    expect({ arcana, cardKey, imageKey, legacyMinorImageKey }).toEqual({
      arcana: "major",
      cardKey: "major:00",
      imageKey: "major/00-the-fool.png",
      legacyMinorImageKey: "minor-cutout/wands/01-ace-of-wands.png",
    });
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

  test("uses card-specific minor arcana anchors instead of only rank-stage labels", () => {
    const nineOfPentacles = getTarotCardByKey("minor:pentacles:09");

    expect(nineOfPentacles?.visualSymbols).toContain("스스로 가꾼 정원과 손에 든 펜타클");
    expect(nineOfPentacles?.visualSymbols).not.toContain("완성 직전의 개인적 결산");
    expect(nineOfPentacles?.mood).toContain("스스로 가꾼 정원과 손에 든 펜타클");
    expect(nineOfPentacles?.mood).not.toContain("완성 직전");
    expect(nineOfPentacles?.symbolMeanings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "스스로 가꾼 정원과 손에 든 펜타클",
          meaning: expect.stringContaining("독립"),
        }),
      ]),
    );
  });

  test("uses natural Korean topic particles in generated minor card messages", () => {
    expect(getTarotCardByKey("minor:swords:07")?.upright.cardMessage).toContain(
      "소드 7은 전략이 필요한 지혜인지",
    );
    expect(getTarotCardByKey("minor:swords:14")?.upright.cardMessage).toContain(
      "소드 왕은 객관성이 성숙한 판단인지",
    );
    expect(getTarotCardByKey("minor:wands:01")?.upright.cardMessage).toContain(
      "완드 에이스는 가능성 자체보다",
    );
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
