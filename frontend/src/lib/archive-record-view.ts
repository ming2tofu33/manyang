import type { DreamRecord } from "./dream-storage";
import type { MorningMoodRecord } from "./morning-mood";
import type { NightCheckInRecord } from "./night-checkin";
import type { PawprintRecord, PawprintSource } from "./pawprints";

export type ArchiveRecordViewType = "dream" | "pawprint" | "night_checkin";
export type ArchiveRecordFilterType = ArchiveRecordViewType | "all";

export type ArchiveRecordView = {
  id: string;
  type: ArchiveRecordViewType;
  date: string;
  sortAt: string;
  title: string;
  categoryLabel: string;
  summary: string;
  metaParts: string[];
  tags: string[];
  searchText: string;
  dreamRecordId?: string;
  detailHref?: string;
  raw: {
    dreamRecord?: DreamRecord;
    pawprint?: PawprintRecord;
    morningMoodRecord?: MorningMoodRecord;
    nightCheckInRecord?: NightCheckInRecord;
  };
};

export type ArchiveRecordViewInput = {
  dreamRecords: DreamRecord[];
  pawprints: PawprintRecord[];
  nightCheckInRecords: NightCheckInRecord[];
  morningMoodRecords?: MorningMoodRecord[];
};

export type ArchiveRecordFilterInput = {
  query: string;
  type: ArchiveRecordFilterType;
};

const recentArchiveRecordTypeOrder: ArchiveRecordViewType[] = ["dream", "pawprint", "night_checkin"];

const pawprintSourceLabels: Record<PawprintSource, string> = {
  forgotten_dream: "기억나지 않는 꿈",
  morning_record: "아침 기록",
  receipt_saved: "꿈 영수증 저장",
};

function compactTextParts(parts: Array<string | null | undefined>): string[] {
  return parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));
}

function createSearchText(parts: Array<string | string[] | null | undefined>): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

type DreamCompletedRecord = Extract<DreamRecord, { analysis: unknown }>;
type DreamAnalysisStringArrayKey = "symbols" | "emotions" | "themes";
type DreamSymbolReading = DreamCompletedRecord["analysis"]["symbolReadings"][number];

function compactStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function getDreamAnalysisStringArray(record: DreamRecord, key: DreamAnalysisStringArrayKey): string[] {
  if (record.status === "unavailable") {
    return [];
  }

  return compactStringArray((record.analysis as Partial<Record<DreamAnalysisStringArrayKey, unknown>>)[key]);
}

function getDreamSymbolReadings(record: DreamRecord): DreamSymbolReading[] {
  if (record.status === "unavailable") {
    return [];
  }

  const readings = (record.analysis as Partial<{ symbolReadings: unknown }>).symbolReadings;

  if (!Array.isArray(readings)) {
    return [];
  }

  return readings.filter((reading): reading is DreamSymbolReading => {
    const partialReading = reading as Partial<DreamSymbolReading> | null;

    return typeof partialReading?.reading === "string";
  });
}

function getDreamRecordTitle(record: DreamRecord): string {
  return record.status === "unavailable" ? "읽지 못한 꿈" : record.analysis.summary;
}

function getDreamRecordSummary(record: DreamRecord): string {
  if (record.status === "unavailable") {
    return "다시 불러볼 수 있어요.";
  }

  return record.analysis.interpretation || record.analysis.smallPrescription || record.analysis.summary;
}

function createDreamRecordView(record: DreamRecord): ArchiveRecordView {
  const symbols = getDreamAnalysisStringArray(record, "symbols");
  const emotions = getDreamAnalysisStringArray(record, "emotions");
  const themes = getDreamAnalysisStringArray(record, "themes");
  const symbolReadingTexts = getDreamSymbolReadings(record).map((reading) => reading.reading);
  const tags = symbols.slice(0, 5);
  const metaParts =
    record.status === "unavailable"
      ? ["해몽 실패"]
      : compactTextParts([emotions[0], themes[0]]);
  const title = getDreamRecordTitle(record);
  const summary = getDreamRecordSummary(record);

  return {
    id: `dream-${record.id}`,
    type: "dream",
    date: record.dreamDate,
    sortAt: record.savedAt,
    title,
    categoryLabel: "꿈 영수증",
    summary,
    metaParts,
    tags,
    dreamRecordId: record.id,
    searchText: createSearchText([
      title,
      summary,
      record.dreamText,
      tags,
      metaParts,
      record.status === "unavailable" ? record.reason : symbolReadingTexts,
    ]),
    raw: {
      dreamRecord: record,
    },
  };
}

