import { describe, expect, test } from "vitest";

import type { DreamRecord } from "./dream-storage";
import { deleteDreamRecordFromApi, fetchDreamRecordsFromApi } from "./dream-record-api";

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
        name: "Gray Cat",
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

describe("dream record API client", () => {
  test("loads authenticated dream records from the server API", async () => {
    const records = [createRecord("server-record")];
    const requestedUrls: string[] = [];

    const result = await fetchDreamRecordsFromApi(async (url) => {
      requestedUrls.push(String(url));
      return Response.json({ records });
    });

    expect(result).toEqual({
      status: "ok",
      records,
    });
    expect(requestedUrls).toEqual(["/api/dreams"]);
  });

  test("treats unauthenticated dream record requests as a local fallback signal", async () => {
    const result = await fetchDreamRecordsFromApi(async () => Response.json({ error: "authentication required" }, { status: 401 }));

    expect(result).toEqual({
      status: "unauthenticated",
      records: [],
    });
  });

  test("returns an error result when the server dream record payload is malformed", async () => {
    const result = await fetchDreamRecordsFromApi(async () => Response.json({ records: "bad-payload" }));

    expect(result.status).toBe("error");
  });

  test("deletes a server dream record through the API", async () => {
    const calls: Array<{ url: string; method?: string }> = [];

    const result = await deleteDreamRecordFromApi("dream-1", async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      return Response.json({ deleted: true });
    });

    expect(result).toEqual({ status: "deleted" });
    expect(calls).toEqual([{ url: "/api/dreams/dream-1", method: "DELETE" }]);
  });

  test("returns not_found when deleting a missing or unauthorized server dream record", async () => {
    const result = await deleteDreamRecordFromApi("missing", async () =>
      Response.json({ error: "dream record not found" }, { status: 404 }),
    );

    expect(result).toEqual({ status: "not_found" });
  });
});
