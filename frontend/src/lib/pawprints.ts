export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type PawprintSource = "morning_record" | "forgotten_dream" | "receipt_saved";

export type PawprintInput = {
  appDate: string;
  source: PawprintSource;
  sourceId: string;
};

export type PawprintRecord = PawprintInput & {
  id: string;
  createdAt: string;
};

export type PawprintSaveResult = {
  created: boolean;
  record: PawprintRecord;
};

export const pawprintRecordsKey = "manyang:pawprints";
export const pawprintChangedEvent = "manyang:pawprints-changed";

const pawprintTimeZone = "Asia/Seoul";
const pawprintDayBoundaryHours = 5;
const emptyPawprintRecords: PawprintRecord[] = [];

let pawprintSnapshotCache:
  | {
      raw: string | null;
      value: PawprintRecord[];
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

function notifyPawprintsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(pawprintChangedEvent));
  }
}

function formatAppDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: pawprintTimeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getPawprintAppDate(date = new Date()): string {
  const shiftedDate = new Date(date.getTime() - pawprintDayBoundaryHours * 60 * 60 * 1000);

  return formatAppDate(shiftedDate);
}

export function createPawprintRecord(input: PawprintInput): PawprintRecord {
  return {
    ...input,
    id: `pawprint-${input.appDate}`,
    createdAt: new Date().toISOString(),
  };
}

export function getPawprints(storage: StorageLike): PawprintRecord[] {
  const records = parseJson<PawprintRecord[]>(storage.getItem(pawprintRecordsKey), []);

  return Array.isArray(records) ? records : [];
}

export function getPawprintSnapshot(storage: StorageLike): PawprintRecord[] {
  const raw = storage.getItem(pawprintRecordsKey);

  if (pawprintSnapshotCache?.raw === raw) {
    return pawprintSnapshotCache.value;
  }

  const records = parseJson<PawprintRecord[]>(raw, emptyPawprintRecords);
  const value = Array.isArray(records) ? records : emptyPawprintRecords;
  pawprintSnapshotCache = { raw, value };

  return value;
}

export function savePawprint(storage: StorageLike, record: PawprintRecord): PawprintSaveResult {
  const records = getPawprints(storage);
  const existingRecord = records.find((storedRecord) => storedRecord.appDate === record.appDate);

  if (existingRecord) {
    return { created: false, record: existingRecord };
  }

  storage.setItem(pawprintRecordsKey, JSON.stringify([record, ...records]));

  return { created: true, record };
}

export function subscribeToPawprints(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(pawprintChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(pawprintChangedEvent, onStoreChange);
  };
}

export function getPawprintSnapshotFromBrowser(): PawprintRecord[] {
  const storage = getBrowserStorage();

  return storage ? getPawprintSnapshot(storage) : emptyPawprintRecords;
}

export function getEmptyPawprintSnapshot(): PawprintRecord[] {
  return emptyPawprintRecords;
}

export function savePawprintToBrowser(record: PawprintRecord): PawprintSaveResult | null {
  const storage = getBrowserStorage();

  if (!storage) {
    return null;
  }

  const result = savePawprint(storage, record);

  if (result.created) {
    notifyPawprintsChanged();
  }

  return result;
}
