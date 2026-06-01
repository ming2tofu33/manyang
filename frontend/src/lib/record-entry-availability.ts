import { getManyangAppHour } from "./app-date";

export type ArchiveRecordEntryKey = "dream" | "morning" | "night";

export type ArchiveRecordEntryAvailability = {
  key: ArchiveRecordEntryKey;
  isAvailable: boolean;
  disabledReason: string | null;
};

export type ArchiveRecordEntryState = Record<ArchiveRecordEntryKey, ArchiveRecordEntryAvailability>;

export function isNightRecordTime(date = new Date()): boolean {
  const hour = getManyangAppHour(date);

  return hour >= 18 || hour < 5;
}

export function getArchiveRecordEntryState(date = new Date()): ArchiveRecordEntryState {
  const isNight = isNightRecordTime(date);

  return {
    dream: {
      key: "dream",
      isAvailable: true,
      disabledReason: null,
    },
    morning: {
      key: "morning",
      isAvailable: !isNight,
      disabledReason: isNight ? "아침 5시부터 남길 수 있어요." : null,
    },
    night: {
      key: "night",
      isAvailable: isNight,
      disabledReason: isNight ? null : "저녁 6시부터 남길 수 있어요.",
    },
  };
}
