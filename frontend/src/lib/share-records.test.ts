import { describe, expect, test } from "vitest";

import {
  createShareRecordPath,
  createShareUrl,
  isShareRecordKind,
  isSharedDreamPayload,
  isSharedTarotPayload,
  validateCreateShareRecordRequestBody,
  validateShareRecordSlug,
} from "./share-records";

describe("share records", () => {
  test("accepts dream and tarot share kinds only", () => {
    expect(isShareRecordKind("dream")).toBe(true);
    expect(isShareRecordKind("tarot")).toBe(true);
    expect(isShareRecordKind("receipt")).toBe(false);
  });

  test("validates the create share request body shape", () => {
    expect(
      validateCreateShareRecordRequestBody({
        kind: "dream",
        payload: { dreamText: "hallway", dreamDate: "2026-06-12", analysis: { dreamId: "dream-1" } },
      }),
    ).toEqual({
      ok: true,
      value: {
        kind: "dream",
        payload: { dreamText: "hallway", dreamDate: "2026-06-12", analysis: { dreamId: "dream-1" } },
      },
    });
  });

  test("rejects missing payloads and unknown share kinds", () => {
    expect(validateCreateShareRecordRequestBody({ kind: "dream" })).toEqual({
      ok: false,
      error: "payload is required",
    });
    expect(validateCreateShareRecordRequestBody({ kind: "image", payload: {} })).toEqual({
      ok: false,
      error: "kind must be dream or tarot",
    });
  });

  test("creates public read-only share paths and absolute URLs", () => {
    expect(createShareRecordPath("dream", "share-123")).toBe("/share/dream/share-123");
    expect(createShareRecordPath("tarot", "share-456")).toBe("/share/tarot/share-456");
    expect(createShareUrl("https://manyang.example", "dream", "share-123")).toBe(
      "https://manyang.example/share/dream/share-123",
    );
  });

  test("keeps share slugs constrained for route params", () => {
    expect(validateShareRecordSlug("abcDEF123_-")).toBe("abcDEF123_-");
    expect(validateShareRecordSlug("bad/path")).toBeNull();
    expect(validateShareRecordSlug("")).toBeNull();
  });

  test("recognizes shared dream result payloads", () => {
    expect(
      isSharedDreamPayload({
        dreamText: "corridor",
        dreamDate: "2026-06-12",
        analysis: {
          dreamId: "dream-1",
          summary: "corridor dream",
          interpretation: "A hallway appears.",
          smallPrescription: "Write one sentence.",
          symbols: ["corridor"],
          emotions: ["uneasy"],
          themes: ["movement"],
          symbolReadings: [],
          readingBasis: { usedSymbols: [], mainThemes: [], confidence: 0.8 },
          card: { name: "card", type: "moon", keywords: [], summary: "summary", message: "message", theme: "theme" },
          reader: { id: "black_cat", name: "black cat", access: "free" },
        },
      }),
    ).toBe(true);
    expect(isSharedDreamPayload({ dreamText: "corridor" })).toBe(false);
  });

  test("recognizes shared tarot result payloads", () => {
    const sharedTarotPayload = {
      id: "tarot-1",
      appDate: "2026-06-12",
      selectedAt: "2026-06-12T00:00:00.000Z",
      spread: "daily_one_card",
      source: "llm",
      card: { id: 0 },
      orientation: "upright",
      position: "today",
      cards: [],
      generated: { title: "title", overview: "overview", cardReadings: [], advice: "advice" },
      keywords: [],
      title: "title",
      message: "message",
      advice: "advice",
    };

    expect(isSharedTarotPayload(sharedTarotPayload)).toBe(true);
    expect(isSharedTarotPayload({ title: "title" })).toBe(false);
  });

  test("recognizes shared question tarot result payloads with question context", () => {
    const questionTarotPayload = {
      id: "tarot-question-1",
      appDate: "2026-07-03",
      selectedAt: "2026-07-03T00:00:00.000Z",
      spread: "question_one_card",
      source: "llm",
      card: { id: 22 },
      orientation: "upright",
      position: "today",
      cards: [],
      generated: { title: "title", overview: "overview", cardReadings: [], advice: "advice" },
      keywords: [],
      title: "title",
      message: "message",
      advice: "advice",
      questionContext: {
        stateKey: "mind_complex",
        stateLabel: "마음이 복잡해",
        questionKey: "held_feeling",
        questionText: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
      },
      unlockMethod: "daily_free",
    };

    expect(isSharedTarotPayload(questionTarotPayload)).toBe(true);
    expect(isSharedTarotPayload({ ...questionTarotPayload, questionContext: undefined })).toBe(false);
  });
});
