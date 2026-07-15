import { CAT_READER_TYPES } from "@manyang/contracts/dream";
import { describe, expect, test } from "vitest";

import type { DreamCompletedPayload, DreamRecord } from "@/lib/dream-storage";
import { handleDreamRecordsRequest } from "./route";

function createDreamAnalysisResponse(): DreamCompletedPayload["analysis"] {
  const record = createRecord("analysis-source");

  if (record.status === "unavailable") {
    throw new Error("Expected completed test record");
  }

  return record.analysis;
}

function createRecord(id: string): DreamRecord {
  return {
    id,
    savedAt: "2026-05-30T12:00:00.000Z",
    dreamText: "I dreamed about a quiet train by the sea.",
    dreamDate: "2026-05-30",
    catReaderType: "gray_cat",
    analysis: {
      dreamId: "runtime-dream-id",
      analysisId: "runtime-analysis-id",
      cardId: "runtime-card-id",
      reader: {
        id: "gray_cat",
        name: "잿빛냥",
        access: "free",
      },
      summary: "A train dream near the sea.",
      symbols: ["Train", "Sea"],
      emotions: ["wistful"],
      themes: ["transition"],
      interpretation: "The dream can point to a transition held beside a large feeling.",
      symbolReadings: [],
      smallPrescription: "Ask which part of the transition feels closest today.",
      readingBasis: {
        usedSymbols: ["Train", "Sea"],
        mainThemes: ["transition"],
        confidence: 0.82,
      },
      card: {
        name: "Train by the Sea",
        type: "half_moon",
        keywords: ["train", "sea"],
        summary: "Movement beside a large feeling.",
        message: "Let the image stay specific.",
        theme: "transition",
      },
    },
  };
}

describe("GET /api/dreams", () => {
  test("returns 401 when the user is not authenticated", async () => {
    const response = await handleDreamRecordsRequest(new Request("http://localhost/api/dreams"), {
      getAuthenticatedUserId: async () => null,
      listDreamRecordsForUser: async () => [],
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  test("returns authenticated user's dream records from the server database", async () => {
    const records = [createRecord("00000000-0000-4000-8000-000000000101")];
    const listedUserIds: string[] = [];

    const response = await handleDreamRecordsRequest(new Request("http://localhost/api/dreams"), {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
      listDreamRecordsForUser: async (userId) => {
        listedUserIds.push(userId);
        return records;
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ records });
    expect(listedUserIds).toEqual(["00000000-0000-4000-8000-000000000001"]);
  });
});

describe("POST /api/dreams", () => {
  test.each(CAT_READER_TYPES)("accepts the shared reader id %s", async (catReaderType) => {
    const response = await handleDreamRecordsRequest(
      new Request("http://localhost/api/dreams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dreamText: "I dreamed about a quiet train by the sea.",
          dreamDate: "2026-05-30",
          catReaderType,
          analysis: createDreamAnalysisResponse(),
        }),
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        listDreamRecordsForUser: async () => [],
        persistCompletedDreamReading: async () => "db-dream-id",
      },
    );

    expect(response.status).not.toBe(400);
  });

  test("saves a latest completed receipt for an authenticated user", async () => {
    const persistedInputs: unknown[] = [];
    const response = await handleDreamRecordsRequest(
      new Request("http://localhost/api/dreams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dreamText: "I dreamed about a train.",
          dreamDate: "2026-05-30",
          catReaderType: "gray_cat",
          dreamAtmospheres: ["wistful"],
          dreamSensations: ["floating"],
          dreamSensationOther: "warm light",
          analysis: createDreamAnalysisResponse(),
        }),
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        listDreamRecordsForUser: async () => [],
        persistCompletedDreamReading: async (input) => {
          persistedInputs.push(input);
          return "db-dream-id";
        },
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ dreamId: "db-dream-id" });
    expect(persistedInputs).toEqual([
      expect.objectContaining({
        userId: "00000000-0000-4000-8000-000000000001",
        dreamText: "I dreamed about a train.",
        dreamDate: "2026-05-30",
        catReaderType: "gray_cat",
        dreamAtmospheres: ["wistful"],
        dreamSensations: ["floating"],
        dreamSensationOther: "warm light",
        analysis: expect.objectContaining({
          dreamId: "runtime-dream-id",
        }),
      }),
    ]);
  });

  test("refuses guest archive saves", async () => {
    const response = await handleDreamRecordsRequest(
      new Request("http://localhost/api/dreams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dreamText: "A dream.",
          dreamDate: "2026-05-30",
          analysis: createDreamAnalysisResponse(),
        }),
      }),
      {
        getAuthenticatedUserId: async () => null,
        listDreamRecordsForUser: async () => [],
        persistCompletedDreamReading: async () => "db-dream-id",
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  test("returns 400 for malformed latest receipt payloads", async () => {
    const response = await handleDreamRecordsRequest(
      new Request("http://localhost/api/dreams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dreamText: "",
          dreamDate: "bad-date",
          analysis: {},
        }),
      }),
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        listDreamRecordsForUser: async () => [],
        persistCompletedDreamReading: async () => "db-dream-id",
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "dreamText is required" });
  });
});
