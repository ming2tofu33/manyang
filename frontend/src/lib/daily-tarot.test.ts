import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createDailyTarotOptions,
  createDailyTarotReading,
  createDailyTarotUserIdentityKey,
  dailyTarotChangedEvent,
  dailyTarotGuestIdentityStorageKey,
  dailyTarotStorageKey,
  getDailyTarotReading,
  getDailyTarotReadingFromBrowser,
  getDailyTarotReadingsSnapshot,
  getDailyTarotReadingsSnapshotFromBrowser,
  getEmptyDailyTarotReadingSnapshot,
  getEmptyDailyTarotReadingsSnapshot,
  getOrCreateDailyTarotGuestIdentity,
  saveDailyTarotReading,
  saveDailyTarotReadingToBrowser,
  subscribeToDailyTarot,
  type DailyTarotReading,
  type StorageLike,
} from "./daily-tarot";
import { getTarotCardById } from "./tarot-cards";
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

function createGeneratedReading(
  appDate: string,
  spread: DailyTarotReading["spread"] = "daily_one_card",
  overrides: Partial<DailyTarotReading> = {},
): DailyTarotReading {
  const base = createReading(appDate);
  const situationCard = getTarotMajorCardById(1);
  const flowCard = getTarotMajorCardById(2);
  const adviceCard = getTarotMajorCardById(3);

  if (!situationCard || !flowCard || !adviceCard) {
    throw new Error("Missing tarot test cards");
  }

  const cards =
    spread === "daily_three_card"
      ? [
          { position: "situation" as const, card: situationCard, orientation: "upright" as const },
          { position: "flow" as const, card: flowCard, orientation: "reversed" as const },
          { position: "advice" as const, card: adviceCard, orientation: "upright" as const },
        ]
      : [{ position: "today" as const, card: base.card, orientation: base.orientation }];

  return {
    ...base,
    id: `daily-tarot-${spread}-${appDate}`,
    spread,
    source: "llm",
    cards,
    generated: {
      title: spread === "daily_three_card" ? "세 장이 보여주는 오늘의 관계" : "오늘의 한 장이 건네는 장면",
      overview: "LLM이 선택된 카드와 방향을 기준으로 생성한 오늘의 타로 해석입니다.",
      cardReadings:
        spread === "daily_three_card"
          ? cards.map((selection) => ({
              position: selection.position,
              heading: selection.position,
              reading: `${selection.card.nameKo} ${selection.orientation} 해석입니다.`,
            }))
          : [],
      advice: "카드가 보여준 장면을 기준으로 오늘의 선택을 살펴보세요.",
    },
    ...overrides,
  };
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
  test("creates different daily tarot options for different draw identities on the same app date", () => {
    const firstUserOptions = createDailyTarotOptions("2026-06-02", {
      count: 8,
      drawIdentityKey: "user:first",
    });
    const secondUserOptions = createDailyTarotOptions("2026-06-02", {
      count: 8,
      drawIdentityKey: "user:second",
    });

    expect(firstUserOptions).toHaveLength(8);
    expect(secondUserOptions).toHaveLength(8);
    expect(firstUserOptions.map((option) => `${option.cardId}:${option.orientation}`)).not.toEqual(
      secondUserOptions.map((option) => `${option.cardId}:${option.orientation}`),
    );
  });

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

  test("returns the same daily tarot options for the same draw identity", () => {
    expect(
      createDailyTarotOptions("2026-06-02", {
        drawIdentityKey: "user:same",
      }),
    ).toEqual(
      createDailyTarotOptions("2026-06-02", {
        drawIdentityKey: "user:same",
      }),
    );
  });

  test("uses the full 78-card tarot deck by default", () => {
    const options = createDailyTarotOptions("2026-05-31");

    expect(options).toHaveLength(78);
    expect(new Set(options.map((option) => option.cardId)).size).toBe(78);
    expect(options.some((option) => getTarotCardById(option.cardId)?.arcana === "minor")).toBe(true);
  });

  test("creates a daily tarot reading from a minor arcana option", () => {
    const card = getTarotCardById(75);

    expect(card).toMatchObject({ nameKo: "펜타클 기사", arcana: "minor" });

    const reading = createDailyTarotReading({
      appDate: "2026-05-31",
      selectedAt: "2026-05-31T09:30:00.000Z",
      option: { id: "option-1", cardId: 75, orientation: "upright" },
    });

    expect(reading).toMatchObject({
      id: "daily-tarot-2026-05-31",
      spread: "daily_one_card",
      card: { id: 75, nameKo: "펜타클 기사", arcana: "minor" },
      orientation: "upright",
      keywords: card?.keywords,
      title: card?.upright.summary,
      message: card?.upright.dailyFlow,
      advice: card?.upright.cardMessage,
    });
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
      advice: card?.reversed.cardMessage,
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
      advice: card?.upright.cardMessage,
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
    ).toThrow("Unknown tarot card id: 999");
  });

  test("saves and reads a daily tarot reading by app date", () => {
    const storage = createMemoryStorage();
    const reading = createGeneratedReading("2026-05-31");

    saveDailyTarotReading(storage, reading);

    expect(getDailyTarotReading(storage, "2026-05-31")).toEqual(reading);
    expect(getDailyTarotReading(storage, "2026-06-01")).toBeNull();
  });

  test("keeps legacy one-card generated card readings readable in stored history", () => {
    const baseReading = createGeneratedReading("2026-05-31", "daily_one_card");
    const generated = baseReading.generated;

    if (!generated) {
      throw new Error("Missing generated tarot test reading");
    }

    const legacyReading = {
      ...baseReading,
      generated: {
        ...generated,
        cardReadings: [
          {
            position: "today" as const,
            heading: "오늘",
            reading: "기존 저장본에 남아 있던 한 장 리딩의 카드별 본문입니다.",
          },
        ],
      },
    } satisfies DailyTarotReading;
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([legacyReading]),
    });

    expect(getDailyTarotReading(storage, "2026-05-31")).toEqual(legacyReading);
  });

  test("keeps stored daily tarot readings separated by draw identity", () => {
    const storage = createMemoryStorage();
    const firstUserReading = {
      ...createGeneratedReading("2026-05-31"),
      drawIdentityKey: "user:first",
      selectedAt: "2026-05-31T09:30:00.000Z",
    };
    const secondUserReading = {
      ...createGeneratedReading("2026-05-31"),
      drawIdentityKey: "user:second",
      selectedAt: "2026-05-31T10:30:00.000Z",
    };

    saveDailyTarotReading(storage, firstUserReading);
    saveDailyTarotReading(storage, secondUserReading);

    expect(getDailyTarotReading(storage, "2026-05-31", {
      drawIdentityKey: "user:first",
    })).toEqual(firstUserReading);
    expect(getDailyTarotReading(storage, "2026-05-31", {
      drawIdentityKey: "user:second",
    })).toEqual(secondUserReading);
  });

  test("stores newest first and replaces the same app date", () => {
    const storage = createMemoryStorage();
    const first = createGeneratedReading("2026-05-30");
    const second = createGeneratedReading("2026-05-31");
    const replacement = {
      ...createGeneratedReading("2026-05-30"),
      orientation: "upright" as const,
      selectedAt: "2026-05-30T10:30:00.000Z",
    };

    saveDailyTarotReading(storage, first);
    saveDailyTarotReading(storage, second);
    saveDailyTarotReading(storage, replacement);

    expect(JSON.parse(storage.getItem(dailyTarotStorageKey) ?? "[]")).toEqual([replacement, second]);
    expect(getDailyTarotReading(storage, "2026-05-30")).toEqual(replacement);
  });

  test("stores one-card and three-card generated readings for the same app date", () => {
    const storage = createMemoryStorage();
    const oneCard = createGeneratedReading("2026-05-31", "daily_one_card");
    const threeCard = createGeneratedReading("2026-05-31", "daily_three_card");

    saveDailyTarotReading(storage, oneCard);
    saveDailyTarotReading(storage, threeCard);

    expect(getDailyTarotReading(storage, "2026-05-31", "daily_one_card")).toEqual(oneCard);
    expect(getDailyTarotReading(storage, "2026-05-31", "daily_three_card")).toEqual(threeCard);
    expect(JSON.parse(storage.getItem(dailyTarotStorageKey) ?? "[]")).toEqual([threeCard, oneCard]);
  });

  test("loads question one-card readings only when question metadata is present", () => {
    const questionReading = createGeneratedReading("2026-07-03", "question_one_card", {
      questionContext: {
        stateKey: "mind_complex",
        stateLabel: "마음이 복잡해",
        questionKey: "held_feeling",
        questionText: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
      },
      unlockMethod: "daily_free",
    });
    const invalidQuestionReading = {
      ...questionReading,
      id: "invalid-question-reading",
      questionContext: undefined,
    };
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([invalidQuestionReading, questionReading]),
    });

    expect(getDailyTarotReadingsSnapshot(storage)).toEqual([questionReading]);
    expect(getDailyTarotReading(storage, "2026-07-03", "question_one_card")).toEqual(questionReading);
  });

  test("keeps existing daily and three-card readings valid without question metadata", () => {
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([
        createGeneratedReading("2026-07-03", "daily_one_card"),
        createGeneratedReading("2026-07-03", "daily_three_card"),
      ]),
    });

    expect(getDailyTarotReadingsSnapshot(storage)).toHaveLength(2);
  });

  test("returns null for malformed stored JSON", () => {
    const storage = createMemoryStorage({ [dailyTarotStorageKey]: "{not-json" });

    expect(getDailyTarotReading(storage, "2026-05-31")).toBeNull();
  });

  test("ignores valid JSON entries with invalid daily tarot shapes", () => {
    const validReading = createGeneratedReading("2026-05-31");
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([null, 1, { appDate: "2026-05-31" }, validReading]),
    });

    expect(getDailyTarotReading(storage, "2026-05-31")).toEqual(validReading);
  });

  test("drops invalid stored entries when saving a reading", () => {
    const validReading = createGeneratedReading("2026-05-31");
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([null, 1, { appDate: "2026-05-30" }]),
    });

    expect(() => saveDailyTarotReading(storage, validReading)).not.toThrow();
    expect(JSON.parse(storage.getItem(dailyTarotStorageKey) ?? "[]")).toEqual([validReading]);
  });

  test("does not treat local fallback-shaped readings as completed stored tarot readings", () => {
    const localReading = createReading("2026-05-31");
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([localReading]),
    });

    expect(getDailyTarotReading(storage, "2026-05-31")).toBeNull();
  });

  test("returns a stable daily tarot readings snapshot for calendar markers", () => {
    const reading = createGeneratedReading("2026-05-31");
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([reading]),
    });
    const firstSnapshot = getDailyTarotReadingsSnapshot(storage);
    const secondSnapshot = getDailyTarotReadingsSnapshot(storage);

    expect(firstSnapshot).toEqual([reading]);
    expect(secondSnapshot).toBe(firstSnapshot);
  });

  test("exports daily tarot storage constants", () => {
    expect(dailyTarotStorageKey).toBe("manyang:daily-tarot-readings");
    expect(dailyTarotChangedEvent).toBe("manyang:daily-tarot-changed");
  });

  test("creates stable draw identity keys for authenticated and guest users", () => {
    const storage = createMemoryStorage();
    const firstGuestIdentity = getOrCreateDailyTarotGuestIdentity(storage);
    const secondGuestIdentity = getOrCreateDailyTarotGuestIdentity(storage);

    expect(createDailyTarotUserIdentityKey("user-1")).toBe("user:user-1");
    expect(firstGuestIdentity).toBe(secondGuestIdentity);
    expect(firstGuestIdentity).toMatch(/^guest:/);
    expect(storage.getItem(dailyTarotGuestIdentityStorageKey)).toBe(firstGuestIdentity.slice("guest:".length));
  });
});

