import type { DreamAnalysisResponse, DreamReadingUnavailableReason } from "@manyang/backend";
import type { CatReaderId } from "./cat-readers";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** 재분석(retry) 시 동일 입력을 재전송하기 위한 구조화된 감정/감각 신호. */
export type DreamFeelingSignals = {
  dreamAtmospheres?: string[];
  dreamSensations?: string[];
  dreamSensationOther?: string;
};

export type DreamCompletedPayload = DreamFeelingSignals & {
  status?: "completed";
  dreamText: string;
  dreamDate: string;
  catReaderType?: CatReaderId;
  wakeMood?: string;
  analysis: DreamAnalysisResponse;
};

export type DreamUnavailablePayload = DreamFeelingSignals & {
  status: "unavailable";
  dreamText: string;
  dreamDate: string;
  catReaderType?: CatReaderId;
  wakeMood?: string;
  reason: DreamReadingUnavailableReason;
  retryable: boolean;
  safetyNotice?: string;
  failedAt: string;
};

export type LatestAnalysisPayload = DreamCompletedPayload | DreamUnavailablePayload;

export type DreamRecord = LatestAnalysisPayload & {
  id: string;
  savedAt: string;
};

export type DreamDraftPayload = {
  dreamText?: string;
  catReaderType?: CatReaderId;
  wakeMood?: string;
};

export const latestAnalysisKey = "manyang:latest-analysis";
export const dreamRecordsKey = "manyang:dreams";
export const dreamDraftKey = "manyang:dream-draft";
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

function createLatestAnalysisPayloadFromRecord(record: DreamRecord): LatestAnalysisPayload {
  if (record.status === "unavailable") {
    return {
      status: "unavailable",
      dreamText: record.dreamText,
      dreamDate: record.dreamDate,
      ...(record.catReaderType !== undefined ? { catReaderType: record.catReaderType } : {}),
      ...(record.wakeMood !== undefined ? { wakeMood: record.wakeMood } : {}),
      reason: record.reason,
      retryable: record.retryable,
      ...(record.safetyNotice ? { safetyNotice: record.safetyNotice } : {}),
      failedAt: record.failedAt,
    };
  }

  return {
    ...(record.status ? { status: record.status } : {}),
    dreamText: record.dreamText,
    dreamDate: record.dreamDate,
    ...(record.catReaderType !== undefined ? { catReaderType: record.catReaderType } : {}),
    ...(record.wakeMood !== undefined ? { wakeMood: record.wakeMood } : {}),
    analysis: record.analysis,
  };
}

export function restoreDreamRecordAsLatestAnalysis(storage: StorageLike, recordId: string): LatestAnalysisPayload | null {
  const record = getDreamRecords(storage).find((storedRecord) => storedRecord.id === recordId);

  if (!record) {
    return null;
  }

  const payload = createLatestAnalysisPayloadFromRecord(record);

  saveLatestAnalysis(storage, payload);

  return payload;
}

export function deleteDreamRecord(storage: StorageLike, recordId: string): void {
  const records = getDreamRecords(storage).filter((storedRecord) => storedRecord.id !== recordId);

  storage.setItem(dreamRecordsKey, JSON.stringify(records));
}

export function getDreamDraft(storage: StorageLike): DreamDraftPayload | null {
  return parseJson<DreamDraftPayload | null>(storage.getItem(dreamDraftKey), null);
}

export function saveDreamDraft(storage: StorageLike, payload: DreamDraftPayload): void {
  storage.setItem(dreamDraftKey, JSON.stringify(payload));
}

export function clearDreamDraft(storage: StorageLike): void {
  storage.removeItem(dreamDraftKey);
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

export function getDreamDraftFromBrowser(): DreamDraftPayload | null {
  const storage = getBrowserStorage();

  return storage ? getDreamDraft(storage) : null;
}

export function saveDreamDraftToBrowser(payload: DreamDraftPayload): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveDreamDraft(storage, payload);
    notifyDreamStorageChanged();
  }
}

export function clearDreamDraftFromBrowser(): void {
  const storage = getBrowserStorage();

  if (storage) {
    clearDreamDraft(storage);
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

export function restoreDreamRecordAsLatestAnalysisToBrowser(recordId: string): boolean {
  const storage = getBrowserStorage();

  if (!storage) {
    return false;
  }

  const restoredPayload = restoreDreamRecordAsLatestAnalysis(storage, recordId);

  if (restoredPayload) {
    notifyDreamStorageChanged();
  }

  return restoredPayload !== null;
}

export function deleteDreamRecordToBrowser(recordId: string): void {
  const storage = getBrowserStorage();

  if (storage) {
    deleteDreamRecord(storage, recordId);
    notifyDreamStorageChanged();
  }
}