function createMorningMoodMap(records: MorningMoodRecord[]): Map<string, MorningMoodRecord> {
  return new Map(records.flatMap((record) => [[record.id, record], [`morning-${record.moodDate}`, record]]));
}

function createPawprintRecordView(
  record: PawprintRecord,
  morningMoodRecordsById: Map<string, MorningMoodRecord>,
): ArchiveRecordView {
  const morningMoodRecord = morningMoodRecordsById.get(record.sourceId);
  const fallbackSummary = pawprintSourceLabels[record.source];
  const summary = morningMoodRecord?.thought || fallbackSummary;
  const metaParts = morningMoodRecord
    ? compactTextParts([morningMoodRecord.mood, morningMoodRecord.moodColor, morningMoodRecord.bodyFeeling])
    : [fallbackSummary];
  const tags = morningMoodRecord
    ? compactTextParts([morningMoodRecord.mood, morningMoodRecord.moodColor, morningMoodRecord.bodyFeeling])
    : [fallbackSummary];

  return {
    id: `pawprint-${record.appDate}`,
    type: "pawprint",
    date: record.appDate,
    sortAt: record.createdAt,
    title: "꿈의 발자국",
    categoryLabel: "발자국 기록",
    summary,
    metaParts,
    tags,
    detailHref: `/archive/records/pawprint-${record.appDate}`,
    searchText: createSearchText(["꿈의 발자국", "발자국 기록", summary, metaParts, tags, record.source]),
    raw: {
      pawprint: record,
      ...(morningMoodRecord ? { morningMoodRecord } : {}),
    },
  };
}

function createNightCheckInRecordView(record: NightCheckInRecord): ArchiveRecordView {
  const metaParts = compactTextParts([record.moodLabel, record.conditionLabel]);
  const summary = record.note || "잠들기 전 마음과 컨디션을 남긴 기록이에요.";

  return {
    id: `night-${record.checkInDate}`,
    type: "night_checkin",
    date: record.checkInDate,
    sortAt: record.savedAt,
    title: "밤의 기록",
    categoryLabel: "밤의 기록",
    summary,
    metaParts,
    tags: metaParts,
    detailHref: `/archive/records/night-${record.checkInDate}`,
    searchText: createSearchText(["밤의 기록", summary, metaParts]),
    raw: {
      nightCheckInRecord: record,
    },
  };
}

export function createArchiveRecordViews(input: ArchiveRecordViewInput): ArchiveRecordView[] {
  const morningMoodRecordsById = createMorningMoodMap(input.morningMoodRecords ?? []);

  return [
    ...input.dreamRecords.map(createDreamRecordView),
    ...input.pawprints.map((record) => createPawprintRecordView(record, morningMoodRecordsById)),
    ...input.nightCheckInRecords.map(createNightCheckInRecordView),
  ].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    return dateDifference === 0 ? right.sortAt.localeCompare(left.sortAt) : dateDifference;
  });
}

export function filterArchiveRecordViews(
  views: ArchiveRecordView[],
  filter: ArchiveRecordFilterInput,
): ArchiveRecordView[] {
  const normalizedQuery = filter.query.trim().toLocaleLowerCase("ko-KR");

  return views.filter((view) => {
    const matchesType = filter.type === "all" || view.type === filter.type;
    const matchesQuery = !normalizedQuery || view.searchText.includes(normalizedQuery);

    return matchesType && matchesQuery;
  });
}

export function getFeaturedDreamRecordView(views: ArchiveRecordView[]): ArchiveRecordView | null {
  return views.find((view) => view.type === "dream") ?? null;
}

export function getRecentArchiveRecordViews(views: ArchiveRecordView[], limit = 3): ArchiveRecordView[] {
  const selectedViews: ArchiveRecordView[] = [];

  for (const type of recentArchiveRecordTypeOrder) {
    const view = views.find((candidate) => candidate.type === type);

    if (view) {
      selectedViews.push(view);
    }

    if (selectedViews.length >= limit) {
      break;
    }
  }

  return selectedViews;
}

export function getArchiveRecordViewById(views: ArchiveRecordView[], recordId: string): ArchiveRecordView | null {
  return views.find((view) => view.id === recordId) ?? null;
}
