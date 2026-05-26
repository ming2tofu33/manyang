export type DreamSymbolCategory =
  | "place"
  | "object"
  | "action"
  | "nature"
  | "animal"
  | "emotion"
  | "person";

export type CatReaderType = "black_cat" | "white_cat" | "cheese_cat" | "gray_cat";
export type CatReaderAccess = "free" | "annual_premium";

export type CatReaderResponse = {
  id: CatReaderType;
  name: string;
  access: CatReaderAccess;
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
  catReaderType?: CatReaderType;
  locale?: "ko" | "en";
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
  symbolReadings: {
    symbol: string;
    reading: string;
  }[];
  smallPrescription: string;
  readingBasis: {
    usedSymbols: string[];
    mainThemes: string[];
    confidence: number;
  };
  readerNote?: string;
  safetyNotice?: string;
  card: DreamCardResponse;
};
