import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createDailyTarotOptions,
  createDailyTarotReading,
  dailyTarotChangedEvent,
  dailyTarotStorageKey,
  getDailyTarotReading,
  getDailyTarotReadingFromBrowser,
  getEmptyDailyTarotReadingSnapshot,
  saveDailyTarotReading,
  saveDailyTarotReadingToBrowser,
  subscribeToDailyTarot,
  type DailyTarotReading,
  type StorageLike,
} from "./daily-tarot";
import { getTarotMajorCardById } from "./tarot-major-cards";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function createReading(
  appDate: string,
  options: Partial<Pick<DailyTarotReading, "selectedAt" | "orientation">> = {},
): DailyTarotReading {
  return createDailyTarotReading({
    appDate,
    selectedAt: options.selectedAt ?? `${appDate}T09:30:00.000Z`,
    option: {
      id: "option-1",
      cardId: 18,
      orientation: options.orientation ?? "reversed",
    },
  });
}

function installBrowserWindow(storage = createMemoryStorage()) {
  const listeners = new Map<string, Set<EventListener>>();
  const addEventListener = vi.fn((type: string, listener: EventListener) => {
    listeners.set(type, new Set([...(listeners.get(type) ?? []), listener]));
  });
  const removeEventListener = vi.fn((type: string, listener: EventListener) => {
    listeners.get(type)?.delete(listener);
  });
  const dispatchEvent = vi.fn((event: Event) => {
    listeners.get(event.type)?.forEach((listener) => listener(event));

    return true;
  });
  const browserWindow = {
    addEventListener,
    dispatchEvent,
    localStorage: storage,
    removeEventListener,
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browserWindow,
  });

  return { addEventListener, dispatchEvent, removeEventListener, storage };
}

function installBrowserWindowWithThrowingLocalStorage() {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const dispatchEvent = vi.fn();
  const browserWindow = {
    addEventListener,
    dispatchEvent,
    get localStorage(): StorageLike {
      throw new DOMException("Blocked storage", "SecurityError");
    },
    removeEventListener,
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browserWindow,
  });

  return { dispatchEvent };
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "window");
});