describe("daily tarot browser helpers", () => {
  test("no-op safely when window is undefined", () => {
    const reading = createGeneratedReading("2026-05-31");
    const unsubscribe = subscribeToDailyTarot(vi.fn());

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toBeNull();
    expect(getEmptyDailyTarotReadingSnapshot()).toBeNull();
    expect(getDailyTarotReadingsSnapshotFromBrowser()).toEqual([]);
    expect(getEmptyDailyTarotReadingsSnapshot()).toEqual([]);
    expect(() => saveDailyTarotReadingToBrowser(reading)).not.toThrow();
    expect(() => unsubscribe()).not.toThrow();
  });

  test("no-ops safely when browser localStorage is unavailable", () => {
    const { dispatchEvent } = installBrowserWindowWithThrowingLocalStorage();
    const reading = createGeneratedReading("2026-05-31");

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toBeNull();
    expect(() => saveDailyTarotReadingToBrowser(reading)).not.toThrow();
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  test("reads and saves through browser localStorage", () => {
    const { storage } = installBrowserWindow();
    const reading = createGeneratedReading("2026-05-31");

    saveDailyTarotReading(storage, reading);

    expect(getDailyTarotReadingFromBrowser("2026-05-31")).toEqual(reading);
    expect(getDailyTarotReadingFromBrowser("2026-06-01")).toBeNull();
    expect(getDailyTarotReadingsSnapshotFromBrowser()).toEqual([reading]);
  });

  test("dispatches the custom event on browser save", () => {
    const { dispatchEvent } = installBrowserWindow();
    const reading = createGeneratedReading("2026-05-31");

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
