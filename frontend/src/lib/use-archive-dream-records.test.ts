import { describe, expect, test } from "vitest";

import type { DreamRecord } from "./dream-storage";
import { resolveArchiveDreamRecordState, type RemoteDreamRecordsSnapshot } from "./use-archive-dream-records";

function createRecord(id: string): DreamRecord {
  return {
    id,
    savedAt: "2026-05-30T12:00:00.000Z",
    dreamText: `${id} dream`,
    dreamDate: "2026-05-30",
    analysis: {
      dreamId: id,
      analysisId: `${id}-analysis`,
      cardId: `${id}-card`,
      reader: {
        id: "black_cat",
        name: "검은냥",
        access: "free",
      },
      summary: `${id} summary`,
      symbols: [],
      emotions: [],
      themes: [],
      interpretation: "",
      symbolReadings: [],
      smallPrescription: "",
      readingBasis: {
        usedSymbols: [],
        mainThemes: [],
        confidence: 0.7,
      },
      card: {
        name: "",
        type: "",
        keywords: [],
        summary: "",
        message: "",
        theme: "",
      },
    },
  };
}

describe("archive dream record source resolution", () => {
  test("uses server records when the authenticated API load succeeds", () => {
    const localRecords = [createRecord("local")];
    const remote: RemoteDreamRecordsSnapshot = {
      status: "server",
      records: [createRecord("server")],
    };

    expect(resolveArchiveDreamRecordState(localRecords, remote)).toMatchObject({
      source: "server",
      dreamRecords: remote.records,
      isLoadingServerRecords: false,
    });
  });

  test("keeps local records visible while the server request is loading", () => {
    const localRecords = [createRecord("local")];

    expect(resolveArchiveDreamRecordState(localRecords, { status: "loading", records: [] })).toMatchObject({
      source: "local",
      dreamRecords: localRecords,
      isLoadingServerRecords: true,
      canViewArchive: true,
    });
  });

  test("exposes local dream records to guest archive", () => {
    const localRecords = [createRecord("local")];
    const remote: RemoteDreamRecordsSnapshot = {
      status: "guest",
      records: [],
    };

    expect(resolveArchiveDreamRecordState(localRecords, remote)).toMatchObject({
      source: "local",
      dreamRecords: localRecords,
      isLoadingServerRecords: false,
      canViewArchive: true,
    });
  });
});
