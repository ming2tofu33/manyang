import { describe, expect, test } from "vitest";

import type { TarotMajorCardContent } from "@manyang/contracts/tarot";
import {
  getTarotMajorCardContentById as getTarotMajorCardContentByIdFromSubpath,
  tarotMajorCardContent as tarotMajorCardContentFromSubpath,
} from "@manyang/content/tarot/major";

import * as tarotContent from "./index";
import { getTarotMajorCardContentById, tarotMajorCardContent } from "./major";

describe("shared major arcana content", () => {
  test("defines exactly 22 major cards in id order", () => {
    expect(tarotMajorCardContent).toHaveLength(22);
    expect(tarotMajorCardContent.map((card) => card.id)).toEqual(
      Array.from({ length: 22 }, (_, id) => id),
    );
    expect(tarotMajorCardContent.every((card) => card.arcana === "major")).toBe(true);
  });

  test("exposes the shared collection as a readonly array", () => {
    type HasPush<T> = "push" extends keyof T ? true : false;
    const hasPush: HasPush<typeof tarotMajorCardContent> = false;

    expect(hasPush).toBe(false);
  });

  test("derives stable unique card and image keys", () => {
    expect(new Set(tarotMajorCardContent.map((card) => card.cardKey)).size).toBe(22);
    expect(new Set(tarotMajorCardContent.map((card) => card.imageKey)).size).toBe(22);

    tarotMajorCardContent.forEach((card) => {
      expect(card.cardKey).toBe(`major:${String(card.id).padStart(2, "0")}`);
      expect(card.imageKey).toBe(
        `major/${String(card.id).padStart(2, "0")}-${card.slug}.png`,
      );
      expect(card.imageKey).not.toMatch(/^\//);
    });
  });

  test("preserves representative card copy and nested meaning structure", () => {
    expect(tarotMajorCardContent[0]).toMatchObject({
      id: 0,
      roman: "0",
      slug: "the-fool",
      nameEn: "THE FOOL",
      nameKo: "바보",
      keywords: ["시작", "가능성", "모험", "순수함"],
      visualSymbols: ["절벽 끝의 여행자", "작은 보따리", "흰 꽃", "작은 개"],
      symbolMeanings: [
        {
          symbol: "절벽 끝의 여행자",
          meaning: "아직 길 전체가 보이지 않아도 낯선 장면 앞에 서 있는 마음을 비춥니다.",
        },
        expect.any(Object),
        expect.any(Object),
      ],
      upright: {
        summary: "새로운 시작과 열린 가능성이 자연스럽게 떠오르는 장면을 보여 줍니다.",
        dailyFlow: expect.any(String),
        cardMessage: expect.any(String),
        readingScene: expect.any(String),
      },
      reversed: {
        summary: expect.any(String),
        dailyFlow: expect.any(String),
        cardMessage: expect.any(String),
        readingScene: expect.any(String),
      },
      contexts: {
        love: expect.any(String),
        career: expect.any(String),
        money: expect.any(String),
        general: expect.any(String),
      },
    });
    expect(tarotMajorCardContent[21]).toMatchObject({
      id: 21,
      roman: "XXI",
      slug: "the-world",
      nameEn: "THE WORLD",
      nameKo: "세계",
    });
  });

  test("looks up cards by id and exposes the collection from the tarot barrel", () => {
    expect(getTarotMajorCardContentById(0)?.slug).toBe("the-fool");
    expect(getTarotMajorCardContentById(21)?.slug).toBe("the-world");
    expect(getTarotMajorCardContentById(22)).toBeNull();
    expect(tarotContent.tarotMajorCardContent).toBe(tarotMajorCardContent);
    expect(tarotContent.getTarotMajorCardContentById).toBe(getTarotMajorCardContentById);
  });

  test("exposes identical content and lookup APIs from the public major subpath", () => {
    expect(tarotMajorCardContentFromSubpath).toBe(tarotMajorCardContent);
    expect(getTarotMajorCardContentByIdFromSubpath).toBe(getTarotMajorCardContentById);
    expect(getTarotMajorCardContentByIdFromSubpath(0)?.slug).toBe("the-fool");
    expect(getTarotMajorCardContentByIdFromSubpath(21)?.slug).toBe("the-world");
  });

  test("preserves the complete major arcana content", async () => {
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(tarotMajorCardContent)),
    );
    const digest = Array.from(
      new Uint8Array(hash),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");

    expect(digest).toBe(
      "dacc260f26d16fddae316004b2b176e4cb0261ca1341b06b3b490952c497e0b4",
    );
  });

  test("satisfies the shared major card contract", () => {
    const cards: readonly TarotMajorCardContent[] = tarotMajorCardContent;

    expect(cards).toBe(tarotMajorCardContent);
  });
});
