import { describe, expect, test } from "vitest";

import {
  createArchiveRecordViews,
  filterArchiveRecordViews,
  getArchiveRecordViewById,
  getFeaturedDreamRecordView,
  getRecentArchiveRecordViews,
} from "./archive-record-view";
import type { DreamRecord } from "./dream-storage";
import type { MorningMoodRecord } from "./morning-mood";
import type { NightCheckInRecord } from "./night-checkin";
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
      reader: {
        id: "black_cat",
        name: "검은냥",
        access: "free",
      },
      summary: input.summary ?? `${input.id} summary`,
      symbols: input.symbols ?? [],
      emotions: ["불안함"],
      themes: [],
      interpretation: `${input.id} interpretation`,
      smallPrescription: "작은 처방",
      symbolReadings: [],
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
    sourceId: input.sourceId ?? `morning-${input.appDate}`,
    createdAt: input.createdAt ?? `${input.appDate}T09:00:00.000Z`,
  };
}

function createMorningMood(input: {
  moodDate: string;
  mood?: string;
  moodColor?: string;
  bodyFeeling?: string;
  thought?: string;
}): MorningMoodRecord {
  return {
    id: `morning-${input.moodDate}`,
    moodDate: input.moodDate,
    mood: input.mood ?? "흐릿함",
    moodColor: input.moodColor ?? "안개 보라",
    bodyFeeling: input.bodyFeeling ?? "졸림",
    thought: input.thought ?? "기다림",
    savedAt: `${input.moodDate}T08:00:00.000Z`,
  };
}

function createNightCheckIn(input: {
  checkInDate: string;
  moodLabel?: string;
  conditionLabel?: string;
  note?: string;
  savedAt?: string;
}): NightCheckInRecord {
  return {
    checkInDate: input.checkInDate,
    moodId: "calm",
    moodLabel: input.moodLabel ?? "차분함",
    conditionId: "okay",
    conditionLabel: input.conditionLabel ?? "편안함",
    note: input.note ?? "",
    savedAt: input.savedAt ?? `${input.checkInDate}T22:00:00.000Z`,
  };
}

describe("archive record view", () => {
  test("normalizes mixed archive records into a descending timeline", () => {
    const views = createArchiveRecordViews({
      dreamRecords: [
        createDreamRecord({
          id: "dream-1",
          dreamDate: "2026-05-24",
          summary: "복도를 달린 꿈",
          symbols: ["복도", "신발"],
        }),
      ],
      pawprints: [createPawprint({ appDate: "2026-05-25" })],
      nightCheckInRecords: [createNightCheckIn({ checkInDate: "2026-05-23", note: "조용히 잠들고 싶다" })],
      morningMoodRecords: [createMorningMood({ moodDate: "2026-05-25", thought: "안개" })],
    });

    expect(views.map((view) => view.type)).toEqual(["pawprint", "dream", "night_checkin"]);
    expect(views[0]).toMatchObject({
      id: "pawprint-2026-05-25",
      title: "꿈의 발자국",
      categoryLabel: "발자국 기록",
      metaParts: ["흐릿함", "안개 보라", "졸림"],
      summary: "안개",
    });
    expect(views[1]).toMatchObject({
      title: "복도를 달린 꿈",
      categoryLabel: "꿈 영수증",
      tags: ["복도", "신발"],
      dreamRecordId: "dream-1",
    });
    expect(views[2]).toMatchObject({
      title: "밤의 기록",
      categoryLabel: "밤의 기록",
      metaParts: ["차분함", "편안함"],
      summary: "조용히 잠들고 싶다",
    });
  });

  test("filters views by query and type", () => {
    const views = createArchiveRecordViews({
      dreamRecords: [createDreamRecord({ id: "dream-1", dreamDate: "2026-05-24", symbols: ["복도"] })],
      pawprints: [createPawprint({ appDate: "2026-05-25" })],
      nightCheckInRecords: [createNightCheckIn({ checkInDate: "2026-05-23", note: "따뜻한 꿈" })],
      morningMoodRecords: [createMorningMood({ moodDate: "2026-05-25", thought: "커피" })],
    });

    expect(filterArchiveRecordViews(views, { query: "복도", type: "all" })).toHaveLength(1);
    expect(filterArchiveRecordViews(views, { query: "커피", type: "pawprint" })).toHaveLength(1);
    expect(filterArchiveRecordViews(views, { query: "따뜻", type: "night_checkin" })).toHaveLength(1);
    expect(filterArchiveRecordViews(views, { query: "", type: "dream" })).toHaveLength(1);
  });

  test("finds featured, recent, and detail records", () => {
    const views = createArchiveRecordViews({
      dreamRecords: [
        createDreamRecord({ id: "old-dream", dreamDate: "2026-05-20" }),
        createDreamRecord({ id: "new-dream", dreamDate: "2026-05-26" }),
      ],
      pawprints: [createPawprint({ appDate: "2026-05-25" })],
      nightCheckInRecords: [createNightCheckIn({ checkInDate: "2026-05-24" })],
      morningMoodRecords: [],
    });

    expect(getFeaturedDreamRecordView(views)?.dreamRecordId).toBe("new-dream");
    expect(getRecentArchiveRecordViews(views, 2)).toHaveLength(2);
    expect(getArchiveRecordViewById(views, "night-2026-05-24")?.type).toBe("night_checkin");
  });
});
