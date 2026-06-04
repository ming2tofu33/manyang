import { describe, expect, test } from "vitest";

import {
  addArchiveMonths,
  canMoveArchiveMonth,
  formatArchiveMonth,
  getArchiveMonthRange,
  parseArchiveMonthFromDate,
  resolveArchiveMonth,
} from "./archive-month";
import type { DailyTarotReading } from "./daily-tarot";
import type { DreamRecord } from "./dream-storage";
import type { NightCheckInRecord } from "./night-checkin";
import type { PawprintRecord } from "./pawprints";

function createDreamRecord(dreamDate: string): DreamRecord {
  return {
    id: `dream-${dreamDate}`,
    dreamText: "",
    dreamDate,
    savedAt: `${dreamDate}T12:00:00.000Z`,
    analysis: {
      dreamId: `dream-${dreamDate}`,
      analysisId: `analysis-${dreamDate}`,
      cardId: `card-${dreamDate}`,
      reader: { id: "black_cat", name: "검은냥", access: "free" },
      summary: "꿈 기록",
      symbols: [],
      emotions: [],
      themes: [],
      interpretation: "",
      smallPrescription: "",
      symbolReadings: [],
      readingBasis: { usedSymbols: [], mainThemes: [], confidence: 0.7 },
      card: { name: "", type: "", keywords: [], summary: "", message: "", theme: "" },
    },
  };
}

function createPawprint(appDate: string): PawprintRecord {
  return {
    id: `pawprint-${appDate}`,
    appDate,
    source: "morning_record",
    sourceId: `morning-${appDate}`,
    createdAt: `${appDate}T09:00:00.000Z`,
  };
}

function createNightCheckIn(checkInDate: string): NightCheckInRecord {
  return {
    moodId: "calm",
    moodLabel: "차분함",
    conditionId: "okay",
    conditionLabel: "괜찮음",
    note: "",
    checkInDate,
    savedAt: `${checkInDate}T22:00:00.000Z`,
  };
}

function createTarotReading(appDate: string): Pick<DailyTarotReading, "appDate"> {
  return { appDate };
}

describe("archive month helpers", () => {
  test("parses archive months from app dates", () => {
    expect(parseArchiveMonthFromDate("2026-05-31")).toEqual({ year: 2026, month: 5 });
    expect(parseArchiveMonthFromDate("bad-date")).toBeNull();
  });

  test("finds the full month range across dreams, pawprints, and night records", () => {
    const range = getArchiveMonthRange({
      dreamRecords: [createDreamRecord("2026-05-31"), createDreamRecord("2026-08-01")],
      pawprints: [createPawprint("2026-04-30")],
      nightCheckInRecords: [createNightCheckIn("2026-07-01")],
    });

    expect(range).toEqual({
      start: { year: 2026, month: 4 },
      end: { year: 2026, month: 8 },
    });
  });

  test("includes daily tarot readings in the used month range", () => {
    const range = getArchiveMonthRange({
      dreamRecords: [createDreamRecord("2026-05-31")],
      pawprints: [],
      tarotReadings: [createTarotReading("2026-09-02")],
      nightCheckInRecords: [],
    });

    expect(range).toEqual({
      start: { year: 2026, month: 5 },
      end: { year: 2026, month: 9 },
    });
  });

  test("falls back to the current app month when there are no records", () => {
    expect(
      getArchiveMonthRange(
        {
          dreamRecords: [],
          pawprints: [],
          nightCheckInRecords: [],
        },
        "2026-06-01",
      ),
    ).toEqual({
      start: { year: 2026, month: 6 },
      end: { year: 2026, month: 6 },
    });
  });

  test("moves and clamps selected archive months inside the used range", () => {
    const range = {
      start: { year: 2026, month: 5 },
      end: { year: 2026, month: 7 },
    };

    expect(addArchiveMonths({ year: 2026, month: 5 }, -1)).toEqual({ year: 2026, month: 4 });
    expect(resolveArchiveMonth(null, range)).toEqual({ year: 2026, month: 7 });
    expect(resolveArchiveMonth({ year: 2026, month: 4 }, range)).toEqual({ year: 2026, month: 5 });
    expect(canMoveArchiveMonth({ year: 2026, month: 6 }, range, -1)).toBe(true);
    expect(canMoveArchiveMonth({ year: 2026, month: 5 }, range, -1)).toBe(false);
    expect(formatArchiveMonth({ year: 2026, month: 7 })).toBe("2026년 7월");
  });
});
