import type { AccessPlan } from "./access-policy";
import type { Locale } from "./locale";

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
  /** 영어 표시 이름. 한국어 이름(검은냥 등)과 별개의 영문 캐릭터명. */
  nameEn: string;
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
    nameEn: "Midnight",
    access: "free",
    role: "밤하늘 테마",
    shortDescription: "깊은 밤하늘과 촛불 무드",
    tone: "신비로운 밤하늘",
    ctaLabel: "검은냥 테마로 남기기",
    assetKey: "blackCat",
    homeBackgroundKey: "blackCatHome",
    interpretationBackgroundKey: "blackCatInterpretation",
  },
  {
    id: "white_cat",
    name: "하얀냥",
    nameEn: "Luna",
    access: "free",
    role: "달빛 테마",
    shortDescription: "하얀 달빛과 포근한 밤 무드",
    tone: "부드러운 달빛",
    ctaLabel: "하얀냥 테마로 남기기",
    assetKey: "whiteCat",
    homeBackgroundKey: "whiteCatHome",
    interpretationBackgroundKey: "whiteCatInterpretation",
  },
  {
    id: "cheese_cat",
    name: "치즈냥",
    nameEn: "Sol",
    access: "free",
    role: "노을 테마",
    shortDescription: "노란 별빛과 따뜻한 노을 무드",
    tone: "따뜻한 노을",
    ctaLabel: "치즈냥 테마로 남기기",
    assetKey: "cheeseCat",
    homeBackgroundKey: "cheeseCatHome",
    interpretationBackgroundKey: "cheeseCatInterpretation",
  },
  {
    id: "gray_cat",
    name: "잿빛냥",
    nameEn: "Ash",
    access: "annual_premium",
    role: "타로 테마",
    shortDescription: "잿빛 달빛과 조용한 서재 무드",
    tone: "차분한 달빛 서재",
    ctaLabel: "잿빛냥 테마로 남기기",
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

export type CatReaderDreamReadingResolution = {
  selectedReaderId: CatReaderId;
  requestReaderId: CatReaderId;
  isFallback: boolean;
  blockedLabel: string | null;
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

export function isCatReaderDreamReadingAvailable(
  value: string | undefined | null,
  accessPlan: AccessPlan = "guest",
): boolean {
  void accessPlan;

  const normalizedId = normalizeCatReaderId(value);

  return Boolean(normalizedId);
}

export function getCatReaderDreamReadingState(
  value: string | undefined | null,
  accessPlan: AccessPlan = "guest",
): CatReaderDreamReadingState {
  const reader = getCatReaderById(value);
  const isAvailable = isCatReaderDreamReadingAvailable(reader.id, accessPlan);

  return {
    isAvailable,
    blockedLabel: null,
    fallbackReaderId: null,
  };
}

export function resolveCatReaderForDreamReading(
  value: string | undefined | null,
  accessPlan: AccessPlan = "guest",
): CatReaderDreamReadingResolution {
  const selectedReader = getCatReaderById(value);
  const selectedState = getCatReaderDreamReadingState(selectedReader.id, accessPlan);

  return {
    selectedReaderId: selectedReader.id,
    requestReaderId: selectedReader.id,
    isFallback: false,
    blockedLabel: selectedState.blockedLabel,
  };
}

export function getCatReaderById(id: string | undefined | null): CatReader {
  const normalizedId = normalizeCatReaderId(id);

  return catReaders.find((reader) => reader.id === normalizedId) ?? catReaders[0];
}

/** locale에 맞는 고양이 표시 이름(ko: 검은냥…, en: Midnight…). */
export function getCatReaderName(reader: CatReader, locale: Locale): string {
  return locale === "en" ? reader.nameEn : reader.name;
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
