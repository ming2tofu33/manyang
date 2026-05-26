import { describe, expect, test } from "vitest";

import {
  createMorningMoodRecord,
  getLatestMorningMoodRecord,
  getMorningMoodRecords,
  getMorningMoodRecordsSnapshot,
  morningMoodRecordsKey,
  morningThoughtMaxLength,
  saveMorningMoodRecord,
  type MorningMoodInput,
  type StorageLike,
} from "./morning-mood";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("morning mood storage", () => {
  test("creates a dated morning mood record", () => {
    const input: MorningMoodInput = {
      mood: "흐림",
      moodColor: "안개 보라",
      bodyFeeling: "졸림",
      thought: "오늘은 천천히 시작하고 싶어",
      moodDate: "2026-05-24",
    };

    expect(createMorningMoodRecord(input)).toMatchObject({
      ...input,
      id: "morning-2026-05-24",
    });
  });

  test("trims the first thought before saving the record", () => {
    const record = createMorningMoodRecord({
      mood: "차분",
      moodColor: "달빛 노랑",
      bodyFeeling: "편안함",
      thought: "  물 한 잔 마시고 싶어.  ",
      moodDate: "2026-05-24",
    });

    expect(record.thought).toBe("물 한 잔 마시고 싶어.");
  });

  test("truncates long first thoughts", () => {
    const record = createMorningMoodRecord({
      mood: "졸림",
      moodColor: "흐린 회색",
      bodyFeeling: "무거움",
      thought: "가".repeat(morningThoughtMaxLength + 10),
      moodDate: "2026-05-24",
    });

    expect(record.thought).toHaveLength(morningThoughtMaxLength);
  });

  test("saves the newest morning mood first and replaces the same day", () => {
    const storage = createMemoryStorage();
    const first = createMorningMoodRecord({
      mood: "흐림",
      moodColor: "안개 보라",
      bodyFeeling: "졸림",
      thought: "처음 기록",
      moodDate: "2026-05-24",
    });
    const replacement = createMorningMoodRecord({
      mood: "가벼움",
      moodColor: "새벽 파랑",
      bodyFeeling: "개운함",
      thought: "다시 기록",
      moodDate: "2026-05-24",
    });
    const nextDay = createMorningMoodRecord({
      mood: "차분",
      moodColor: "달빛 노랑",
      bodyFeeling: "편안함",
      thought: "다음 날 기록",
      moodDate: "2026-05-25",
    });

    saveMorningMoodRecord(storage, first);
    saveMorningMoodRecord(storage, replacement);
    saveMorningMoodRecord(storage, nextDay);

    expect(getMorningMoodRecords(storage)).toEqual([nextDay, replacement]);
    expect(getLatestMorningMoodRecord(storage)).toEqual(nextDay);
  });

  test("returns an empty list when stored JSON is corrupted", () => {
    const storage = createMemoryStorage({ [morningMoodRecordsKey]: "{not-json" });

    expect(getMorningMoodRecords(storage)).toEqual([]);
  });

  test("returns stable morning mood snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage();
    const record = createMorningMoodRecord({
      mood: "불안",
      moodColor: "깊은 남색",
      bodyFeeling: "긴장됨",
      thought: "괜찮아질 것 같아.",
      moodDate: "2026-05-24",
    });

    saveMorningMoodRecord(storage, record);

    expect(getMorningMoodRecordsSnapshot(storage)).toBe(getMorningMoodRecordsSnapshot(storage));
  });
});
