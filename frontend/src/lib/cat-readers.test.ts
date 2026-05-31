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
  resolveCatReaderForDreamReading,
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
    expect(catReaders.map((reader) => reader.name)).toEqual(["검은냥", "하얀냥", "치즈냥", "잿빛냥"]);
    expect(catReaders.map((reader) => reader.ctaLabel)).toEqual([
      "검은냥 테마로 남기기",
      "하얀냥 테마로 남기기",
      "치즈냥 테마로 남기기",
      "잿빛냥 테마로 남기기",
    ]);
    expect(catReaders.map((reader) => reader.role)).toEqual([
      "밤하늘 테마",
      "달빛 테마",
      "노을 테마",
      "타로 테마",
    ]);
    expect(catReaders.map((reader) => reader.shortDescription)).toEqual([
      "깊은 밤하늘과 촛불 무드",
      "하얀 달빛과 포근한 밤 무드",
      "노란 별빛과 따뜻한 노을 무드",
      "잿빛 달빛과 조용한 서재 무드",
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

  test("keeps every valid cat selectable as a dream receipt theme", () => {
    expect(isCatReaderDreamReadingAvailable("black_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("white_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("cheese_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("gray_cat")).toBe(true);
    expect(isCatReaderDreamReadingAvailable("gray_cat", "free_account")).toBe(true);
  });

  test("does not treat gray cat theme as a separate reading access gate", () => {
    expect(isCatReaderDreamReadingAvailable("gray_cat", "moon_pass")).toBe(true);
    expect(getCatReaderDreamReadingState("gray_cat", "moon_pass")).toEqual({
      isAvailable: true,
      blockedLabel: null,
      fallbackReaderId: null,
    });
  });

  test("keeps guest gray cat theme requests on the selected theme", () => {
    expect(resolveCatReaderForDreamReading("gray_cat", "guest")).toEqual({
      selectedReaderId: "gray_cat",
      requestReaderId: "gray_cat",
      isFallback: false,
      blockedLabel: null,
    });
  });

  test("keeps gray cat dream requests for Moon Pass users", () => {
    expect(resolveCatReaderForDreamReading("gray_cat", "moon_pass")).toEqual({
      selectedReaderId: "gray_cat",
      requestReaderId: "gray_cat",
      isFallback: false,
      blockedLabel: null,
    });
  });

  test("describes the premium gray reader dream reading block state", () => {
    expect(getCatReaderDreamReadingState("black_cat")).toEqual({
      isAvailable: true,
      blockedLabel: null,
      fallbackReaderId: null,
    });
    expect(getCatReaderDreamReadingState("gray_cat")).toEqual({
      isAvailable: true,
      blockedLabel: null,
      fallbackReaderId: null,
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
