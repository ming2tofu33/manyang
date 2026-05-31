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
  /** 사용자가 고른 꿈 분위기(정서) 옵션 id 목록. 예: ["anxious", "wistful"] */
  dreamAtmospheres?: string[];
  /** 사용자가 고른 꿈 감각 옵션 id 목록. 예: ["falling", "chased"] */
  dreamSensations?: string[];
  /** 사용자가 '그 외'에 직접 적은 감각. 약한 신호로 처방 앵커에만 쓰인다. */
  dreamSensationOther?: string;
  /** 전날 밤 사용자가 남긴 기분/컨디션 기록. 꿈을 정하는 값이 아니라 해몽 맥락으로만 사용한다. */
  nightContext?: DreamNightContext;
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
