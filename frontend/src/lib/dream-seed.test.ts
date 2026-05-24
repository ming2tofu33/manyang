import { describe, expect, test } from "vitest";

import {
  createDreamSeedRecord,
  dreamSeedKey,
  getDreamSeed,
  saveDreamSeed,
  type DreamSeedInput,
  type StorageLike,
} from "./dream-seed";

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
    const input: DreamSeedInput = {
      intentId: "comfort",
      intentLabel: "아무것도 무섭지 않고 편안했으면",
      note: "오늘은 밝은 장면을 보고 싶어.",
      seedDate: "2026-05-24",
    };

    expect(createDreamSeedRecord(input)).toMatchObject(input);
  });

  test("trims the optional note before saving the record", () => {
    const record = createDreamSeedRecord({
      intentId: "custom",
      intentLabel: "직접 적을래",
      note: "  파란 문을 지나가고 싶어.  ",
      seedDate: "2026-05-24",
    });

    expect(record.note).toBe("파란 문을 지나가고 싶어.");
  });

  test("saves and returns the latest dream seed", () => {
    const storage = createMemoryStorage();
    const record = createDreamSeedRecord({
      intentId: "question",
      intentLabel: "지금 내 마음이 궁금해",
      note: "",
      seedDate: "2026-05-24",
    });

    saveDreamSeed(storage, record);

    expect(getDreamSeed(storage)).toEqual(record);
  });

  test("returns null when stored JSON is corrupted", () => {
    const storage = createMemoryStorage({ [dreamSeedKey]: "{not-json" });

    expect(getDreamSeed(storage)).toBeNull();
  });
});
