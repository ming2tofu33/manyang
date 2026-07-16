export const TAROT_SPREADS = [
  "daily_one_card",
  "question_one_card",
  "daily_three_card",
] as const;

export const TAROT_ORIENTATIONS = ["upright", "reversed"] as const;

export const TAROT_POSITIONS = ["today", "situation", "flow", "advice"] as const;

export const TAROT_UNLOCK_METHODS = [
  "daily_free",
  "rewarded_ad",
  "moon_pass",
  "admin",
] as const;

export const TAROT_ARCANAS = ["major", "minor"] as const;

export const TAROT_MINOR_SUITS = ["wands", "cups", "swords", "pentacles"] as const;

export const TAROT_MINOR_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

export type TarotSpread = (typeof TAROT_SPREADS)[number];
export type TarotOrientation = (typeof TAROT_ORIENTATIONS)[number];
export type DailyTarotPosition = (typeof TAROT_POSITIONS)[number];
export type TarotUnlockMethod = (typeof TAROT_UNLOCK_METHODS)[number];
export type TarotArcana = (typeof TAROT_ARCANAS)[number];
export type TarotMinorSuit = (typeof TAROT_MINOR_SUITS)[number];
export type TarotMinorRank = (typeof TAROT_MINOR_RANKS)[number];

export type TarotCardSymbolMeaning = {
  symbol: string;
  meaning: string;
};

export type TarotCardMeaning = {
  summary: string;
  dailyFlow: string;
  cardMessage: string;
  readingScene: string;
};

export type TarotCardContexts = {
  love: string;
  career: string;
  money: string;
  general: string;
};

type TarotBaseCardContent = {
  id: number;
  cardKey: string;
  imageKey: string;
  slug: string;
  nameEn: string;
  nameKo: string;
  keywords: readonly string[];
  visualSymbols: readonly string[];
  symbolMeanings: readonly TarotCardSymbolMeaning[];
  mood: string;
  upright: TarotCardMeaning;
  reversed: TarotCardMeaning;
  contexts: TarotCardContexts;
};

export type TarotMajorCardContent = TarotBaseCardContent & {
  arcana: "major";
  roman: string;
};

export type TarotMinorCardContent = TarotBaseCardContent & {
  arcana: "minor";
  suit: TarotMinorSuit;
  rank: TarotMinorRank;
};

export type TarotCardContent = TarotMajorCardContent | TarotMinorCardContent;

export type TarotMajorCardSnapshot = Omit<
  TarotMajorCardContent,
  "arcana" | "cardKey" | "imageKey"
> & {
  arcana?: "major";
  cardKey?: string;
  imageKey?: string;
  image: string;
};

export type TarotMinorCardSnapshot = Omit<TarotMinorCardContent, "imageKey"> & {
  imageKey?: string;
  image: string;
};

export type TarotCard = TarotMajorCardSnapshot | TarotMinorCardSnapshot;

export type TarotQuestionStateKey =
  | "mind_complex"
  | "relationship_concern"
  | "work_blocked"
  | "reality_anxiety"
  | "decision_point"
  | "daily_signal";

export type TarotQuestionPrompt = {
  key: string;
  text: string;
};

export type TarotQuestionState = {
  key: TarotQuestionStateKey;
  label: string;
  representativeQuestion: string;
  questions: readonly TarotQuestionPrompt[];
};

export type DailyTarotOption = {
  id: string;
  cardId: number;
  orientation: TarotOrientation;
};

export type DailyTarotCardSelection = {
  position: DailyTarotPosition;
  card: TarotCard;
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
  keywords?: string[];
  cardReadings: DailyTarotGeneratedCardReading[];
  advice: string;
};

export type DailyTarotQuestionContext = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};

export type DailyTarotReading = {
  id: string;
  spread: TarotSpread;
  source?: "local" | "llm";
  drawIdentityKey?: string;
  appDate: string;
  selectedAt: string;
  card: TarotCard;
  orientation: TarotOrientation;
  position: DailyTarotPosition;
  cards?: DailyTarotCardSelection[];
  generated?: DailyTarotGeneratedReading;
  keywords: string[];
  title: string;
  message: string;
  advice: string;
  questionContext?: DailyTarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
};

export type TarotReadingSelectionRequest = {
  cardId: number;
  orientation: TarotOrientation;
  position: DailyTarotPosition;
};

export type TarotReadingRequest = {
  appDate: string;
  spread: TarotSpread;
  selectedAt: string;
  selections: TarotReadingSelectionRequest[];
  questionContext?: DailyTarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
};

export type TarotReadingSpread = TarotSpread;
export type TarotReadingPosition = DailyTarotPosition;
export type TarotReadingOrientation = TarotOrientation;
export type TarotPromptCardMeaning = TarotCardMeaning;
