import { describe, expect, test } from "vitest";

import {
  countMonthlyDreamRecords,
  countMonthlyDreamSymbols,
  createArchiveTimeline,
  getDayInMonth,
} from "./archive-records";
import type { DreamCompletedPayload } from "./dream-storage";
import type { NightCheckInRecord } from "./night-checkin";
import type { PawprintRecord } from "./pawprints";

// 항상 completed 레코드를 만드는 헬퍼이므로 completed variant로 좁혀 analysis에 직접 접근한다.
type CompletedDreamRecord = DreamCompletedPayload & { id: string; savedAt: string };

function createDreamRecord(input: {
  id: string;
  dreamDate: string;
  savedAt?: string;
  summary?: string;
  symbols?: string[];
}): CompletedDreamRecord {
  return {
    id: input.id,
    dreamText: `${input.id} text`,
    dreamDate: input.dreamDate,
    savedAt: input.savedAt ?? `${input.dreamDate}T10:00:00.000Z`,
    analysis: {
      dreamId: input.id,
      analysisId: `${input.id}-analysis`,
      cardId: `${input.id}-card`,
      reader: {
        id: "black_cat",
        name: "검은냥",
        access: "free",
      },
      summary: input.summary ?? `${input.id} summary`,
      symbols: input.symbols ?? [],
      emotions: [],
      themes: [],
      interpretation: "",
      smallPrescription: "",
      symbolReadings: (input.symbols ?? []).map((symbol) => ({
        symbol,
        reading: `${symbol} reading`,
      })),
      readingBasis: {
        usedSymbols: input.symbols ?? [],
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

function createNightCheckIn(input: {
  checkInDate: string;
  moodLabel?: string;
  conditionLabel?: string;
  savedAt?: string;
}): NightCheckInRecord {
  return {
    moodId: "calm",
    moodLabel: input.moodLabel ?? "편안함",
    conditionId: "okay",
    conditionLabel: input.conditionLabel ?? "괜찮음",
    note: "",
    checkInDate: input.checkInDate,
    savedAt: input.savedAt ?? `${input.checkInDate}T08:00:00.000Z`,
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

  test("creates a descending monthly timeline from dreams, pawprints, and night check-ins", () => {
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
      nightCheckInRecords: [createNightCheckIn({ checkInDate: "2026-05-23", moodLabel: "편안함", conditionLabel: "괜찮음" })],
      year: 2026,
      month: 5,
    });

    expect(timeline.map((item) => item.type)).toEqual(["pawprint", "dream", "night_checkin"]);
    expect(timeline).toMatchObject([
      { date: "2026-05-25", title: "발자국 기록", meta: "꿈 영수증 저장" },
      { date: "2026-05-24", title: "복도를 달린 꿈", meta: "복도 · 신발" },
      { date: "2026-05-23", title: "밤의 기록", meta: "편안함 · 괜찮음" },
    ]);
  });

  test("handles legacy dream records without analysis symbols", () => {
    const legacyRecord = createDreamRecord({
      id: "legacy-dream",
      dreamDate: "2026-05-24",
      summary: "legacy summary",
    });

    delete (legacyRecord.analysis as Partial<typeof legacyRecord.analysis>).symbols;

    expect(countMonthlyDreamSymbols([legacyRecord], 2026, 5)).toBe(0);
    expect(
      createArchiveTimeline({
        dreamRecords: [legacyRecord],
        pawprints: [],
        nightCheckInRecords: [],
        year: 2026,
        month: 5,
      }),
    ).toMatchObject([
      {
        type: "dream",
        title: "legacy summary",
        meta: "",
      },
    ]);
  });
});
