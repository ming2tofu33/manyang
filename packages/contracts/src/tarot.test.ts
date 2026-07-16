import { describe, expect, expectTypeOf, test } from "vitest";

import * as rootContract from "@manyang/contracts";
import * as tarotContract from "@manyang/contracts/tarot";

import {
  TAROT_ARCANAS,
  TAROT_MINOR_RANKS,
  TAROT_MINOR_SUITS,
  TAROT_ORIENTATIONS,
  TAROT_POSITIONS,
  TAROT_SPREADS,
  TAROT_UNLOCK_METHODS,
  type DailyTarotCardSelection,
  type DailyTarotGeneratedReading,
  type DailyTarotPosition,
  type DailyTarotQuestionContext,
  type DailyTarotReading,
  type TarotCard,
  type TarotCardContent,
  type TarotMajorCardContent,
  type TarotMinorCardContent,
  type TarotOrientation,
  type TarotReadingRequest,
  type TarotReadingSelectionRequest,
  type TarotSpread,
  type TarotUnlockMethod,
} from "./tarot";

function expectUniqueValues(values: readonly unknown[]) {
  expect(new Set(values).size).toBe(values.length);
}

const legacyStoredMajor = {
  id: 0,
  roman: "0",
  slug: "the-fool",
  nameEn: "THE FOOL",
  nameKo: "The Fool",
  image: "/tarot/major/the-fool.webp",
  keywords: ["beginning"],
  visualSymbols: ["traveler"],
  symbolMeanings: [{ symbol: "traveler", meaning: "a new path" }],
  mood: "open possibility",
  upright: {
    summary: "A beginning",
    dailyFlow: "A fresh direction",
    cardMessage: "Step forward",
    readingScene: "At the edge of a journey",
  },
  reversed: {
    summary: "An unprepared start",
    dailyFlow: "A pause before moving",
    cardMessage: "Check your footing",
    readingScene: "Waiting at the edge",
  },
  contexts: {
    love: "A new connection",
    career: "A new role",
    money: "Avoid impulsive choices",
    general: "Stay open and aware",
  },
} as const;

const sharedStrictContent = {
  slug: "ace-of-wands",
  nameEn: "ACE OF WANDS",
  nameKo: "Ace of Wands",
  keywords: ["beginning", "spark"],
  visualSymbols: ["wand"],
  symbolMeanings: [{ symbol: "wand", meaning: "creative energy" }],
  mood: "an energetic opening",
  upright: {
    summary: "A spark arrives",
    dailyFlow: "Energy starts moving",
    cardMessage: "Use the opening",
    readingScene: "A wand held toward the light",
  },
  reversed: {
    summary: "The spark is delayed",
    dailyFlow: "Energy needs direction",
    cardMessage: "Clarify the first step",
    readingScene: "A wand waiting to be raised",
  },
  contexts: {
    love: "Fresh interest",
    career: "A new initiative",
    money: "An early opportunity",
    general: "Beginning energy",
  },
} as const;

