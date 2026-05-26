import { describe, expect, test } from "vitest";

import { SUPPORTED_LOCALES } from "../src/contracts/symbol-encyclopedia";
import { getRuntimeSymbolEntry, symbolEntries } from "../src/data/symbol-encyclopedia";

const pilotSymbolIds = [
  "snake",
  "owned_land",
  "door",
  "school",
  "corridor",
  "searching",
  "many",
  "dawn",
  "water",
  "cat",
];

describe("symbol encyclopedia data", () => {
  test("contains the ten accepted pilot symbols", () => {
    expect(symbolEntries.map((entry) => entry.id).sort()).toEqual([...pilotSymbolIds].sort());
  });

  test("provides Korean and English localization for every active symbol", () => {
    for (const entry of symbolEntries) {
      expect(entry.status).toBe("active");

      for (const locale of SUPPORTED_LOCALES) {
        expect(entry.locales[locale].label.length).toBeGreaterThan(0);
        expect(entry.locales[locale].aliases.length).toBeGreaterThanOrEqual(3);
        expect(entry.locales[locale].coreMeanings.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("keeps each locale vector-ready with scene modifiers, search text, and avoid expressions", () => {
    for (const entry of symbolEntries) {
      for (const locale of SUPPORTED_LOCALES) {
        const localized = entry.locales[locale];

        expect(localized.searchText.length).toBeGreaterThan(20);
        expect(Object.keys(localized.sceneModifiers).length).toBeGreaterThanOrEqual(3);
        expect(localized.avoidExpressions.length).toBeGreaterThanOrEqual(2);
        expect(localized.cardTitleSeeds.length).toBeGreaterThanOrEqual(2);
        expect(localized.smallPrescriptions.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test("flattens a localized symbol into the runtime retrieval shape", () => {
    const snake = getRuntimeSymbolEntry("snake", "ko");

    expect(snake).toMatchObject({
      id: "snake",
      category: "animal",
      safetyLevel: "sensitive",
      accessTier: "free",
      label: "뱀",
    });
    expect(snake.aliases).toEqual(expect.arrayContaining(["뱀", "구렁이"]));
    expect(snake.evidence.sceneModifiers.many?.reading).toContain("한꺼번에");
    expect(snake.evidence.avoidExpressions).toContain("태몽이다");
  });
});
