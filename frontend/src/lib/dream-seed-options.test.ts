import { describe, expect, test } from "vitest";

import {
  defaultDreamSeedAtmosphere,
  defaultDreamSeedIntent,
  doesDreamSeedIntentAcceptNote,
  dreamSeedAtmospheres,
  dreamSeedCopy,
  dreamSeedIntents,
  dreamSeedNoteMaxLength,
  dreamSeedRoute,
  getDreamSeedIntentById,
} from "./dream-seed-options";

describe("dream seed options", () => {
  test("keeps dream seed route centralized", () => {
    expect(dreamSeedRoute).toBe("/seed");
  });

  test("defines unique dream seed intent ids", () => {
    const intentIds = dreamSeedIntents.map((intent) => intent.id);

    expect(new Set(intentIds).size).toBe(intentIds.length);
  });

  test("keeps dream seed intro copy aligned with the page header", () => {
    expect(dreamSeedCopy.pageSubtitle).toBe("잠들기 전 내 마음에\n작은 꿈 씨앗을 심어보아요");
    expect(dreamSeedCopy.heroTitleLines).toEqual(["잠들기 전 내 마음에", "작은 꿈 씨앗을 심어보아요"]);
  });

  test("uses the first intent as the default intent", () => {
    expect(defaultDreamSeedIntent).toBe(dreamSeedIntents[0]);
  });

  test("defines the sleep-before dream seed intents in display order", () => {
    expect(dreamSeedIntents.map((intent) => intent.label)).toEqual([
      "지금 내 마음이 궁금해",
      "보고 싶은 장면이 있어",
      "해결하고 싶은 일이 있어",
      "누군가를 다시 만나고 싶어",
      "편안한 꿈을 꾸고 싶어",
      "그냥 꿈에게 맡길래",
    ]);
  });

  test("defines the dream seed atmosphere options", () => {
    expect(dreamSeedAtmospheres).toEqual(["편안한", "신비로운", "따뜻한", "이상한", "조용한"]);
    expect(defaultDreamSeedAtmosphere).toBe(dreamSeedAtmospheres[0]);
  });

  test("finds every intent by id without duplicating labels", () => {
    for (const intent of dreamSeedIntents) {
      expect(getDreamSeedIntentById(intent.id)).toBe(intent);
    }
  });

  test("accepts optional notes for every intent", () => {
    const noteEnabledIds = dreamSeedIntents
      .filter((intent) => doesDreamSeedIntentAcceptNote(intent.id))
      .map((intent) => intent.id);

    expect(noteEnabledIds).toEqual(dreamSeedIntents.map((intent) => intent.id));
  });

  test("keeps the note max length in one shared option", () => {
    expect(dreamSeedNoteMaxLength).toBe(100);
  });
});
