import { getTarotMajorCardById, tarotMajorCards, type TarotMajorCard } from "./tarot-major-cards";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type TarotOrientation = "upright" | "reversed";
export type TarotSpread = "daily_one_card" | "daily_three_card";
export type DailyTarotPosition = "today" | "situation" | "flow" | "advice";

export type DailyTarotOption = {
  id: string;
  cardId: number;
  orientation: TarotOrientation;
};

export type DailyTarotCardSelection = {
  position: DailyTarotPosition;
  card: TarotMajorCard;
  orientation: TarotOrientation;
};

export type DailyTarotGeneratedCardReading = {
  position: DailyTarotPosition;
  heading: string;
  reading: string;
};

export type DailyTarotGeneratedReading = {
  title: string;
  overview: string;
  cardReadings: DailyTarotGeneratedCardReading[];
  advice: string;
};

export type DailyTarotReading = {
  id: string;
  spread: TarotSpread;
  source?: "local" | "llm";
  drawIdentityKey?: string;
  appDate: string;
  selectedAt: string;
  card: TarotMajorCard;
  orientation: TarotOrientation;
  position: DailyTarotPosition;
  cards?: DailyTarotCardSelection[];
  generated?: DailyTarotGeneratedReading;
  keywords: string[];
  title: string;
  message: string;
  advice: string;
};

export type CreateDailyTarotReadingInput = {
  appDate: string;
  selectedAt: string;
  option: DailyTarotOption;
  drawIdentityKey?: string | null;
};

export const dailyTarotStorageKey = "manyang:daily-tarot-readings";
export const dailyTarotChangedEvent = "manyang:daily-tarot-changed";
export const dailyTarotGuestIdentityStorageKey = "manyang:daily-tarot-guest-id";
export const pendingDailyTarotDrawIdentityKey = "guest:pending";

const emptyDailyTarotReadingSnapshot: DailyTarotReading | null = null;

export type CreateDailyTarotOptionsConfig = {
  count?: number;
  drawIdentityKey?: string | null;
};

export type GetDailyTarotReadingOptions = {
  spread?: TarotSpread;
  drawIdentityKey?: string | null;
};

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

