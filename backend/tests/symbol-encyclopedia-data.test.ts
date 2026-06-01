import { describe, expect, test } from "vitest";

import { SUPPORTED_LOCALES } from "../src/contracts/symbol-encyclopedia";
import { getRuntimeSymbolEntry, symbolEntries } from "../src/data/symbol-encyclopedia";

const acceptedSymbolIds = [
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
  "home",
  "room",
  "window",
  "key",
  "stairs",
  "elevator",
  "mirror",
  "bag",
  "shoes",
  "lost_item",
  "running",
  "fire",
  "rain",
  "sea",
  "hospital",
  "stranger",
  "child",
  "dog",
  "bird",
  "fish",
  "mother",
  "father",
  "friend",
  "partner",
  "ex_partner",
  "death",
  "funeral",
  "baby",
  "pregnancy",
  "toilet",
  "bathroom",
  "car",
  "bus",
  "train",
  "airplane",
  "workplace",
  "money",
  "phone",
  "teeth",
  "hair",
  "road",
  "bridge",
  "bed",
  "kitchen",
  "food",
  "clothes",
  "body",
  "blood",
  "crying",
  "falling",
  "flying",
  "swimming",
  "fighting",
  "being_chased",
  "exam",
  "wedding",
  "crowd",
  "mountain",
  "tree",
  "flower",
  "pig",
  "feces",
  "dragon",
  "tiger",
  "cow",
  "mouse",
  "spider",
  "naked",
  "gold",
  "snow",
  "moon",
  "flood",
  "ancestor",
  "turtle",
  "rainbow",
  "ghost",
  "knife",
  "grave",
  "bear",
  "river",
  "anger",
  "whale",
  "butterfly",
  "market",
  "cave",
  "book",
  "war",
  "chicken",
  "accident",
  "ring",
  "earthquake",
  "song",
  "photo",
];

const phase2BatchSymbolIds = [
  "mother",
  "father",
  "friend",
  "partner",
  "ex_partner",
  "death",
  "funeral",
  "baby",
  "pregnancy",
  "toilet",
  "bathroom",
  "car",
  "bus",
  "train",
  "airplane",
  "workplace",
  "money",
  "phone",
  "teeth",
  "hair",
];

const v02BatchSymbolIds = [
  "home",
  "room",
  "window",
  "key",
  "stairs",
  "elevator",
  "mirror",
  "bag",
  "shoes",
  "lost_item",
  "running",
  "fire",
  "rain",
  "sea",
  "hospital",
  "stranger",
  "child",
  "dog",
  "bird",
  "fish",
];

const phase2BBatchSymbolIds = [
  "road",
  "bridge",
  "bed",
  "kitchen",
  "food",
  "clothes",
  "body",
  "blood",
  "crying",
  "falling",
  "flying",
  "swimming",
  "fighting",
  "being_chased",
  "exam",
  "wedding",
  "crowd",
  "mountain",
  "tree",
  "flower",
];

const allowedAliasCollisions = new Set([
  "ko:방:home,room",
  "en:bedroom:bed,room",
  "ko:침실:bed,room",
  "ko:화장실:bathroom,toilet",
  "en:flight:airplane,flying",
  "en:floating:flying,swimming",
  "ko:비행:airplane,flying",
  "ko:아기:baby,child",
  "en:baby:baby,child",
  "en:littlechild:baby,child",
  "ko:아이:baby,child",
  "ko:잃어버린:lost_item,searching",
  "en:lost:lost_item,searching",
  "ko:파도:sea,water",
  "en:shower:bathroom,rain",
  "ko:금반지:gold,ring",
  "en:goldring:gold,ring",
  "en:caraccident:accident,car",
]);

