import { describe, expect, test } from "vitest";

import {
  countMonthlyDreamRecords,
  countMonthlyDreamSymbols,
  createArchiveTimeline,
  getDayInMonth,
} from "./archive-records";
import type { DreamRecord } from "./dream-storage";
import type { DreamSeedRecord } from "./dream-seed";
import type { PawprintRecord } from "./pawprints";

function createDreamRecord(input: {
  id: string;
  dreamDate: string;
  savedAt?: string;
  summary?: string;
  symbols?: string[];
}): DreamRecord {
  return {
    id: input.id,
    dreamText: `${input.id} text`,
    dreamDate: input.dreamDate,
    savedAt: input.savedAt ?? `${input.dreamDate}T10:00:00.000Z`,
    analysis: {
      dreamId: input.id,
      analysisId: `${input.id}-analysis`,
      cardId: `${input.id}-card`,
      summary: input.summary ?? `${input.id} summary`,
      symbols: input.symbols ?? [],
      emotions: [],
      themes: [],
      interpretation: "",
      smallPrescription: "",
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

function createPawprint(input: {
  appDate: string;
  source?: PawprintRecord["source"];
  sourceId?: string;
  createdAt?: string;
}): PawprintRecord {
  return {
    id: `pawprint-${input.appDate}`,
    appDate: input.appDate,
    source: input.source ?? "morning_record",
    sourceId: input.sourceId ?? input.appDate,
    createdAt: input.createdAt ?? `${input.appDate}T09:00:00.000Z`,
  };
}

function createSeed(input: {
  seedDate: string;
  intentLabel?: string;
  atmosphere?: string;
  savedAt?: string;
}): DreamSeedRecord {
  return {
    intentId: "question",
    intentLabel: input.intentLabel ?? "힌트가 필요해",
    atmosphere: input.atmosphere ?? "조용한",
    note: "",
    seedDate: input.seedDate,
    savedAt: input.savedAt ?? `${input.seedDate}T08:00:00.000Z`,
  };
}

describe("archive records", () => {
  test("finds a day only inside the requested month", () => {
    expect(getDayInMonth("2026-05-24", 2026, 5)).toBe(24);
    expect(getDayInMonth("2026-06-01", 2026, 5)).toBeNull();
    expect(getDayInMonth("bad-date", 2026, 5)).toBeNull();
  });

  test("counts dream records and unique dream symbols for a month", () => {
    const records = [
      createDreamRecord({ id: "may-1", dreamDate: "2026-05-01", symbols: ["복도", "신발"] }),
      createDreamRecord({ id: "may-2", dreamDate: "2026-05-31", symbols: ["신발", "학교"] }),
      createDreamRecord({ id: "june-1", dreamDate: "2026-06-01", symbols: ["문"] }),
    ];

    expect(countMonthlyDreamRecords(records, 2026, 5)).toBe(2);
    expect(countMonthlyDreamSymbols(records, 2026, 5)).toBe(3);
  });

  test("creates a descending monthly timeline from dreams, pawprints, and seeds", () => {
    const timeline = createArchiveTimeline({
      dreamRecords: [
        createDreamRecord({
          id: "dream-1",
          dreamDate: "2026-05-24",
          summary: "복도를 달린 꿈",
          symbols: ["복도", "신발"],
        }),
      ],
      pawprints: [createPawprint({ appDate: "2026-05-25", source: "receipt_saved" })],
      seedRecords: [createSeed({ seedDate: "2026-05-23", intentLabel: "꿈에게 맡길래", atmosphere: "편안한" })],
      year: 2026,
      month: 5,
    });

    expect(timeline.map((item) => item.type)).toEqual(["pawprint", "dream", "seed"]);
    expect(timeline).toMatchObject([
      { date: "2026-05-25", title: "발자국 기록", meta: "꿈 영수증 저장" },
      { date: "2026-05-24", title: "복도를 달린 꿈", meta: "복도 · 신발" },
      { date: "2026-05-23", title: "꿈 씨앗", meta: "꿈에게 맡길래 · 편안한" },
    ]);
  });
});
