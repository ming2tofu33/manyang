"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getDefaultLocaleSnapshot,
  getLocaleSnapshotFromBrowser,
  saveLocaleToBrowser,
  subscribeToLocale,
  type Locale,
} from "./locale";
import { translate, type MessageKey, type MessageParams } from "./i18n/messages";

export type UseLocaleResult = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** 현재 locale로 UI 문구를 번역한다. {var} 자리표시자는 params로 채운다. */
  t: (key: MessageKey, params?: MessageParams) => string;
};

export function useLocale(): UseLocaleResult {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshotFromBrowser,
    getDefaultLocaleSnapshot,
  );

  const setLocale = useCallback((next: Locale) => {
    saveLocaleToBrowser(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => translate(locale, key, params),
    [locale],
  );

  return { locale, setLocale, t };
}
