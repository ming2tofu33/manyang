import { describe, expect, test } from "vitest";

import type { DreamCompletedPayload, DreamUnavailablePayload } from "./dream-storage";
import { saveLatestDreamToArchive } from "./save-latest-dream";

function createCompletedPayload(): DreamCompletedPayload {
  return {
    dreamText: "I dreamed about a quiet train by the sea.",
    dreamDate: "2026-05-30",
    catReaderType: "gray_cat",
    wakeMood: "wistful",
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

function createUnavailablePayload(): DreamUnavailablePayload {
  return {
    status: "unavailable",
    dreamText: "I dreamed that a snake appeared in my room.",
    dreamDate: "2026-05-30",
    catReaderType: "gray_cat",
    reason: "provider_error",
    retryable: true,
    failedAt: "2026-05-30T00:00:00.000Z",
  };
}

describe("save latest dream to archive", () => {
  test("posts a completed latest payload to /api/dreams", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const payload = createCompletedPayload();
    const result = await saveLatestDreamToArchive(payload, async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({ dreamId: "db-dream-id" }, { status: 201 });
    });

    expect(result).toEqual({ status: "saved", dreamId: "db-dream-id" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/dreams");
    expect(calls[0].init).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({
      dreamText: payload.dreamText,
      dreamDate: payload.dreamDate,
      analysis: {
        dreamId: "runtime-dream-id",
      },
    });
  });

  test("does not save unavailable payloads", async () => {
    const result = await saveLatestDreamToArchive(createUnavailablePayload(), async () => {
      throw new Error("should not be called");
    });

    expect(result).toEqual({ status: "not_completed" });
  });

  test("returns unauthenticated when the archive API rejects the session", async () => {
    const result = await saveLatestDreamToArchive(createCompletedPayload(), async () =>
      Response.json({ error: "authentication required" }, { status: 401 }),
    );

    expect(result).toEqual({ status: "unauthenticated" });
  });

  test("returns error when the archive API fails", async () => {
    const result = await saveLatestDreamToArchive(createCompletedPayload(), async () =>
      Response.json({ error: "failed" }, { status: 500 }),
    );

    expect(result).toEqual({ status: "error" });
  });
});
