import { describe, expect, test } from "vitest";

import {
  catReaders,
  defaultCatReaderId,
  freeCatReaders,
  getCatReaderById,
  getCatReaderDreamReadingState,
  getSelectedCatReaderId,
  getSelectedCatReaderSnapshot,
  isCatReaderDreamReadingAvailable,
  saveSelectedCatReaderId,
  selectedCatReaderKey,
  type StorageLike,
} from "./cat-readers";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("cat readers", () => {
  test("defines the MVP cat reader set", () => {
    expect(catReaders.map((reader) => reader.id)).toEqual(["black_cat", "white_cat", "cheese_cat", "gray_cat"]);
    expect(catReaders.map((reader) => reader.name)).toEqual(["검은냥", "하얀냥", "치즈냥", "회색냥"]);
    expect(catReaders.map((reader) => reader.role)).toEqual(["기본 해몽사", "위로 해몽사", "지적 해몽사", "타로 해몽사"]);
    expect(catReaders.map((reader) => reader.shortDescription)).toEqual([
      "신비롭고 상징 중심",
      "부드럽고 안정감 중심",
      "밝고 현실적인 처방 중심",
      "타로 패턴/기록 중심",
    ]);
    expect(defaultCatReaderId).toBe("black_cat");
  });

  test("maps each cat reader to a matching home and interpretation background", () => {
    expect(
      catReaders.map((reader) => ({
        id: reader.id,
        homeBackgroundKey: reader.homeBackgroundKey,
        interpretationBackgroundKey: reader.interpretationBackgroundKey,
      })),
    ).toEqual([
      {
        id: "black_cat",
        homeBackgroundKey: "blackCatHome",
        interpretationBackgroundKey: "blackCatInterpretation",
      },
      {
        id: "white_cat",
        homeBackgroundKey: "whiteCatHome",
        interpretationBackgroundKey: "whiteCatInterpretation",
      },
      {
        id: "cheese_cat",
        homeBackgroundKey: "cheeseCatHome",
        interpretationBackgroundKey: "cheeseCatInterpretation",
      },
      {
        id: "gray_cat",
        homeBackgroundKey: "grayCatHome",
        interpretationBackgroundKey: "grayCatInterpretation",
      },
    ]);
  });

  test("resolves unknown reader ids to the default black cat", () => {
    expect(getCatReaderById("white_cat").name).toBe("하얀냥");
    expect(getCatReaderById("missing").id).toBe("black_cat");
    expect(getCatReaderById(undefined).id).toBe("black_cat");
  });

  test("maps legacy orange and yellow reader ids to cheese cat", () => {
    expect(getCatReaderById("orange_cat").id).toBe("cheese_cat");
    expect(getCatReaderById("yellow_cat").id).toBe("cheese_cat");
  });

  test("keeps premium readers out of the free reader list", () => {
    expect(freeCatReaders.map((reader) => reader.id)).toEqual(["black_cat", "white_cat", "cheese_cat"]);
  });

  test("marks only free cat readers as available for MVP dream reading", () => {
    expect(isCatReaderDreamReadingAvailable("black_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("white_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("cheese_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("gray_cat")).toBe(false);
  });

  test("describes the premium gray reader dream reading block state", () => {
    expect(getCatReaderDreamReadingState("black_cat")).toEqual({
      isAvailable: true,
      blockedLabel: null,
      fallbackReaderId: null,
    });
    expect(getCatReaderDreamReadingState("gray_cat")).toEqual({
      isAvailable: false,
      blockedLabel: "회색냥은 Moon Pass에서 열려요",
      fallbackReaderId: "black_cat",
    });
  });

  test("saves and returns the selected free cat reader", () => {
    const storage = createMemoryStorage();

    saveSelectedCatReaderId(storage, "white_cat");

    expect(getSelectedCatReaderId(storage)).toBe("white_cat");
  });

  test("saves and returns the selected gray cat reader for previewing premium state", () => {
    const storage = createMemoryStorage({ [selectedCatReaderKey]: "white_cat" });

    saveSelectedCatReaderId(storage, "gray_cat");

    expect(getSelectedCatReaderId(storage)).toBe("gray_cat");
  });

  test("falls back to the default reader when storage is corrupted", () => {
    const storage = createMemoryStorage({ [selectedCatReaderKey]: "not-a-reader" });

    expect(getSelectedCatReaderId(storage)).toBe("black_cat");
  });

  test("returns stable selected reader snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage({ [selectedCatReaderKey]: "cheese_cat" });

    expect(getSelectedCatReaderSnapshot(storage)).toBe(getSelectedCatReaderSnapshot(storage));
  });

  test("migrates legacy stored orange reader to cheese reader", () => {
    const storage = createMemoryStorage({ [selectedCatReaderKey]: "orange_cat" });

    expect(getSelectedCatReaderId(storage)).toBe("cheese_cat");
  });
});