describe("daily tarot draw logic", () => {
  test("creates deterministic unique daily tarot options with both orientations", () => {
    const options = createDailyTarotOptions("2026-05-31", 6);
    const cardIds = options.map((option) => option.cardId);
    const orientations = options.map((option) => option.orientation);

    expect(options).toHaveLength(6);
    expect(new Set(cardIds).size).toBe(6);
    expect(orientations).toContain("upright");
    expect(orientations).toContain("reversed");
  });

  test("returns the same daily tarot options for the same app date", () => {
    expect(createDailyTarotOptions("2026-05-31")).toEqual(createDailyTarotOptions("2026-05-31"));
  });

  test("creates a reversed daily tarot reading from an option", () => {
    const card = getTarotMajorCardById(18);

    expect(card).not.toBeNull();

    const reading = createDailyTarotReading({
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T09:30:00.000Z",
      option: { id: "option-1", cardId: 18, orientation: "reversed" },
    });

    expect(reading).toMatchObject({
      id: "daily-tarot-2026-05-31",
      spread: "daily_one_card",
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T09:30:00.000Z",
      card: { id: 18, nameKo: "달" },
      orientation: "reversed",
      position: "today",
      message: card?.reversed.dailyFlow,
      advice: card?.reversed.advice,
    });
  });

  test("creates an upright daily tarot reading from an option", () => {
    const card = getTarotMajorCardById(18);

    expect(card).not.toBeNull();

    const reading = createDailyTarotReading({
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T09:30:00.000Z",
      option: { id: "option-1", cardId: 18, orientation: "upright" },
    });

    expect(reading).toMatchObject({
      title: card?.upright.summary,
      message: card?.upright.dailyFlow,
      advice: card?.upright.advice,
      orientation: "upright",
    });
  });

  test("throws a clear error for an unknown card id", () => {
    expect(() =>
      createDailyTarotReading({
        appDate: "2026-05-31",
        selectedAt: "2026-05-31T09:30:00.000Z",
        option: { id: "option-1", cardId: 999, orientation: "upright" },
      }),
    ).toThrow("Unknown tarot major card id: 999");
  });

  test("saves and reads a daily tarot reading by app date", () => {
    const storage = createMemoryStorage();
    const reading = createReading("2026-05-31");

    saveDailyTarotReading(storage, reading);

    expect(getDailyTarotReading(storage, "2026-05-31")).toEqual(reading);
    expect(getDailyTarotReading(storage, "2026-06-01")).toBeNull();
  });

  test("stores newest first and replaces the same app date", () => {
    const storage = createMemoryStorage();
    const first = createReading("2026-05-30", { selectedAt: "2026-05-30T09:30:00.000Z" });
    const second = createReading("2026-05-31", { selectedAt: "2026-05-31T09:30:00.000Z" });
    const replacement = createReading("2026-05-30", {
      orientation: "upright",
      selectedAt: "2026-05-30T10:30:00.000Z",
    });

    saveDailyTarotReading(storage, first);
    saveDailyTarotReading(storage, second);
    saveDailyTarotReading(storage, replacement);

    expect(JSON.parse(storage.getItem(dailyTarotStorageKey) ?? "[]")).toEqual([replacement, second]);
    expect(getDailyTarotReading(storage, "2026-05-30")).toEqual(replacement);
  });

  test("returns null for malformed stored JSON", () => {
    const storage = createMemoryStorage({ [dailyTarotStorageKey]: "{not-json" });

    expect(getDailyTarotReading(storage, "2026-05-31")).toBeNull();
  });

  test("ignores valid JSON entries with invalid daily tarot shapes", () => {
    const validReading = createReading("2026-05-31");
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([null, 1, { appDate: "2026-05-31" }, validReading]),
    });

    expect(getDailyTarotReading(storage, "2026-05-31")).toEqual(validReading);
  });

  test("drops invalid stored entries when saving a reading", () => {
    const validReading = createReading("2026-05-31");
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([null, 1, { appDate: "2026-05-30" }]),
    });

    expect(() => saveDailyTarotReading(storage, validReading)).not.toThrow();
    expect(JSON.parse(storage.getItem(dailyTarotStorageKey) ?? "[]")).toEqual([validReading]);
  });

  test("exports daily tarot storage constants", () => {
    expect(dailyTarotStorageKey).toBe("manyang:daily-tarot-readings");
    expect(dailyTarotChangedEvent).toBe("manyang:daily-tarot-changed");
  });
});

describe("daily tarot browser helpers", () => {
  test("no-op safely when window is undefined", () => {
    const reading = createReading("2026-05-31");
    const unsubscribe = subscribeToDailyTarot(vi.fn());

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toBeNull();
    expect(getEmptyDailyTarotReadingSnapshot()).toBeNull();
    expect(() => saveDailyTarotReadingToBrowser(reading)).not.toThrow();
    expect(() => unsubscribe()).not.toThrow();
  });

  test("no-ops safely when browser localStorage is unavailable", () => {
    const { dispatchEvent } = installBrowserWindowWithThrowingLocalStorage();
    const reading = createReading("2026-05-31");

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toBeNull();
    expect(() => saveDailyTarotReadingToBrowser(reading)).not.toThrow();
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  test("reads and saves through browser localStorage", () => {
    const { storage } = installBrowserWindow();
    const reading = createReading("2026-05-31");

    saveDailyTarotReading(storage, reading);

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toEqual(reading);
    expect(getDailyTarotReadingFromBrowser("2026-06-01")).toBeNull();
  });

  test("dispatches the custom event on browser save", () => {
    const { dispatchEvent } = installBrowserWindow();
    const reading = createReading("2026-05-31");

    saveDailyTarotReadingToBrowser(reading);

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toEqual(reading);
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: dailyTarotChangedEvent }));
  });

  test("subscribes to storage and daily tarot change events", () => {
    const { addEventListener, removeEventListener } = installBrowserWindow();
    const onStoreChange = vi.fn();

    const unsubscribe = subscribeToDailyTarot(onStoreChange);

    expect(addEventListener).toHaveBeenCalledWith("storage", onStoreChange);
    expect(addEventListener).toHaveBeenCalledWith(dailyTarotChangedEvent, onStoreChange);

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event(dailyTarotChangedEvent));

    expect(onStoreChange).toHaveBeenCalledTimes(2);

    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledWith("storage", onStoreChange);
    expect(removeEventListener).toHaveBeenCalledWith(dailyTarotChangedEvent, onStoreChange);
  });
});
