import type { DreamRecord } from "./dream-storage";
import { getManyangAppDate } from "./app-date";
import type { DailyTarotReading } from "./daily-tarot";
import type { NightCheckInRecord } from "./night-checkin";
import type { PawprintRecord } from "./pawprints";

export type ArchiveMonth = {
  year: number;
  month: number;
};

export type ArchiveMonthRange = {
  start: ArchiveMonth;
  end: ArchiveMonth;
};

type ArchiveMonthInput = {
  dreamRecords: DreamRecord[];
  pawprints: PawprintRecord[];
  tarotReadings?: Pick<DailyTarotReading, "appDate">[];
  nightCheckInRecords: NightCheckInRecord[];
};

const archiveMonthChangedEvent = "manyang:archive-month-changed";
let selectedArchiveMonth: ArchiveMonth | null = null;
const archiveMonthListeners = new Set<() => void>();

export function parseArchiveMonthFromDate(date: string): ArchiveMonth | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(date);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!year || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export function compareArchiveMonths(left: ArchiveMonth, right: ArchiveMonth): number {
  return left.year === right.year ? left.month - right.month : left.year - right.year;
}

export function addArchiveMonths(value: ArchiveMonth, delta: number): ArchiveMonth {
  const date = new Date(Date.UTC(value.year, value.month - 1 + delta, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function isSameArchiveMonth(left: ArchiveMonth, right: ArchiveMonth): boolean {
  return left.year === right.year && left.month === right.month;
}

export function clampArchiveMonth(value: ArchiveMonth, range: ArchiveMonthRange): ArchiveMonth {
  if (compareArchiveMonths(value, range.start) < 0) {
    return range.start;
  }

  if (compareArchiveMonths(value, range.end) > 0) {
    return range.end;
  }

  return value;
}

export function canMoveArchiveMonth(value: ArchiveMonth, range: ArchiveMonthRange, delta: number): boolean {
  const nextMonth = addArchiveMonths(value, delta);

  return compareArchiveMonths(nextMonth, range.start) >= 0 && compareArchiveMonths(nextMonth, range.end) <= 0;
}

export function formatArchiveMonth(value: ArchiveMonth): string {
  return `${value.year}년 ${value.month}월`;
}

export function getArchiveMonthRange(input: ArchiveMonthInput, fallbackDate = getManyangAppDate()): ArchiveMonthRange {
  const months = [
    ...input.dreamRecords.map((record) => parseArchiveMonthFromDate(record.dreamDate)),
    ...input.pawprints.map((record) => parseArchiveMonthFromDate(record.appDate)),
    ...(input.tarotReadings ?? []).map((record) => parseArchiveMonthFromDate(record.appDate)),
    ...input.nightCheckInRecords.map((record) => parseArchiveMonthFromDate(record.checkInDate)),
  ].filter((month): month is ArchiveMonth => month !== null);
  const fallback = parseArchiveMonthFromDate(fallbackDate) ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

  if (months.length === 0) {
    return { start: fallback, end: fallback };
  }

  return months.reduce<ArchiveMonthRange>(
    (range, month) => ({
      start: compareArchiveMonths(month, range.start) < 0 ? month : range.start,
      end: compareArchiveMonths(month, range.end) > 0 ? month : range.end,
    }),
    { start: months[0], end: months[0] },
  );
}

export function resolveArchiveMonth(selectedMonth: ArchiveMonth | null, range: ArchiveMonthRange): ArchiveMonth {
  return clampArchiveMonth(selectedMonth ?? range.end, range);
}

export function subscribeToArchiveMonth(onStoreChange: () => void): () => void {
  archiveMonthListeners.add(onStoreChange);

  return () => {
    archiveMonthListeners.delete(onStoreChange);
  };
}

export function getSelectedArchiveMonthSnapshot(): ArchiveMonth | null {
  return selectedArchiveMonth;
}

export function getSelectedArchiveMonthServerSnapshot(): ArchiveMonth | null {
  return null;
}

export function saveSelectedArchiveMonth(month: ArchiveMonth): void {
  selectedArchiveMonth = month;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(archiveMonthChangedEvent));
  }

  for (const listener of archiveMonthListeners) {
    listener();
  }
}
