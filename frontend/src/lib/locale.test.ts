import { describe, expect, test } from "vitest";

import {
  defaultLocale,
  getLocaleSnapshot,
  normalizeLocale,
  saveLocale,
  supportedLocales,
  localeStorageKey,
  type StorageLike,
} from "./locale";
import { messages, translate, type MessageKey } from "./i18n/messages";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("locale store", () => {
  test("normalizes only supported locales", () => {
    expect(normalizeLocale("ko")).toBe("ko");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("jp")).toBeNull();
    expect(normalizeLocale(undefined)).toBeNull();
  });

  test("reads an explicitly stored locale from storage", () => {
    expect(getLocaleSnapshot(createMemoryStorage({ [localeStorageKey]: "en" }))).toBe("en");
    expect(getLocaleSnapshot(createMemoryStorage({ [localeStorageKey]: "ko" }))).toBe("ko");
  });

  test("falls back to a supported locale when nothing is stored", () => {
    const snapshot = getLocaleSnapshot(createMemoryStorage());

    expect(supportedLocales).toContain(snapshot);
  });

  test("saves a normalized locale and ignores invalid input", () => {
    const storage = createMemoryStorage();

    expect(saveLocale(storage, "en")).toBe("en");
    expect(storage.getItem(localeStorageKey)).toBe("en");
    expect(saveLocale(storage, "zz" as never)).toBe(defaultLocale);
  });
});

describe("i18n messages", () => {
  test("English provides every Korean key (parity)", () => {
    const koKeys = Object.keys(messages.ko).sort();
    const enKeys = Object.keys(messages.en).sort();

    expect(enKeys).toEqual(koKeys);
  });

  test("translate returns the locale-specific string", () => {
    expect(translate("ko", "dreamEntry.submit")).toBe("해몽 받기");
    expect(translate("en", "dreamEntry.submit")).toBe("Read my dream");
  });

  test("every message value is a non-empty string in both locales", () => {
    for (const key of Object.keys(messages.ko) as MessageKey[]) {
      expect(translate("ko", key).length).toBeGreaterThan(0);
      expect(translate("en", key).length).toBeGreaterThan(0);
    }
  });
});