function normalizeAlias(alias: string): string {
  return alias.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

describe("symbol encyclopedia data", () => {
  test("contains the seventy accepted curated symbols", () => {
    expect(symbolEntries.map((entry) => entry.id).sort()).toEqual([...acceptedSymbolIds].sort());
  });

  test("provides Korean and English localization for every active symbol", () => {
    for (const entry of symbolEntries) {
      expect(entry.status).toBe("active");
      expect(entry.editorialStatus).toBe("approved");
      expect(entry.subcategory.length).toBeGreaterThan(0);
      expect(entry.facets.length).toBeGreaterThanOrEqual(3);
      expect(entry.symbolRole.length).toBeGreaterThanOrEqual(1);
      expect(entry.interpretationLenses.universal.safeTransform.length).toBeGreaterThanOrEqual(2);
      expect(entry.interpretationLenses.east_asian.safeTransform.length).toBeGreaterThanOrEqual(1);
      expect(entry.interpretationLenses.western.safeTransform.length).toBeGreaterThanOrEqual(1);
      expect(entry.embeddingProfile.chunkTypes).toEqual(
        expect.arrayContaining(["searchText", "sceneModifier", "safeReading", "metaphorHook"]),
      );

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
      subcategory: "animal",
      facets: expect.arrayContaining(["reptile", "instinct", "hidden_movement"]),
      symbolRole: expect.arrayContaining(["primary_candidate"]),
      safetyLevel: "sensitive",
      accessTier: "free",
      label: "뱀",
    });
    expect(snake.aliases).toEqual(expect.arrayContaining(["뱀", "구렁이"]));
    expect(snake.evidence.sceneModifiers.many?.reading).toContain("한꺼번에");
    expect(snake.evidence.avoidExpressions).toContain("태몽이다");
  });

  test("adds the next twenty symbols with the v0.2 taxonomy", () => {
    const newSymbols = symbolEntries.filter((entry) => v02BatchSymbolIds.includes(entry.id));

    expect(newSymbols).toHaveLength(20);
    expect(newSymbols.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["home", "key", "hospital", "stranger", "fish"]),
    );
    expect(newSymbols.every((entry) => entry.status === "active")).toBe(true);
    expect(newSymbols.every((entry) => entry.editorialStatus === "approved")).toBe(true);
  });

  test("adds the first phase 2 coverage batch with person, body, place, object, and event symbols", () => {
    const phase2Symbols = symbolEntries.filter((entry) => phase2BatchSymbolIds.includes(entry.id));

    expect(phase2Symbols).toHaveLength(20);
    expect(phase2Symbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["person", "body", "place", "object", "event"]),
    );
    expect(phase2Symbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["death", "funeral", "pregnancy", "money", "teeth"]),
    );
  });

  test("adds the second phase 2 coverage batch for routes, actions, body cues, public scenes, and nature", () => {
    const phase2BSymbols = symbolEntries.filter((entry) => phase2BBatchSymbolIds.includes(entry.id));

    expect(phase2BSymbols).toHaveLength(20);
    expect(phase2BSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "body", "action", "event", "nature", "food", "emotion", "abstract"]),
    );
    expect(phase2BSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["body", "blood", "wedding"]),
    );
  });

  test("uses domain-specific categories for food, emotion, and scene-quality symbols", () => {
    expect(symbolEntries.find((entry) => entry.id === "food")?.category).toBe("food");
    expect(symbolEntries.find((entry) => entry.id === "crying")?.category).toBe("emotion");
    expect(symbolEntries.find((entry) => entry.id === "crowd")?.category).toBe("abstract");
  });

  test("keeps high-risk aliases from waking multiple active symbols", () => {
    const collisions = SUPPORTED_LOCALES.flatMap((locale) => {
      const aliasOwners = new Map<string, Set<string>>();

      for (const entry of symbolEntries) {
        for (const alias of [entry.locales[locale].label, ...entry.locales[locale].aliases]) {
          const key = normalizeAlias(alias);

          if (!key) {
            continue;
          }

          aliasOwners.set(key, new Set([...(aliasOwners.get(key) ?? []), entry.id]));
        }
      }

      return [...aliasOwners.entries()]
        .map(([alias, owners]) => ({
          alias,
          owners: [...owners].sort(),
          collisionKey: `${locale}:${alias}:${[...owners].sort().join(",")}`,
        }))
        .filter((collision) => collision.owners.length > 1)
        .filter((collision) => !allowedAliasCollisions.has(collision.collisionKey));
    });

    expect(collisions).toEqual([]);
  });
});
