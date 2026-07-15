export const CAT_READER_TYPES = [
  "black_cat",
  "white_cat",
  "cheese_cat",
  "gray_cat",
] as const;

export type CatReaderType = (typeof CAT_READER_TYPES)[number];

export const DREAM_LOCALES = ["ko", "en"] as const;

export type DreamLocale = (typeof DREAM_LOCALES)[number];

export type DreamSymbolCategory =
  | "place"
  | "person"
  | "animal"
  | "nature"
  | "object"
  | "body"
  | "action"
  | "event"
  | "food"
  | "emotion"
  | "abstract";

export type CatReaderAccess = "free" | "annual_premium";

export type CatReaderResponse = {
  id: CatReaderType;
  name: string;
  access: CatReaderAccess;
};

export type DreamNightContext = {
  checkInDate: string;
  moodLabel: string;
  conditionLabel: string;
  note?: string;
};

export type EncyclopediaEntry = {
  symbol: string;
  slug: string;
  category: DreamSymbolCategory;
  aliases: string[];
  coreMeanings: string[];
  positiveReadings: string[];
  negativeReadings: string[];
  contextQuestions: string[];
  relatedSymbols: string[];
  catInterpretationHint: string;
  body: string;
};

export type DreamAnalysisRequest = {
  dreamText: string;
  dreamDate?: string;
  wakeMood?: string;
  dreamMood?: string;
  dreamAtmospheres?: string[];
  dreamSensations?: string[];
  dreamSensationOther?: string;
  nightContext?: DreamNightContext;
  catReaderType?: CatReaderType;
  locale?: DreamLocale;
  userTimeZone?: string;
};

export type DreamCardResponse = {
  name: string;
  type: string;
  keywords: string[];
  summary: string;
  message: string;
  theme: string;
};

export type DreamAnalysisResponse = {
  dreamId: string;
  analysisId: string;
  cardId: string;
  reader: CatReaderResponse;
  summary: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  interpretation: string;
  symbolReadings: { symbol: string; reading: string }[];
  smallPrescription: string;
  readingBasis: { usedSymbols: string[]; mainThemes: string[]; confidence: number };
  readerNote?: string;
  safetyNotice?: string;
  card: DreamCardResponse;
};
