// 앱 표시 언어(locale) 전역 스토어. cat-readers의 선택 스토어와 같은 방식
// (localStorage + 커스텀 이벤트 + useSyncExternalStore)을 미러링해 provider 없이 동작한다.
// 해몽 엔진(백과사전/길흉/RAG/프롬프트)은 이미 ko/en 이중언어라, 여기서 고른 locale을
// API 요청에 실어 보내고 UI 문구를 고르는 데만 쓴다.

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type Locale = "ko" | "en";

export const defaultLocale: Locale = "ko";
export const supportedLocales: Locale[] = ["ko", "en"];
export const localeStorageKey = "manyang:locale";
export const localeChangedEvent = "manyang:locale-changed";

let localeSnapshotCache:
  | {
      raw: string | null;
      value: Locale;
    }
  | null = null;

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function notifyLocaleChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(localeChangedEvent));
  }
}

export function normalizeLocale(value: string | undefined | null): Locale | null {
  return supportedLocales.includes(value as Locale) ? (value as Locale) : null;
}

/** 저장된 선택이 없을 때 쓸 브라우저 추정 언어(영어권이면 en, 그 외 ko). */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") {
    return defaultLocale;
  }

  const language = (navigator.language ?? "").toLowerCase();

  return language.startsWith("en") ? "en" : "ko";
}

export function getLocaleSnapshot(storage: StorageLike): Locale {
  const raw = storage.getItem(localeStorageKey);

  if (localeSnapshotCache?.raw === raw) {
    return localeSnapshotCache.value;
  }

  // 저장된 선택이 없으면 기본 언어(ko). 영어는 프로필의 언어 토글로 명시 전환한다.
  // (자동 브라우저 감지는 KO-우선 제품에서 예측 불가하고 SSR 하이드레이션 플래시를 만든다.)
  const value = normalizeLocale(raw) ?? defaultLocale;
  localeSnapshotCache = { raw, value };

  return value;
}

export function saveLocale(storage: StorageLike, locale: Locale): Locale {
  const normalized = normalizeLocale(locale) ?? defaultLocale;

  storage.setItem(localeStorageKey, normalized);

  return normalized;
}

export function getLocaleSnapshotFromBrowser(): Locale {
  const storage = getBrowserStorage();

  return storage ? getLocaleSnapshot(storage) : defaultLocale;
}

// SSR/초기 렌더용 안정 스냅샷. 하이드레이션 후 클라이언트 스냅샷으로 교체된다.
export function getDefaultLocaleSnapshot(): Locale {
  return defaultLocale;
}

export function saveLocaleToBrowser(locale: Locale): Locale {
  const storage = getBrowserStorage();

  if (!storage) {
    return defaultLocale;
  }

  const saved = saveLocale(storage, locale);
  notifyLocaleChanged();

  return saved;
}

export function subscribeToLocale(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(localeChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(localeChangedEvent, onStoreChange);
  };
}
