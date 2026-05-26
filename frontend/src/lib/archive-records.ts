import type { DreamSeedRecord } from "./dream-seed";
import type { DreamRecord } from "./dream-storage";
import type { PawprintRecord, PawprintSource } from "./pawprints";

export type ArchiveTimelineItemType = "dream" | "pawprint" | "seed";

export type ArchiveTimelineItem = {
  id: string;
  type: ArchiveTimelineItemType;
  date: string;
  title: string;
  meta: string;
  sortAt: string;
  dreamRecordId?: string;
};

const pawprintSourceLabels: Record<PawprintSource, string> = {
  forgotten_dream: "꿈을 기억하지 못함",
  morning_record: "아침 기분 기록",
  receipt_saved: "꿈 영수증 저장",
};

function getMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-`;
}

function isInMonth(date: string, year: number, month: number): boolean {
  return date.startsWith(getMonthPrefix(year, month));
}

function joinMeta(parts: string[]): string {
  return parts.filter(Boolean).join(" · ");
}

export function getDayInMonth(date: string, year: number, month: number): number | null {
  const [dateYear, dateMonth, dateDay] = date.split("-").map(Number);

  if (dateYear !== year || dateMonth !== month || !dateDay) {
    return null;
  }

  return dateDay;
}

export function countMonthlyDreamRecords(records: DreamRecord[], year: number, month: number): number {
  return records.filter((record) => isInMonth(record.dreamDate, year, month)).length;
}

export function countMonthlyDreamSymbols(records: DreamRecord[], year: number, month: number): number {
  const symbols = new Set<string>();

  for (const record of records) {
    if (!isInMonth(record.dreamDate, year, month)) {
      continue;
    }

    for (const symbol of record.analysis.symbols) {
      symbols.add(symbol);
    }
  }

  return symbols.size;
}

export function createArchiveTimeline(input: {
  dreamRecords: DreamRecord[];
  pawprints: PawprintRecord[];
  seedRecords: DreamSeedRecord[];
  year: number;
  month: number;
}): ArchiveTimelineItem[] {
  const dreamItems = input.dreamRecords
    .filter((record) => isInMonth(record.dreamDate, input.year, input.month))
    .map<ArchiveTimelineItem>((record) => ({
      id: `dream-${record.id}`,
      type: "dream",
      date: record.dreamDate,
      title: record.analysis.summary,
      meta: joinMeta(record.analysis.symbols.slice(0, 3)),
      sortAt: record.savedAt,
      dreamRecordId: record.id,
    }));

  const pawprintItems = input.pawprints
    .filter((record) => isInMonth(record.appDate, input.year, input.month))
    .map<ArchiveTimelineItem>((record) => ({
      id: `pawprint-${record.id}`,
      type: "pawprint",
      date: record.appDate,
      title: "발자국 기록",
      meta: pawprintSourceLabels[record.source],
      sortAt: record.createdAt,
    }));

  const seedItems = input.seedRecords
    .filter((record) => isInMonth(record.seedDate, input.year, input.month))
    .map<ArchiveTimelineItem>((record) => ({
      id: `seed-${record.seedDate}`,
      type: "seed",
      date: record.seedDate,
      title: "꿈 씨앗",
      meta: joinMeta([record.intentLabel, record.atmosphere]),
      sortAt: record.savedAt,
    }));

  return [...dreamItems, ...pawprintItems, ...seedItems].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    return right.sortAt.localeCompare(left.sortAt);
  });
}
