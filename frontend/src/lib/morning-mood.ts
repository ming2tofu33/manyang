export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type MorningMoodInput = {
  mood: string;
  moodColor: string;
  bodyFeeling: string;
  thought: string;
  moodDate: string;
};

export type MorningMoodRecord = MorningMoodInput & {
  id: string;
  savedAt: string;
};

export const morningMoodRecordsKey = "manyang:morning-moods";
export const morningMoodChangedEvent = "manyang:morning-mood-changed";
export const morningThoughtMaxLength = 80;

const emptyMorningMoodRecords: MorningMoodRecord[] = [];

let morningMoodRecordsSnapshotCache:
  | {
      raw: string | null;
      value: MorningMoodRecord[];
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

function notifyMorningMoodChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(morningMoodChangedEvent));
  }
}

function normalizeThought(thought: string): string {
  return thought.trim().slice(0, morningThoughtMaxLength);
}

export function createMorningMoodRecord(input: MorningMoodInput): MorningMoodRecord {
  return {
    ...input,
    id: `morning-${input.moodDate}`,
    thought: normalizeThought(input.thought),
    savedAt: new Date().toISOString(),
  };
}

export function getMorningMoodRecords(storage: StorageLike): MorningMoodRecord[] {
  const records = parseJson<MorningMoodRecord[]>(storage.getItem(morningMoodRecordsKey), []);

  return Array.isArray(records) ? records : [];
}

export function getMorningMoodRecordsSnapshot(storage: StorageLike): MorningMoodRecord[] {
  const raw = storage.getItem(morningMoodRecordsKey);

  if (morningMoodRecordsSnapshotCache?.raw === raw) {
    return morningMoodRecordsSnapshotCache.value;
  }

  const records = parseJson<MorningMoodRecord[]>(raw, emptyMorningMoodRecords);
  const value = Array.isArray(records) ? records : emptyMorningMoodRecords;
  morningMoodRecordsSnapshotCache = { raw, value };

  return value;
}

export function getLatestMorningMoodRecord(storage: StorageLike): MorningMoodRecord | null {
  return getMorningMoodRecords(storage)[0] ?? null;
}

export function saveMorningMoodRecord(storage: StorageLike, record: MorningMoodRecord): void {
  const records = getMorningMoodRecords(storage).filter((storedRecord) => storedRecord.id !== record.id);

  storage.setItem(morningMoodRecordsKey, JSON.stringify([record, ...records]));
}

export function subscribeToMorningMood(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(morningMoodChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(morningMoodChangedEvent, onStoreChange);
  };
}

export function getMorningMoodRecordsSnapshotFromBrowser(): MorningMoodRecord[] {
  const storage = getBrowserStorage();

  return storage ? getMorningMoodRecordsSnapshot(storage) : emptyMorningMoodRecords;
}

export function getEmptyMorningMoodRecordsSnapshot(): MorningMoodRecord[] {
  return emptyMorningMoodRecords;
}

export function getLatestMorningMoodRecordFromBrowser(): MorningMoodRecord | null {
  const storage = getBrowserStorage();

  return storage ? getLatestMorningMoodRecord(storage) : null;
}

export function saveMorningMoodRecordToBrowser(record: MorningMoodRecord): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveMorningMoodRecord(storage, record);
    notifyMorningMoodChanged();
  }
}
