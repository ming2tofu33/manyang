export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type CatReaderAccess = "free" | "annual_premium";
export type CatReaderId = "black_cat" | "white_cat" | "cheese_cat" | "gray_cat";

export type CatReader = {
  id: CatReaderId;
  name: string;
  access: CatReaderAccess;
  role: string;
  shortDescription: string;
  tone: string;
  ctaLabel: string;
  assetKey: "blackCat" | "whiteCat" | "cheeseCat" | "grayCat";
  homeBackgroundKey: "blackCatHome" | "whiteCatHome" | "cheeseCatHome" | "grayCatHome";
  interpretationBackgroundKey:
    | "blackCatInterpretation"
    | "whiteCatInterpretation"
    | "cheeseCatInterpretation"
    | "grayCatInterpretation";
  lockedLabel?: string;
};

export const defaultCatReaderId: CatReaderId = "black_cat";
export const selectedCatReaderKey = "manyang:selected-cat-reader";
export const selectedCatReaderChangedEvent = "manyang:selected-cat-reader-changed";

export const catReaders: CatReader[] = [
  {
    id: "black_cat",
    name: "검은냥",
    access: "free",
    role: "기본 해몽사",
    shortDescription: "신비롭고 상징 중심",
    tone: "신비롭고 차분함",
    ctaLabel: "검은냥에게 꿈 비춰보기",
    assetKey: "blackCat",
    homeBackgroundKey: "blackCatHome",
    interpretationBackgroundKey: "blackCatInterpretation",
  },
  {
    id: "white_cat",
    name: "하얀냥",
    access: "free",
    role: "위로 해몽사",
    shortDescription: "부드럽고 안정감 중심",
    tone: "부드럽고 따뜻함",
    ctaLabel: "하얀냥에게 부드럽게 읽어달라고 하기",
    assetKey: "whiteCat",
    homeBackgroundKey: "whiteCatHome",
    interpretationBackgroundKey: "whiteCatInterpretation",
  },
  {
    id: "cheese_cat",
    name: "치즈냥",
    access: "free",
    role: "지적 해몽사",
    shortDescription: "밝고 현실적인 처방 중심",
    tone: "밝고 현실적임",
    ctaLabel: "치즈냥에게 오늘의 처방 받기",
    assetKey: "cheeseCat",
    homeBackgroundKey: "cheeseCatHome",
    interpretationBackgroundKey: "cheeseCatInterpretation",
  },
  {
    id: "gray_cat",
    name: "회색냥",
    access: "annual_premium",
    role: "타로 해몽사",
    shortDescription: "타로 패턴/기록 중심",
    tone: "조용하고 깊음",
    ctaLabel: "잿빛냥의 꿈+타로 리딩 보기",
    assetKey: "grayCat",
    homeBackgroundKey: "grayCatHome",
    interpretationBackgroundKey: "grayCatInterpretation",
    lockedLabel: "Moon Pass에서 열려요",
  },
];

export const freeCatReaders = catReaders.filter((reader) => reader.access === "free");

export type CatReaderDreamReadingState = {
  isAvailable: boolean;
  blockedLabel: string | null;
  fallbackReaderId: CatReaderId | null;
};

let selectedCatReaderSnapshotCache:
  | {
      raw: string | null;
      value: CatReaderId;
    }
  | null = null;

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function notifySelectedCatReaderChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(selectedCatReaderChangedEvent));
  }
}

function normalizeCatReaderId(value: string | undefined | null): CatReaderId | null {
  if (value === "orange_cat" || value === "yellow_cat") {
    return "cheese_cat";
  }

  return catReaders.some((reader) => reader.id === value) ? (value as CatReaderId) : null;
}

export function isCatReaderDreamReadingAvailable(value: string | undefined | null): boolean {
  const normalizedId = normalizeCatReaderId(value);

  return normalizedId ? freeCatReaders.some((reader) => reader.id === normalizedId) : false;
}

export function getCatReaderDreamReadingState(value: string | undefined | null): CatReaderDreamReadingState {
  const reader = getCatReaderById(value);
  const isAvailable = isCatReaderDreamReadingAvailable(reader.id);

  return {
    isAvailable,
    blockedLabel: isAvailable ? null : `${reader.name}은 Moon Pass에서 열려요`,
    fallbackReaderId: isAvailable ? null : defaultCatReaderId,
  };
}

export function getCatReaderById(id: string | undefined | null): CatReader {
  const normalizedId = normalizeCatReaderId(id);

  return catReaders.find((reader) => reader.id === normalizedId) ?? catReaders[0];
}

export function getSelectedCatReaderId(storage: StorageLike): CatReaderId {
  const storedId = storage.getItem(selectedCatReaderKey);
  const normalizedId = normalizeCatReaderId(storedId);

  return normalizedId ?? defaultCatReaderId;
}

export function getSelectedCatReaderSnapshot(storage: StorageLike): CatReaderId {
  const raw = storage.getItem(selectedCatReaderKey);

  if (selectedCatReaderSnapshotCache?.raw === raw) {
    return selectedCatReaderSnapshotCache.value;
  }

  const value = normalizeCatReaderId(raw) ?? defaultCatReaderId;
  selectedCatReaderSnapshotCache = { raw, value };

  return value;
}

export function saveSelectedCatReaderId(storage: StorageLike, readerId: CatReaderId): CatReaderId {
  const normalizedId = normalizeCatReaderId(readerId) ?? defaultCatReaderId;

  storage.setItem(selectedCatReaderKey, normalizedId);

  return normalizedId;
}

export function getSelectedCatReaderSnapshotFromBrowser(): CatReaderId {
  const storage = getBrowserStorage();

  return storage ? getSelectedCatReaderSnapshot(storage) : defaultCatReaderId;
}

export function getDefaultCatReaderSnapshot(): CatReaderId {
  return defaultCatReaderId;
}

export function saveSelectedCatReaderIdToBrowser(readerId: CatReaderId): CatReaderId {
  const storage = getBrowserStorage();

  if (!storage) {
    return defaultCatReaderId;
  }

  const savedReaderId = saveSelectedCatReaderId(storage, readerId);
  notifySelectedCatReaderChanged();

  return savedReaderId;
}

export function subscribeToSelectedCatReader(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(selectedCatReaderChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(selectedCatReaderChangedEvent, onStoreChange);
  };
}
