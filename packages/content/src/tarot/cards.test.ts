import { describe, expect, test } from "vitest";

import {
  getTarotCardContentById as getTarotCardContentByIdFromSubpath,
  getTarotCardContentByKey as getTarotCardContentByKeyFromSubpath,
  tarotCardContent as tarotCardContentFromSubpath,
  tarotMinorCardContent as tarotMinorCardContentFromCardsSubpath,
} from "@manyang/content/tarot/cards";
import {
  getTarotMinorCardContentById as getTarotMinorCardContentByIdFromSubpath,
  tarotMinorCardContent as tarotMinorCardContentFromSubpath,
} from "@manyang/content/tarot/minor";

import * as tarotContent from "./index";
import {
  getTarotCardContentById,
  getTarotCardContentByKey,
  tarotCardContent,
  tarotMinorCardContent,
} from "./cards";
import {
  getTarotMinorCardContentById,
  tarotMinorCardContent as tarotMinorCardContentFromMinorModule,
} from "./minor";

const suits = ["wands", "cups", "swords", "pentacles"] as const;
const rankNames = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "page",
  "knight",
  "queen",
  "king",
] as const;

const expectedMinorIdentity = suits.flatMap((suit, suitIndex) =>
  rankNames.map((rankName, rankIndex) => {
    const rank = rankIndex + 1;
    const paddedRank = String(rank).padStart(2, "0");

    return {
      id: 22 + suitIndex * rankNames.length + rankIndex,
      suit,
      rank,
      cardKey: `minor:${suit}:${paddedRank}`,
      imageKey: `minor-cutout/${suit}/${paddedRank}-${rankName}-of-${suit}.png`,
    };
  }),
);

async function sha256(value: unknown): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(value)),
  );

  return Array.from(
    new Uint8Array(hash),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

describe("shared minor arcana content", () => {
  test("defines all 56 minor cards with the stable identity mapping", () => {
    expect(tarotMinorCardContent).toHaveLength(56);
    expect(
      tarotMinorCardContent.map(({ id, suit, rank, cardKey, imageKey }) => ({
        id,
        suit,
        rank,
        cardKey,
        imageKey,
      })),
    ).toEqual(expectedMinorIdentity);
    expect(tarotMinorCardContent.every((card) => card.arcana === "minor")).toBe(true);
  });

  test("exposes the minor collection as a readonly array", () => {
    type HasPush<T> = "push" extends keyof T ? true : false;
    const hasPush: HasPush<typeof tarotMinorCardContent> = false;

    expect(hasPush).toBe(false);
  });

  test("looks up minor cards by id", () => {
    expect(getTarotMinorCardContentById(22)?.cardKey).toBe("minor:wands:01");
    expect(getTarotMinorCardContentById(75)?.cardKey).toBe("minor:pentacles:12");
    expect(getTarotMinorCardContentById(21)).toBeNull();
    expect(getTarotMinorCardContentById(78)).toBeNull();
  });

  test("preserves every generated minor card field and nested copy", async () => {
    expect(await sha256(tarotMinorCardContent)).toBe(
      "e55bb2bd85aa97b61ae28db6087fd84e865fc31f9183604ed085a20a0022b416",
    );
  });
});

describe("shared complete tarot deck", () => {
  test("combines 22 major and 56 minor cards in id order", () => {
    expect(tarotCardContent).toHaveLength(78);
    expect(tarotCardContent.filter((card) => card.arcana === "major")).toHaveLength(22);
    expect(tarotCardContent.filter((card) => card.arcana === "minor")).toHaveLength(56);
    expect(tarotCardContent.map((card) => card.id)).toEqual(
      Array.from({ length: 78 }, (_, id) => id),
    );
  });

  test("exposes the complete collection as a readonly array", () => {
    type HasPush<T> = "push" extends keyof T ? true : false;
    const hasPush: HasPush<typeof tarotCardContent> = false;

    expect(hasPush).toBe(false);
  });

  test("keeps every card and image key unique", () => {
    expect(new Set(tarotCardContent.map((card) => card.cardKey)).size).toBe(78);
    expect(new Set(tarotCardContent.map((card) => card.imageKey)).size).toBe(78);
  });

  test("provides stable id and card-key lookups", () => {
    expect(getTarotCardContentByKey("major:00")?.id).toBe(0);
    expect(getTarotCardContentByKey("minor:wands:01")?.id).toBe(22);
    expect(getTarotCardContentById(75)?.cardKey).toBe("minor:pentacles:12");
    expect(getTarotCardContentById(-1)).toBeNull();
    expect(getTarotCardContentByKey("missing")).toBeNull();
  });

  test("preserves every complete-deck field and nested copy", async () => {
    expect(await sha256(tarotCardContent)).toBe(
      "a2915b5a915781e06a57e7d47c4b6ff9f6c13466ee684e13b081dbc6a3e44cd4",
    );
  });

  test("exports identical arrays and lookups through the barrel and public subpaths", () => {
    expect(tarotContent.tarotMinorCardContent).toBe(tarotMinorCardContent);
    expect(tarotContent.tarotCardContent).toBe(tarotCardContent);
    expect(tarotMinorCardContentFromMinorModule).toBe(tarotMinorCardContent);
    expect(tarotMinorCardContentFromSubpath).toBe(tarotMinorCardContent);
    expect(tarotMinorCardContentFromCardsSubpath).toBe(tarotMinorCardContent);
    expect(getTarotMinorCardContentByIdFromSubpath).toBe(getTarotMinorCardContentById);
    expect(tarotCardContentFromSubpath).toBe(tarotCardContent);
    expect(getTarotCardContentByIdFromSubpath).toBe(getTarotCardContentById);
    expect(getTarotCardContentByKeyFromSubpath).toBe(getTarotCardContentByKey);
  });
});
