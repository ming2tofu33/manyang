import { getManyangAppDate, getManyangAppHour, shiftManyangAppDate } from "./app-date";
import { nightCheckInNoteMaxLength } from "./night-checkin-options";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type NightCheckInInput = {
  moodId: string;
  moodLabel: string;
  conditionId: string;
  conditionLabel: string;
  note: string;
  checkInDate: string;
};

export type NightCheckInRecord = NightCheckInInput & {
  savedAt: string;
};

export type NightCheckInPersistenceInput = {
  isAuthenticated: boolean;
};

export const nightCheckInKey = "manyang:night-checkin";
export const nightCheckInRecordsKey = "manyang:night-checkins";
export const nightCheckInChangedEvent = "manyang:night-checkin-changed";

const emptyNightCheckInRecords: NightCheckInRecord[] = [];

let nightCheckInSnapshotCache:
  | {
      raw: string | null;
      value: NightCheckInRecord | null;
    }
  | null = null;

let nightCheckInRecordsSnapshotCache:
  | {
      raw: string | null;
      value: NightCheckInRecord[];
    }
  | null = null;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function notifyNightCheckInChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(nightCheckInChangedEvent));
  }
}

function normalizeNightCheckInNote(note: string): string {
  return note.trim().slice(0, nightCheckInNoteMaxLength);
}

function normalizeStoredNightCheckIn(record: NightCheckInRecord | null): NightCheckInRecord | null {
  if (!record) {
    return null;
  }

  return {
    ...record,
    note: normalizeNightCheckInNote(record.note),
  };
}

function normalizeStoredNightCheckInRecords(records: NightCheckInRecord[]): NightCheckInRecord[] {
  return records
    .map((record) => normalizeStoredNightCheckIn(record))
    .filter((record): record is NightCheckInRecord => Boolean(record));
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPreviousDateString(dateString: string): string | null {
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  return formatLocalDate(date);
}

export function createNightCheckInRecord(input: NightCheckInInput): NightCheckInRecord {
  return {
    ...input,
    note: normalizeNightCheckInNote(input.note),
    savedAt: new Date().toISOString(),
  };
}

export function getNightCheckInAppDate(date = new Date()): string {
  const appDate = getManyangAppDate(date);

  return getManyangAppHour(date) < 5 ? shiftManyangAppDate(appDate, -1) : appDate;
}

export function canPersistNightCheckIn(input: NightCheckInPersistenceInput): boolean {
  void input;

  return true;
}

export function getNightCheckIn(storage: StorageLike): NightCheckInRecord | null {
  return normalizeStoredNightCheckIn(parseJson<NightCheckInRecord | null>(storage.getItem(nightCheckInKey), null));
}

export function getNightCheckInSnapshot(storage: StorageLike): NightCheckInRecord | null {
  const raw = storage.getItem(nightCheckInKey);

  if (nightCheckInSnapshotCache?.raw === raw) {
    return nightCheckInSnapshotCache.value;
  }

  const value = normalizeStoredNightCheckIn(parseJson<NightCheckInRecord | null>(raw, null));
  nightCheckInSnapshotCache = { raw, value };

  return value;
}

export function getNightCheckInRecords(storage: StorageLike): NightCheckInRecord[] {
  const records = parseJson<NightCheckInRecord[]>(storage.getItem(nightCheckInRecordsKey), []);

  return Array.isArray(records) ? normalizeStoredNightCheckInRecords(records) : [];
}

export function getNightCheckInRecordsSnapshot(storage: StorageLike): NightCheckInRecord[] {
  const raw = storage.getItem(nightCheckInRecordsKey);

  if (nightCheckInRecordsSnapshotCache?.raw === raw) {
    return nightCheckInRecordsSnapshotCache.value;
  }

  const records = parseJson<NightCheckInRecord[]>(raw, emptyNightCheckInRecords);
  const value = Array.isArray(records) ? normalizeStoredNightCheckInRecords(records) : emptyNightCheckInRecords;
  nightCheckInRecordsSnapshotCache = { raw, value };

  return value;
}

export function saveNightCheckIn(storage: StorageLike, record: NightCheckInRecord): void {
  const records = getNightCheckInRecords(storage).filter(
    (storedRecord) => storedRecord.checkInDate !== record.checkInDate,
  );

  storage.setItem(nightCheckInKey, JSON.stringify(record));
  storage.setItem(nightCheckInRecordsKey, JSON.stringify([record, ...records]));
}

export function countMonthlyNightCheckIns(records: NightCheckInRecord[], year: number, month: number): number {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const checkInDates = new Set(records.map((record) => record.checkInDate));

  return [...checkInDates].filter((checkInDate) => checkInDate.startsWith(monthPrefix)).length;
}

export function getNightCheckInFromBrowser(): NightCheckInRecord | null {
  const storage = getBrowserStorage();

  return storage ? getNightCheckIn(storage) : null;
}

export function getNightCheckInSnapshotFromBrowser(): NightCheckInRecord | null {
  const storage = getBrowserStorage();

  return storage ? getNightCheckInSnapshot(storage) : null;
}

export function getNightCheckInRecordsSnapshotFromBrowser(): NightCheckInRecord[] {
  const storage = getBrowserStorage();

  return storage ? getNightCheckInRecordsSnapshot(storage) : emptyNightCheckInRecords;
}

export function getEmptyNightCheckInRecordsSnapshot(): NightCheckInRecord[] {
  return emptyNightCheckInRecords;
}

export function isNightCheckInRelatedToDreamDate(record: NightCheckInRecord | null, dreamDate: string): boolean {
  if (!record) {
    return false;
  }

  const previousDreamDate = getPreviousDateString(dreamDate);

  return record.checkInDate === dreamDate || record.checkInDate === previousDreamDate;
}

export function subscribeToNightCheckIn(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(nightCheckInChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(nightCheckInChangedEvent, onStoreChange);
  };
}

export function saveNightCheckInToBrowser(
  record: NightCheckInRecord,
  persistence: NightCheckInPersistenceInput = { isAuthenticated: false },
): boolean {
  if (!canPersistNightCheckIn(persistence)) {
    return false;
  }

  const storage = getBrowserStorage();

  if (storage) {
    saveNightCheckIn(storage, record);
    notifyNightCheckInChanged();
    return true;
  }

  return false;
}
