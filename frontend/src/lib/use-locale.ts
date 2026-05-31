"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getDefaultLocaleSnapshot,
  getLocaleSnapshotFromBrowser,
  saveLocaleToBrowser,
  subscribeToLocale,
  type Locale,
} from "./locale";
import { translate, type MessageKey } from "./i18n/messages";

export type UseLocaleResult = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** 현재 locale로 UI 문구를 번역한다. */
  t: (key: MessageKey) => string;
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

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);

  return { locale, setLocale, t };
}