describe("tarot contract", () => {
  test("exposes each supported runtime vocabulary exactly once", () => {
    expect(TAROT_SPREADS).toEqual([
      "daily_one_card",
      "question_one_card",
      "daily_three_card",
    ]);
    expect(TAROT_ORIENTATIONS).toEqual(["upright", "reversed"]);
    expect(TAROT_POSITIONS).toEqual(["today", "situation", "flow", "advice"]);
    expect(TAROT_UNLOCK_METHODS).toEqual([
      "daily_free",
      "rewarded_ad",
      "moon_pass",
      "admin",
    ]);
    expect(TAROT_ARCANAS).toEqual(["major", "minor"]);
    expect(TAROT_MINOR_SUITS).toEqual(["wands", "cups", "swords", "pentacles"]);
    expect(TAROT_MINOR_RANKS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

    for (const values of [
      TAROT_SPREADS,
      TAROT_ORIENTATIONS,
      TAROT_POSITIONS,
      TAROT_UNLOCK_METHODS,
      TAROT_ARCANAS,
      TAROT_MINOR_SUITS,
      TAROT_MINOR_RANKS,
    ]) {
      expectUniqueValues(values);
    }
  });

  test("accepts a legacy stored major card without shared content keys", () => {
    expectTypeOf(legacyStoredMajor).toMatchTypeOf<TarotCard>();
    expectTypeOf(legacyStoredMajor).not.toMatchTypeOf<TarotCardContent>();
  });

  test("keeps strict major and minor content fully identified", () => {
    const strictMajorContent = {
      id: 0,
      cardKey: "major:00",
      imageKey: "tarot.major.the-fool",
      arcana: "major" as const,
      roman: "0",
      slug: legacyStoredMajor.slug,
      nameEn: legacyStoredMajor.nameEn,
      nameKo: legacyStoredMajor.nameKo,
      keywords: legacyStoredMajor.keywords,
      visualSymbols: legacyStoredMajor.visualSymbols,
      symbolMeanings: legacyStoredMajor.symbolMeanings,
      mood: legacyStoredMajor.mood,
      upright: legacyStoredMajor.upright,
      reversed: legacyStoredMajor.reversed,
      contexts: legacyStoredMajor.contexts,
    };
    const strictMinorContent = {
      ...sharedStrictContent,
      id: 22,
      cardKey: "minor:wands:01",
      imageKey: "tarot.minor.wands.ace",
      arcana: "minor" as const,
      suit: "wands" as const,
      rank: 1 as const,
    };

    expectTypeOf(strictMajorContent).toMatchTypeOf<TarotMajorCardContent>();
    expectTypeOf(strictMinorContent).toMatchTypeOf<TarotMinorCardContent>();
    expectTypeOf<TarotMajorCardContent>().toMatchTypeOf<{
      cardKey: string;
      imageKey: string;
      arcana: "major";
      roman: string;
    }>();
    expectTypeOf<TarotMinorCardContent>().toMatchTypeOf<{
      cardKey: string;
      imageKey: string;
      arcana: "minor";
      suit: "wands" | "cups" | "swords" | "pentacles";
      rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
    }>();
    expectTypeOf(strictMajorContent).not.toMatchTypeOf<TarotMinorCardContent>();
    expectTypeOf(strictMinorContent).not.toMatchTypeOf<TarotMajorCardContent>();
  });

  test("exposes the public tarot object contracts", () => {
    expectTypeOf<TarotCardContent>().toBeObject();
    expectTypeOf<TarotReadingRequest>().toBeObject();
    expectTypeOf<DailyTarotReading>().toBeObject();
  });

  test("preserves the reading request fields and optional context", () => {
    type OptionalRequestFields = {
      questionContext?: DailyTarotQuestionContext;
      unlockMethod?: TarotUnlockMethod;
    };

    const minimalRequest = {
      appDate: "2026-07-16",
      spread: "daily_one_card" as const,
      selectedAt: "2026-07-16T09:00:00+09:00",
      selections: [
        {
          cardId: 0,
          orientation: "upright" as const,
          position: "today" as const,
        },
      ],
    };

    expectTypeOf<TarotReadingRequest>().toMatchTypeOf<{
      appDate: string;
      spread: TarotSpread;
      selectedAt: string;
      selections: TarotReadingSelectionRequest[];
    }>();
    expectTypeOf<Pick<TarotReadingRequest, keyof OptionalRequestFields>>().toMatchTypeOf<
      OptionalRequestFields
    >();
    expectTypeOf<OptionalRequestFields>().toMatchTypeOf<
      Pick<TarotReadingRequest, keyof OptionalRequestFields>
    >();
    expectTypeOf(minimalRequest).toMatchTypeOf<TarotReadingRequest>();
  });

  test("preserves the daily reading fields and optional generated data", () => {
    type OptionalDailyReadingFields = {
      source?: "local" | "llm";
      drawIdentityKey?: string;
      cards?: DailyTarotCardSelection[];
      generated?: DailyTarotGeneratedReading;
      questionContext?: DailyTarotQuestionContext;
      unlockMethod?: TarotUnlockMethod;
    };

    const minimalDailyReading = {
      id: "daily:2026-07-16",
      spread: "daily_one_card" as const,
      appDate: "2026-07-16",
      selectedAt: "2026-07-16T09:00:00+09:00",
      card: legacyStoredMajor,
      orientation: "upright" as const,
      position: "today" as const,
      keywords: ["beginning"],
      title: "A fresh opening",
      message: "Meet today with curiosity.",
      advice: "Notice the first useful step.",
    };

    expectTypeOf<DailyTarotReading>().toMatchTypeOf<{
      id: string;
      spread: TarotSpread;
      appDate: string;
      selectedAt: string;
      card: TarotCard;
      orientation: TarotOrientation;
      position: DailyTarotPosition;
      keywords: string[];
      title: string;
      message: string;
      advice: string;
    }>();
    expectTypeOf<Pick<DailyTarotReading, keyof OptionalDailyReadingFields>>().toMatchTypeOf<
      OptionalDailyReadingFields
    >();
    expectTypeOf<OptionalDailyReadingFields>().toMatchTypeOf<
      Pick<DailyTarotReading, keyof OptionalDailyReadingFields>
    >();
    expectTypeOf(minimalDailyReading).toMatchTypeOf<DailyTarotReading>();
  });

  test("publishes tarot constants through the tarot and root entry points", () => {
    expect(tarotContract.TAROT_SPREADS).toBe(TAROT_SPREADS);
    expect(tarotContract.TAROT_ORIENTATIONS).toBe(TAROT_ORIENTATIONS);
    expect(tarotContract.TAROT_POSITIONS).toBe(TAROT_POSITIONS);
    expect(tarotContract.TAROT_UNLOCK_METHODS).toBe(TAROT_UNLOCK_METHODS);
    expect(tarotContract.TAROT_ARCANAS).toBe(TAROT_ARCANAS);
    expect(tarotContract.TAROT_MINOR_SUITS).toBe(TAROT_MINOR_SUITS);
    expect(tarotContract.TAROT_MINOR_RANKS).toBe(TAROT_MINOR_RANKS);

    expect(rootContract.TAROT_SPREADS).toBe(TAROT_SPREADS);
    expect(rootContract.TAROT_ORIENTATIONS).toBe(TAROT_ORIENTATIONS);
    expect(rootContract.TAROT_POSITIONS).toBe(TAROT_POSITIONS);
    expect(rootContract.TAROT_UNLOCK_METHODS).toBe(TAROT_UNLOCK_METHODS);
    expect(rootContract.TAROT_ARCANAS).toBe(TAROT_ARCANAS);
    expect(rootContract.TAROT_MINOR_SUITS).toBe(TAROT_MINOR_SUITS);
    expect(rootContract.TAROT_MINOR_RANKS).toBe(TAROT_MINOR_RANKS);

    expect(tarotContract.TAROT_SPREADS).toEqual([
      "daily_one_card",
      "question_one_card",
      "daily_three_card",
    ]);
    expect(rootContract.TAROT_MINOR_RANKS).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ]);
    expectTypeOf<tarotContract.TarotCardContent>().toBeObject();
    expectTypeOf<rootContract.TarotReadingRequest>().toBeObject();
  });
});
