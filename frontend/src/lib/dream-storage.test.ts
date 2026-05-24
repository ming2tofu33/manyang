import { describe, expect, test } from "vitest";

import {
  deleteDreamRecord,
  getDreamRecords,
  getDreamRecordsSnapshot,
  getLatestAnalysis,
  getLatestAnalysisSnapshot,
  saveDreamRecord,
  saveLatestAnalysis,
  type DreamRecord,
  type LatestAnalysisPayload,
  type StorageLike,
} from "./dream-storage";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function createPayload(): LatestAnalysisPayload {
  return {
    dreamText: "낡은 학교 복도에서 신발을 잃어버렸어요.",
    dreamDate: "2026-05-24",
    wakeMood: "불안",
    analysis: {
      dreamId: "dream-id",
      analysisId: "analysis-id",
      cardId: "card-id",
      summary: "학교, 복도 그리고 신발이 특히 남은 꿈",
      symbols: ["학교", "복도", "신발"],
      emotions: ["불안"],
      themes: ["장소와 전환"],
      interpretation: "단정하긴 어렵지만, 복도는 전환과 연결되어 보여요.",
      smallPrescription: "준비물 하나만 먼저 확인해보자냥.",
      card: {
        name: "복도를 살피는 밤",
        type: "half_moon",
        keywords: ["전환", "준비", "장소와 전환"],
        summary: "학교, 복도 그리고 신발이 특히 남은 꿈",
        message: "불안을 작은 단서로 데려가보자냥.",
        theme: "장소와 전환",
      },
    },
  };
}

describe("dream storage helpers", () => {
  test("saves and returns the latest analysis payload", () => {
    const storage = createMemoryStorage();
    const payload = createPayload();

    saveLatestAnalysis(storage, payload);

    expect(getLatestAnalysis(storage)).toEqual(payload);
  });

  test("returns null when latest analysis JSON is corrupted", () => {
    const storage = createMemoryStorage({
      "manyang:latest-analysis": "{not-json",
    });

    expect(getLatestAnalysis(storage)).toBeNull();
  });

  test("prepends saved dream records", () => {
    const storage = createMemoryStorage();
    const first: DreamRecord = {
      id: "first",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };
    const second: DreamRecord = {
      id: "second",
      savedAt: "2026-05-25T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-25",
    };

    saveDreamRecord(storage, first);
    saveDreamRecord(storage, second);

    expect(getDreamRecords(storage).map((record) => record.id)).toEqual(["second", "first"]);
  });

  test("deletes only the matching dream record", () => {
    const storage = createMemoryStorage();
    const first: DreamRecord = {
      id: "first",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };
    const second: DreamRecord = {
      id: "second",
      savedAt: "2026-05-25T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-25",
    };

    saveDreamRecord(storage, first);
    saveDreamRecord(storage, second);
    deleteDreamRecord(storage, "first");

    expect(getDreamRecords(storage).map((record) => record.id)).toEqual(["second"]);
  });

  test("keeps dream records unchanged when deleting a missing record", () => {
    const storage = createMemoryStorage();
    const record: DreamRecord = {
      id: "existing",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };

    saveDreamRecord(storage, record);
    deleteDreamRecord(storage, "missing");

    expect(getDreamRecords(storage)).toEqual([record]);
  });

  test("returns an empty record list when saved records JSON is corrupted", () => {
    const storage = createMemoryStorage({
      "manyang:dreams": "{not-json",
    });

    expect(getDreamRecords(storage)).toEqual([]);
  });

  test("returns stable latest analysis snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage();
    const payload = createPayload();

    saveLatestAnalysis(storage, payload);

    expect(getLatestAnalysisSnapshot(storage)).toBe(getLatestAnalysisSnapshot(storage));
  });

  test("returns stable dream record snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage();

    expect(getDreamRecordsSnapshot(storage)).toBe(getDreamRecordsSnapshot(storage));
  });
});