function normalizeDailyTarotDrawIdentityKey(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function createFallbackGuestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createDailyTarotUserIdentityKey(userId: string): string {
  const normalizedUserId = userId.trim();

  return normalizedUserId ? `user:${normalizedUserId}` : pendingDailyTarotDrawIdentityKey;
}

export function createDailyTarotGuestIdentityKey(guestId: string): string {
  const normalizedGuestId = guestId.trim();

  return normalizedGuestId ? `guest:${normalizedGuestId}` : pendingDailyTarotDrawIdentityKey;
}

export function getOrCreateDailyTarotGuestIdentity(storage: StorageLike): string {
  const storedGuestId = storage.getItem(dailyTarotGuestIdentityStorageKey);

  if (storedGuestId?.trim()) {
    return createDailyTarotGuestIdentityKey(storedGuestId);
  }

  const guestId = createFallbackGuestId();
  storage.setItem(dailyTarotGuestIdentityStorageKey, guestId);

  return createDailyTarotGuestIdentityKey(guestId);
}

export function getOrCreateDailyTarotGuestIdentityFromBrowser(): string {
  const storage = getBrowserStorage();

  return storage ? getOrCreateDailyTarotGuestIdentity(storage) : pendingDailyTarotDrawIdentityKey;
}

function shuffleCards(seedSource: string): TarotMajorCard[] {
  const random = createRandom(createSeed(seedSource));
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

function isTarotSpread(value: unknown): value is TarotSpread {
  return value === "daily_one_card" || value === "daily_three_card";
}

function isDailyTarotPosition(value: unknown): value is DailyTarotPosition {
  return value === "today" || value === "situation" || value === "flow" || value === "advice";
}

function expectedPositionsForSpread(spread: TarotSpread): DailyTarotPosition[] {
  return spread === "daily_three_card" ? ["situation", "flow", "advice"] : ["today"];
}

function isValidStoredDrawIdentityKey(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.trim().length > 0);
}

function isStoredTarotMajorCard(value: unknown): value is TarotMajorCard {
  if (!isRecord(value) || typeof value.id !== "number") {
    return false;
  }

  return getTarotMajorCardById(value.id) !== null;
}

function isDailyTarotCardSelection(value: unknown): value is DailyTarotCardSelection {
  return (
    isRecord(value) &&
    isDailyTarotPosition(value.position) &&
    isTarotOrientation(value.orientation) &&
    isStoredTarotMajorCard(value.card)
  );
}

function isDailyTarotGeneratedCardReading(value: unknown): value is DailyTarotGeneratedCardReading {
  return (
    isRecord(value) &&
    isDailyTarotPosition(value.position) &&
    typeof value.heading === "string" &&
    value.heading.trim().length > 0 &&
    typeof value.reading === "string" &&
    value.reading.trim().length > 0
  );
}

function hasExactPositions(
  values: { position: DailyTarotPosition }[],
  expectedPositions: DailyTarotPosition[],
): boolean {
  return values.length === expectedPositions.length && expectedPositions.every((position, index) => values[index]?.position === position);
}

function isDailyTarotGeneratedReading(value: unknown, spread: TarotSpread): value is DailyTarotGeneratedReading {
  if (!isRecord(value) || !Array.isArray(value.cardReadings)) {
    return false;
  }

  const cardReadings = value.cardReadings;

  return (
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.overview === "string" &&
    value.overview.trim().length > 0 &&
    cardReadings.every(isDailyTarotGeneratedCardReading) &&
    hasExactPositions(cardReadings, expectedPositionsForSpread(spread)) &&
    typeof value.advice === "string" &&
    value.advice.trim().length > 0
  );
}

function isStoredDailyTarotReading(value: unknown): value is DailyTarotReading {
  if (!isRecord(value) || !isRecord(value.card)) {
    return false;
  }

  const spread = value.spread;
  const cards = value.cards;
  const generated = value.generated;

  if (!isTarotSpread(spread) || value.source !== "llm" || !Array.isArray(cards) || !isValidStoredDrawIdentityKey(value.drawIdentityKey)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.appDate === "string" &&
    typeof value.selectedAt === "string" &&
    typeof value.card.id === "number" &&
    getTarotMajorCardById(value.card.id) !== null &&
    isTarotOrientation(value.orientation) &&
    isDailyTarotPosition(value.position) &&
    cards.every(isDailyTarotCardSelection) &&
    hasExactPositions(cards, expectedPositionsForSpread(spread)) &&
    isDailyTarotGeneratedReading(generated, spread) &&
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

function resolveCreateDailyTarotOptionsConfig(
  configOrCount: number | CreateDailyTarotOptionsConfig | undefined,
): Required<CreateDailyTarotOptionsConfig> {
  if (typeof configOrCount === "number") {
    return {
      count: configOrCount,
      drawIdentityKey: null,
    };
  }

  return {
    count: configOrCount?.count ?? tarotMajorCards.length,
    drawIdentityKey: normalizeDailyTarotDrawIdentityKey(configOrCount?.drawIdentityKey),
  };
}

function resolveGetDailyTarotReadingOptions(
  spreadOrOptions: TarotSpread | GetDailyTarotReadingOptions | undefined,
): Required<GetDailyTarotReadingOptions> {
  if (spreadOrOptions === "daily_one_card" || spreadOrOptions === "daily_three_card") {
    return {
      spread: spreadOrOptions,
      drawIdentityKey: null,
    };
  }

  return {
    spread: spreadOrOptions?.spread ?? "daily_one_card",
    drawIdentityKey: normalizeDailyTarotDrawIdentityKey(spreadOrOptions?.drawIdentityKey),
  };
}

function matchesDailyTarotDrawIdentity(reading: DailyTarotReading, drawIdentityKey: string | null): boolean {
  if (!drawIdentityKey) {
    return true;
  }

  return reading.drawIdentityKey === drawIdentityKey;
}

export function createDailyTarotOptions(
  appDate: string,
  configOrCount: number | CreateDailyTarotOptionsConfig = tarotMajorCards.length,
): DailyTarotOption[] {
  const config = resolveCreateDailyTarotOptionsConfig(configOrCount);
  const optionCount = Math.max(0, Math.min(config.count, tarotMajorCards.length));
  const seedSource = config.drawIdentityKey ? `${appDate}:${config.drawIdentityKey}` : appDate;
  const orientationRandom = createRandom(createSeed(`${seedSource}:orientation`));
  const selectedCards = shuffleCards(seedSource).slice(0, optionCount);
  const options = selectedCards.map<DailyTarotOption>((card, index) => ({
    id: `option-${index + 1}`,
    cardId: card.id,
    orientation: (orientationRandom() < 0.5 ? "upright" : "reversed") satisfies TarotOrientation,
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
    source: "local",
    drawIdentityKey: normalizeDailyTarotDrawIdentityKey(input.drawIdentityKey) ?? undefined,
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
  const readingDrawIdentityKey = normalizeDailyTarotDrawIdentityKey(reading.drawIdentityKey);
  const readings = getDailyTarotReadings(storage).filter(
    (storedReading) =>
      storedReading.appDate !== reading.appDate ||
      storedReading.spread !== reading.spread ||
      normalizeDailyTarotDrawIdentityKey(storedReading.drawIdentityKey) !== readingDrawIdentityKey,
  );

  storage.setItem(dailyTarotStorageKey, JSON.stringify([reading, ...readings]));
}

export function getDailyTarotReading(
  storage: StorageLike,
  appDate: string,
  spreadOrOptions: TarotSpread | GetDailyTarotReadingOptions = "daily_one_card",
): DailyTarotReading | null {
  const options = resolveGetDailyTarotReadingOptions(spreadOrOptions);

  return (
    getDailyTarotReadings(storage).find(
      (reading) =>
        reading.appDate === appDate &&
        reading.spread === options.spread &&
        matchesDailyTarotDrawIdentity(reading, options.drawIdentityKey),
    ) ?? null
  );
}

export function getDailyTarotReadingFromBrowser(
  appDate: string,
  spreadOrOptions: TarotSpread | GetDailyTarotReadingOptions = "daily_one_card",
): DailyTarotReading | null {
  const storage = getBrowserStorage();

  return storage ? getDailyTarotReading(storage, appDate, spreadOrOptions) : emptyDailyTarotReadingSnapshot;
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
