import { describe, expect, test } from "vitest";

import {
  countMonthlyDreamSeeds,
  createDreamSeedRecord,
  dreamSeedKey,
  dreamSeedRecordsKey,
  getDreamSeed,
  getDreamSeedRecords,
  getDreamSeedRecordsSnapshot,
  getDreamSeedSnapshot,
  saveDreamSeed,
  isDreamSeedRelatedToDreamDate,
  type DreamSeedInput,
  type StorageLike,
} from "./dream-seed";
import {
  defaultDreamSeedAtmosphere,
  dreamSeedCustomIntentId,
  dreamSeedNoteMaxLength,
  getDreamSeedIntentById,
} from "./dream-seed-options";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("dream seed storage", () => {
  test("creates a dated dream seed record", () => {
    const customIntent = getDreamSeedIntentById(dreamSeedCustomIntentId)!;
    const input: DreamSeedInput = {
      intentId: customIntent.id,
      intentLabel: customIntent.label,
      atmosphere: "신비로운",
      note: "오늘은 밝은 장면을 보고 싶어.",
      seedDate: "2026-05-24",
    };

    expect(createDreamSeedRecord(input)).toMatchObject(input);
  });

  test("preserves the selected dream atmosphere on the record", () => {
    const record = createDreamSeedRecord({
      intentId: "strange",
      intentLabel: "보고 싶은 장면이 있어",
      atmosphere: "따뜻한",
      note: "노란 불빛이 있는 방을 보고 싶어.",
      seedDate: "2026-05-24",
    });

    expect(record.atmosphere).toBe("따뜻한");
  });

  test("trims the optional note before saving the record", () => {
    const customIntent = getDreamSeedIntentById(dreamSeedCustomIntentId)!;
    const record = createDreamSeedRecord({
      intentId: customIntent.id,
      intentLabel: customIntent.label,
      atmosphere: defaultDreamSeedAtmosphere,
      note: "  파란 문을 지나가고 싶어.  ",
      seedDate: "2026-05-24",
    });

    expect(record.note).toBe("파란 문을 지나가고 싶어.");
  });

  test("truncates notes longer than the shared max length", () => {
    const customIntent = getDreamSeedIntentById(dreamSeedCustomIntentId)!;
    const record = createDreamSeedRecord({
      intentId: customIntent.id,
      intentLabel: customIntent.label,
      atmosphere: defaultDreamSeedAtmosphere,
      note: "가".repeat(dreamSeedNoteMaxLength + 10),
      seedDate: "2026-05-24",
    });

    expect(record.note).toHaveLength(dreamSeedNoteMaxLength);
  });

  test("keeps notes for preset intents too", () => {
    const record = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "지금 내 마음이 궁금해",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "이 문장도 선택 씨앗과 함께 저장되어야 한다.",
      seedDate: "2026-05-24",
    });

    expect(record.note).toBe("이 문장도 선택 씨앗과 함께 저장되어야 한다.");
  });

  test("saves and returns the latest dream seed", () => {
    const storage = createMemoryStorage();
    const record = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "지금 내 마음이 궁금해",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-24",
    });

    saveDreamSeed(storage, record);

    expect(getDreamSeed(storage)).toEqual(record);
  });

  test("saves monthly dream seed records while replacing the same seed date", () => {
    const storage = createMemoryStorage();
    const firstMaySeed = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "first",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "first note",
      seedDate: "2026-05-24",
    });
    const replacedMaySeed = createDreamSeedRecord({
      intentId: "custom",
      intentLabel: "replacement",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "replacement note",
      seedDate: "2026-05-24",
    });
    const nextMaySeed = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "next",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "next note",
      seedDate: "2026-05-25",
    });

    saveDreamSeed(storage, firstMaySeed);
    saveDreamSeed(storage, replacedMaySeed);
    saveDreamSeed(storage, nextMaySeed);

    expect(getDreamSeed(storage)).toEqual(nextMaySeed);
    expect(getDreamSeedRecords(storage)).toEqual([nextMaySeed, replacedMaySeed]);
  });

  test("returns an empty dream seed history when stored JSON is corrupted", () => {
    const storage = createMemoryStorage({ [dreamSeedRecordsKey]: "{not-json" });

    expect(getDreamSeedRecords(storage)).toEqual([]);
  });

  test("returns stable dream seed record snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage();
    const record = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "snapshot",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-24",
    });

    saveDreamSeed(storage, record);

    expect(getDreamSeedRecordsSnapshot(storage)).toBe(getDreamSeedRecordsSnapshot(storage));
  });

  test("counts unique monthly dream seed dates", () => {
    const mayFirst = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "may first",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-01",
    });
    const mayLast = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "may last",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-31",
    });
    const mayDuplicate = createDreamSeedRecord({
      intentId: "custom",
      intentLabel: "may duplicate",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-31",
    });
    const juneFirst = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "june first",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-06-01",
    });

    expect(countMonthlyDreamSeeds([mayFirst, mayLast, mayDuplicate, juneFirst], 2026, 5)).toBe(2);
  });

  test("returns null when stored JSON is corrupted", () => {
    const storage = createMemoryStorage({ [dreamSeedKey]: "{not-json" });

    expect(getDreamSeed(storage)).toBeNull();
  });

  test("returns stable dream seed snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage();
    const record = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "지금 내 마음이 궁금해",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-24",
    });

    saveDreamSeed(storage, record);

    expect(getDreamSeedSnapshot(storage)).toBe(getDreamSeedSnapshot(storage));
  });

  test("relates a dream result to the same-day or previous-day seed", () => {
    const seed = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "지금 내 마음이 궁금해",
      atmosphere: defaultDreamSeedAtmosphere,
      note: "",
      seedDate: "2026-05-24",
    });

    expect(isDreamSeedRelatedToDreamDate(seed, "2026-05-24")).toBe(true);
    expect(isDreamSeedRelatedToDreamDate(seed, "2026-05-25")).toBe(true);
    expect(isDreamSeedRelatedToDreamDate(seed, "2026-05-26")).toBe(false);
  });
});
