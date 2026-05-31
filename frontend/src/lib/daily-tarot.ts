import { getTarotMajorCardById, tarotMajorCards, type TarotMajorCard } from "./tarot-major-cards";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type TarotOrientation = "upright" | "reversed";

export type DailyTarotOption = {
  id: string;
  cardId: number;
  orientation: TarotOrientation;
};

export type DailyTarotReading = {
  id: string;
  spread: "daily_one_card";
  appDate: string;
  selectedAt: string;
  card: TarotMajorCard;
  orientation: TarotOrientation;
  position: "today";
  keywords: string[];
  title: string;
  message: string;
  advice: string;
};

export type CreateDailyTarotReadingInput = {
  appDate: string;
  selectedAt: string;
  option: DailyTarotOption;
};

export const dailyTarotStorageKey = "manyang:daily-tarot-readings";
export const dailyTarotChangedEvent = "manyang:daily-tarot-changed";

const emptyDailyTarotReadingSnapshot: DailyTarotReading | null = null;

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

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifyDailyTarotChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(dailyTarotChangedEvent));
  }
}

function createSeed(value: string): number {
  let seed = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    seed ^= value.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }

  return seed >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed || 1;

  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);

    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleCards(appDate: string): TarotMajorCard[] {
  const random = createRandom(createSeed(appDate));
  const cards = [...tarotMajorCards];

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return cards;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isTarotOrientation(value: unknown): value is TarotOrientation {
  return value === "upright" || value === "reversed";
}

function isStoredDailyTarotReading(value: unknown): value is DailyTarotReading {
  if (!isRecord(value) || !isRecord(value.card)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.spread === "daily_one_card" &&
    typeof value.appDate === "string" &&
    typeof value.selectedAt === "string" &&
    typeof value.card.id === "number" &&
    getTarotMajorCardById(value.card.id) !== null &&
    isTarotOrientation(value.orientation) &&
    value.position === "today" &&
    isStringArray(value.keywords) &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    typeof value.advice === "string"
  );
}

function getDailyTarotReadings(storage: StorageLike): DailyTarotReading[] {
  const readings = parseJson<unknown>(storage.getItem(dailyTarotStorageKey), []);

  return Array.isArray(readings) ? readings.filter(isStoredDailyTarotReading) : [];
}

export function createDailyTarotOptions(appDate: string, count = 6): DailyTarotOption[] {
  const optionCount = Math.max(0, Math.min(count, tarotMajorCards.length));
  const seed = createSeed(`${appDate}:orientation`);
  const selectedCards = shuffleCards(appDate).slice(0, optionCount);
  const options = selectedCards.map<DailyTarotOption>((card, index) => ({
    id: `option-${index + 1}`,
    cardId: card.id,
    orientation: ((seed + card.id + index) % 2 === 0 ? "upright" : "reversed") satisfies TarotOrientation,
  }));

  if (options.length > 1) {
    const hasUpright = options.some((option) => option.orientation === "upright");
    const hasReversed = options.some((option) => option.orientation === "reversed");

    if (!hasUpright) {
      options[0] = { ...options[0], orientation: "upright" };
    }

    if (!hasReversed) {
      options[options.length - 1] = { ...options[options.length - 1], orientation: "reversed" };
    }
  }

  return options;
}

export function createDailyTarotReading(input: CreateDailyTarotReadingInput): DailyTarotReading {
  const card = getTarotMajorCardById(input.option.cardId);

  if (!card) {
    throw new Error(`Unknown tarot major card id: ${input.option.cardId}`);
  }

  const orientationContent = card[input.option.orientation];

  return {
    id: `daily-tarot-${input.appDate}`,
    spread: "daily_one_card",
    appDate: input.appDate,
    selectedAt: input.selectedAt,
    card,
    orientation: input.option.orientation,
    position: "today",
    keywords: [...card.keywords],
    title: orientationContent.summary,
    message: orientationContent.dailyFlow,
    advice: orientationContent.advice,
  };
}

export function saveDailyTarotReading(storage: StorageLike, reading: DailyTarotReading): void {
  const readings = getDailyTarotReadings(storage).filter((storedReading) => storedReading.appDate !== reading.appDate);

  storage.setItem(dailyTarotStorageKey, JSON.stringify([reading, ...readings]));
}

export function getDailyTarotReading(storage: StorageLike, appDate: string): DailyTarotReading | null {
  return getDailyTarotReadings(storage).find((reading) => reading.appDate === appDate) ?? null;
}

export function getDailyTarotReadingFromBrowser(appDate: string): DailyTarotReading | null {
  const storage = getBrowserStorage();

  return storage ? getDailyTarotReading(storage, appDate) : emptyDailyTarotReadingSnapshot;
}

export function saveDailyTarotReadingToBrowser(reading: DailyTarotReading): void {
  const storage = getBrowserStorage();

  if (storage) {
    saveDailyTarotReading(storage, reading);
    notifyDailyTarotChanged();
  }
}

export function subscribeToDailyTarot(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(dailyTarotChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(dailyTarotChangedEvent, onStoreChange);
  };
}

export function getEmptyDailyTarotReadingSnapshot(): DailyTarotReading | null {
  return emptyDailyTarotReadingSnapshot;
}
