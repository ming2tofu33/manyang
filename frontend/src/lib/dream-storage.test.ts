import { describe, expect, test } from "vitest";

import {
  deleteDreamRecord,
  getDreamRecords,
  getDreamRecordsSnapshot,
  getDreamDraft,
  getLatestAnalysis,
  getLatestAnalysisSnapshot,
  restoreDreamRecordAsLatestAnalysis,
  saveDreamRecord,
  saveDreamDraft,
  saveDreamRecordAsLatestAnalysis,
  saveLatestAnalysis,
  type DreamCompletedPayload,
  type DreamRecord,
  type DreamUnavailablePayload,
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

type CompletedDreamRecord = DreamCompletedPayload & {
  id: string;
  savedAt: string;
};

function createPayload(): DreamCompletedPayload {
  return {
    dreamText: "낡은 학교 복도에서 신발을 잃어버렸어요.",
    dreamDate: "2026-05-24",
    wakeMood: "불안",
    analysis: {
      dreamId: "dream-id",
      analysisId: "analysis-id",
      cardId: "card-id",
      reader: {
        id: "black_cat",
        name: "검은냥",
        access: "free",
      },
      summary: "학교, 복도 그리고 신발이 특히 남은 꿈",
      symbols: ["학교", "복도", "신발"],
      emotions: ["불안"],
      themes: ["장소와 전환"],
      interpretation: "단정하긴 어렵지만, 복도는 전환과 연결되어 보여요.",
      smallPrescription: "준비물 하나만 먼저 확인해보자냥.",
      symbolReadings: [
        {
          symbol: "복도",
          reading: "A corridor can point to transition.",
        },
      ],
      readingBasis: {
        usedSymbols: ["복도"],
        mainThemes: ["장소와 전환"],
        confidence: 0.7,
      },
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

function createUnavailablePayload(): DreamUnavailablePayload {
  return {
    status: "unavailable",
    dreamText: "I dreamed that a snake appeared in my room.",
    dreamDate: "2026-05-24",
    catReaderType: "gray_cat",
    wakeMood: "curious",
    reason: "provider_error",
    retryable: true,
    safetyNotice: "This dream reading is not a medical diagnosis.",
    failedAt: "2026-05-24T00:00:00.000Z",
  };
}

describe("dream storage helpers", () => {
  test("saves and returns the latest analysis payload", () => {
    const storage = createMemoryStorage();
    const payload = createPayload();

    saveLatestAnalysis(storage, payload);

    expect(getLatestAnalysis(storage)).toEqual(payload);
  });

  test("saves and restores unavailable latest payloads without requiring an analysis", () => {
    const storage = createMemoryStorage();
    const payload = createUnavailablePayload();
    const record: DreamRecord = {
      ...payload,
      id: "failed-dream",
      savedAt: "2026-05-24T00:00:00.000Z",
    };

    saveLatestAnalysis(storage, payload);
    saveDreamRecord(storage, record);

    expect(getLatestAnalysis(storage)).toEqual(payload);
    expect(restoreDreamRecordAsLatestAnalysis(storage, "failed-dream")).toEqual(payload);
  });

  test("saves a draft so failed dream text can be reopened for editing", () => {
    const storage = createMemoryStorage();

    saveDreamDraft(storage, {
      dreamText: "I dreamed that a snake appeared in my room.",
      catReaderType: "gray_cat",
    });

    expect(getDreamDraft(storage)).toEqual({
      dreamText: "I dreamed that a snake appeared in my room.",
      catReaderType: "gray_cat",
    });
  });

  test("returns null when latest analysis JSON is corrupted", () => {
    const storage = createMemoryStorage({
      "manyang:latest-analysis": "{not-json",
    });

    expect(getLatestAnalysis(storage)).toBeNull();
  });

  test("prepends saved dream records", () => {
    const storage = createMemoryStorage();
    const first: CompletedDreamRecord = {
      id: "first",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };
    const second: CompletedDreamRecord = {
      id: "second",
      savedAt: "2026-05-25T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-25",
    };

    saveDreamRecord(storage, first);
    saveDreamRecord(storage, second);

    expect(getDreamRecords(storage).map((record) => record.id)).toEqual(["second", "first"]);
  });

  test("can limit saved dream records for local guest archives", () => {
    const storage = createMemoryStorage();
    const first: CompletedDreamRecord = {
      id: "first",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-24",
    };
    const second: CompletedDreamRecord = {
      id: "second",
      savedAt: "2026-05-25T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-25",
    };
    const third: CompletedDreamRecord = {
      id: "third",
      savedAt: "2026-05-26T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-26",
    };

    saveDreamRecord(storage, first, { maxRecords: 2 });
    saveDreamRecord(storage, second, { maxRecords: 2 });
    saveDreamRecord(storage, third, { maxRecords: 2 });

    expect(getDreamRecords(storage).map((record) => record.id)).toEqual(["third", "second"]);
  });

  test("deletes only the matching dream record", () => {
    const storage = createMemoryStorage();
    const first: CompletedDreamRecord = {
      id: "first",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };
    const second: CompletedDreamRecord = {
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

  test("restores a saved dream record as the latest analysis payload", () => {
    const storage = createMemoryStorage();
    const first: CompletedDreamRecord = {
      id: "first",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };
    const second: CompletedDreamRecord = {
      id: "second",
      savedAt: "2026-05-25T00:00:00.000Z",
      ...createPayload(),
      dreamDate: "2026-05-25",
      wakeMood: "궁금함",
    };

    saveDreamRecord(storage, first);
    saveDreamRecord(storage, second);

    expect(restoreDreamRecordAsLatestAnalysis(storage, "first")).toEqual({
      dreamText: first.dreamText,
      dreamDate: first.dreamDate,
      wakeMood: first.wakeMood,
      analysis: first.analysis,
    });
    expect(getLatestAnalysis(storage)).toEqual({
      dreamText: first.dreamText,
      dreamDate: first.dreamDate,
      wakeMood: first.wakeMood,
      analysis: first.analysis,
    });
    expect(restoreDreamRecordAsLatestAnalysis(storage, "missing")).toBeNull();
  });

  test("saves a provided dream record as the latest analysis payload", () => {
    const storage = createMemoryStorage();
    const record: CompletedDreamRecord = {
      id: "server-record",
      savedAt: "2026-05-24T00:00:00.000Z",
      ...createPayload(),
    };

    expect(saveDreamRecordAsLatestAnalysis(storage, record)).toEqual({
      dreamText: record.dreamText,
      dreamDate: record.dreamDate,
      wakeMood: record.wakeMood,
      analysis: record.analysis,
    });
    expect(getLatestAnalysis(storage)).toEqual({
      dreamText: record.dreamText,
      dreamDate: record.dreamDate,
      wakeMood: record.wakeMood,
      analysis: record.analysis,
    });
  });

  test("keeps dream records unchanged when deleting a missing record", () => {
    const storage = createMemoryStorage();
    const record: CompletedDreamRecord = {
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
