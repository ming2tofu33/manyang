import { defaultDreamSeedAtmosphere, doesDreamSeedIntentAcceptNote, dreamSeedNoteMaxLength } from "./dream-seed-options";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type DreamSeedInput = {
  intentId: string;
  intentLabel: string;
  atmosphere: string;
  note: string;
  seedDate: string;
};

export type DreamSeedRecord = DreamSeedInput & {
  savedAt: string;
};

export const dreamSeedKey = "manyang:dream-seed";
export const dreamSeedRecordsKey = "manyang:dream-seeds";
export const dreamSeedChangedEvent = "manyang:dream-seed-changed";

const emptyDreamSeedRecords: DreamSeedRecord[] = [];

let dreamSeedSnapshotCache:
  | {
      raw: string | null;
      value: DreamSeedRecord | null;
    }
  | null = null;

let dreamSeedRecordsSnapshotCache:
  | {
      raw: string | null;
      value: DreamSeedRecord[];
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

function notifyDreamSeedChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(dreamSeedChangedEvent));
  }
}

function normalizeDreamSeedNote(input: DreamSeedInput): string {
  if (!doesDreamSeedIntentAcceptNote(input.intentId)) {
    return "";
  }

  return input.note.trim().slice(0, dreamSeedNoteMaxLength);
}

function normalizeDreamSeedAtmosphere(atmosphere: string | undefined): string {
  return atmosphere?.trim() || defaultDreamSeedAtmosphere;
}

function normalizeStoredDreamSeed(record: DreamSeedRecord | null): DreamSeedRecord | null {
  if (!record) {
    return null;
  }

  return {
    ...record,
    atmosphere: normalizeDreamSeedAtmosphere(record.atmosphere),
  };
}

function normalizeStoredDreamSeedRecords(records: DreamSeedRecord[]): DreamSeedRecord[] {
  return records
    .map((record) => normalizeStoredDreamSeed(record))
    .filter((record): record is DreamSeedRecord => Boolean(record));
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

export function createDreamSeedRecord(input: DreamSeedInput): DreamSeedRecord {
  return {
    ...input,
    atmosphere: normalizeDreamSeedAtmosphere(input.atmosphere),
    note: normalizeDreamSeedNote(input),
    savedAt: new Date().toISOString(),
  };
}

export function getDreamSeed(storage: StorageLike): DreamSeedRecord | null {
  return normalizeStoredDreamSeed(parseJson<DreamSeedRecord | null>(storage.getItem(dreamSeedKey), null));
}

export function getDreamSeedSnapshot(storage: StorageLike): DreamSeedRecord | null {
  const raw = storage.getItem(dreamSeedKey);

  if (dreamSeedSnapshotCache?.raw === raw) {
    return dreamSeedSnapshotCache.value;
  }

  const value = normalizeStoredDreamSeed(parseJson<DreamSeedRecord | null>(raw, null));
  dreamSeedSnapshotCache = { raw, value };

  return value;
}

export function getDreamSeedRecords(storage: StorageLike): DreamSeedRecord[] {
  const records = parseJson<DreamSeedRecord[]>(storage.getItem(dreamSeedRecordsKey), []);

  return Array.isArray(records) ? normalizeStoredDreamSeedRecords(records) : [];
}

export function getDreamSeedRecordsSnapshot(storage: StorageLike): DreamSeedRecord[] {
  const raw = storage.getItem(dreamSeedRecordsKey);

  if (dreamSeedRecordsSnapshotCache?.raw === raw) {
    return dreamSeedRecordsSnapshotCache.value;
  }

  const records = parseJson<DreamSeedRecord[]>(raw, emptyDreamSeedRecords);
  const value = Array.isArray(records) ? normalizeStoredDreamSeedRecords(records) : emptyDreamSeedRecords;
  dreamSeedRecordsSnapshotCache = { raw, value };

  return value;
}

export function saveDreamSeed(storage: StorageLike, record: DreamSeedRecord): void {
  const records = getDreamSeedRecords(storage).filter((storedRecord) => storedRecord.seedDate !== record.seedDate);

  storage.setItem(dreamSeedKey, JSON.stringify(record));
  storage.setItem(dreamSeedRecordsKey, JSON.stringify([record, ...records]));
}

export function countMonthlyDreamSeeds(records: DreamSeedRecord[], year: number, month: number): number {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const seedDates = new Set(records.map((record) => record.seedDate));

  return [...seedDates].filter((seedDate) => seedDate.startsWith(monthPrefix)).length;
}

export function getDreamSeedFromBrowser(): DreamSeedRecord | null {
  const storage = getBrowserStorage();

  return storage ? getDreamSeed(storage) : null;
}

export function getDreamSeedSnapshotFromBrowser(): DreamSeedRecord | null {
  const storage = getBrowserStorage();

  return storage ? getDreamSeedSnapshot(storage) : null;
}

export function getDreamSeedRecordsSnapshotFromBrowser(): DreamSeedRecord[] {
  const storage = getBrowserStorage();

  return storage ? getDreamSeedRecordsSnapshot(storage) : emptyDreamSeedRecords;
}

export function getEmptyDreamSeedRecordsSnapshot(): DreamSeedRecord[] {
  return emptyDreamSeedRecords;
}

export function isDreamSeedRelatedToDreamDate(seed: DreamSeedRecord | null, dreamDate: string): boolean {
  if (!seed) {
    return false;
  }

  const previousDreamDate = getPreviousDateString(dreamDate);

  return seed.seedDate === dreamDate || seed.seedDate === previousDreamDate;
}

export function subscribeToDreamSeed(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(dreamSeedChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(dreamSeedChangedEvent, onStoreChange);
  };
}

export function saveDreamSeedToBrowser(record: DreamSeedRecord): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveDreamSeed(storage, record);
    notifyDreamSeedChanged();
  }
}
