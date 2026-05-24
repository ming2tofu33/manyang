import type { DreamAnalysisResponse } from "@manyang/backend";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type LatestAnalysisPayload = {
  dreamText: string;
  dreamDate: string;
  wakeMood?: string;
  analysis: DreamAnalysisResponse;
};

export type DreamRecord = LatestAnalysisPayload & {
  id: string;
  savedAt: string;
};

export const latestAnalysisKey = "manyang:latest-analysis";
export const dreamRecordsKey = "manyang:dreams";
export const dreamStorageChangedEvent = "manyang:dream-storage-changed";

const emptyDreamRecords: DreamRecord[] = [];

let latestAnalysisSnapshotCache:
  | {
      raw: string | null;
      value: LatestAnalysisPayload | null;
    }
  | null = null;

let dreamRecordsSnapshotCache:
  | {
      raw: string | null;
      value: DreamRecord[];
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

function notifyDreamStorageChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(dreamStorageChangedEvent));
  }
}

export function subscribeToDreamStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(dreamStorageChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(dreamStorageChangedEvent, onStoreChange);
  };
}

export function getLatestAnalysis(storage: StorageLike): LatestAnalysisPayload | null {
  return parseJson<LatestAnalysisPayload | null>(storage.getItem(latestAnalysisKey), null);
}

export function getLatestAnalysisSnapshot(storage: StorageLike): LatestAnalysisPayload | null {
  const raw = storage.getItem(latestAnalysisKey);

  if (latestAnalysisSnapshotCache?.raw === raw) {
    return latestAnalysisSnapshotCache.value;
  }

  const value = parseJson<LatestAnalysisPayload | null>(raw, null);
  latestAnalysisSnapshotCache = { raw, value };

  return value;
}

export function saveLatestAnalysis(storage: StorageLike, payload: LatestAnalysisPayload): void {
  storage.setItem(latestAnalysisKey, JSON.stringify(payload));
}

export function clearLatestAnalysis(storage: StorageLike): void {
  storage.removeItem(latestAnalysisKey);
}

export function getDreamRecords(storage: StorageLike): DreamRecord[] {
  const records = parseJson<DreamRecord[]>(storage.getItem(dreamRecordsKey), []);

  return Array.isArray(records) ? records : [];
}

export function getDreamRecordsSnapshot(storage: StorageLike): DreamRecord[] {
  const raw = storage.getItem(dreamRecordsKey);

  if (dreamRecordsSnapshotCache?.raw === raw) {
    return dreamRecordsSnapshotCache.value;
  }

  const records = parseJson<DreamRecord[]>(raw, emptyDreamRecords);
  const value = Array.isArray(records) ? records : emptyDreamRecords;
  dreamRecordsSnapshotCache = { raw, value };

  return value;
}

export function saveDreamRecord(storage: StorageLike, record: DreamRecord): void {
  const records = getDreamRecords(storage).filter((storedRecord) => storedRecord.id !== record.id);

  storage.setItem(dreamRecordsKey, JSON.stringify([record, ...records]));
}

export function deleteDreamRecord(storage: StorageLike, recordId: string): void {
  const records = getDreamRecords(storage).filter((storedRecord) => storedRecord.id !== recordId);

  storage.setItem(dreamRecordsKey, JSON.stringify(records));
}

export function getLatestAnalysisFromBrowser(): LatestAnalysisPayload | null {
  const storage = getBrowserStorage();

  return storage ? getLatestAnalysis(storage) : null;
}

export function getLatestAnalysisSnapshotFromBrowser(): LatestAnalysisPayload | null {
  const storage = getBrowserStorage();

  return storage ? getLatestAnalysisSnapshot(storage) : null;
}

export function saveLatestAnalysisToBrowser(payload: LatestAnalysisPayload): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveLatestAnalysis(storage, payload);
    notifyDreamStorageChanged();
  }
}

export function clearLatestAnalysisFromBrowser(): void {
  const storage = getBrowserStorage();

  if (storage) {
    clearLatestAnalysis(storage);
    notifyDreamStorageChanged();
  }
}

export function getDreamRecordsFromBrowser(): DreamRecord[] {
  const storage = getBrowserStorage();

  return storage ? getDreamRecords(storage) : [];
}

export function getDreamRecordsSnapshotFromBrowser(): DreamRecord[] {
  const storage = getBrowserStorage();

  return storage ? getDreamRecordsSnapshot(storage) : emptyDreamRecords;
}

export function getEmptyDreamRecordsSnapshot(): DreamRecord[] {
  return emptyDreamRecords;
}

export function saveDreamRecordToBrowser(record: DreamRecord): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveDreamRecord(storage, record);
    notifyDreamStorageChanged();
  }
}

export function deleteDreamRecordToBrowser(recordId: string): void {
  const storage = getBrowserStorage();

  if (storage) {
    deleteDreamRecord(storage, recordId);
    notifyDreamStorageChanged();
  }
}
