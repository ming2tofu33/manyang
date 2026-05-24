export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type DreamSeedInput = {
  intentId: string;
  intentLabel: string;
  note: string;
  seedDate: string;
};

export type DreamSeedRecord = DreamSeedInput & {
  savedAt: string;
};

export const dreamSeedKey = "manyang:dream-seed";

let dreamSeedSnapshotCache:
  | {
      raw: string | null;
      value: DreamSeedRecord | null;
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

export function createDreamSeedRecord(input: DreamSeedInput): DreamSeedRecord {
  return {
    ...input,
    note: input.note.trim(),
    savedAt: new Date().toISOString(),
  };
}

export function getDreamSeed(storage: StorageLike): DreamSeedRecord | null {
  return parseJson<DreamSeedRecord | null>(storage.getItem(dreamSeedKey), null);
}

export function getDreamSeedSnapshot(storage: StorageLike): DreamSeedRecord | null {
  const raw = storage.getItem(dreamSeedKey);

  if (dreamSeedSnapshotCache?.raw === raw) {
    return dreamSeedSnapshotCache.value;
  }

  const value = parseJson<DreamSeedRecord | null>(raw, null);
  dreamSeedSnapshotCache = { raw, value };

  return value;
}

export function saveDreamSeed(storage: StorageLike, record: DreamSeedRecord): void {
  storage.setItem(dreamSeedKey, JSON.stringify(record));
}

export function getDreamSeedFromBrowser(): DreamSeedRecord | null {
  const storage = getBrowserStorage();

  return storage ? getDreamSeed(storage) : null;
}

export function getDreamSeedSnapshotFromBrowser(): DreamSeedRecord | null {
  const storage = getBrowserStorage();

  return storage ? getDreamSeedSnapshot(storage) : null;
}

export function subscribeToDreamSeed(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

export function saveDreamSeedToBrowser(record: DreamSeedRecord): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveDreamSeed(storage, record);
  }
}
