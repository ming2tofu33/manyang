export const SYMBOL_STATUSES = ["draft", "active", "deprecated"] as const;

export const SYMBOL_SAFETY_LEVELS = ["safe", "sensitive"] as const;

export const SYMBOL_ACCESS_TIERS = ["free", "premium"] as const;

export const SUPPORTED_LOCALES = ["ko", "en"] as const;

// 단일 축("꿈에 무엇이 나오나") 대분류. 사용자 브라우즈/SEO와 해몽 엔진이 함께 쓴다.
export const SYMBOL_CATEGORIES = [
  "place",
  "person",
  "animal",
  "nature",
  "object",
  "body",
  "action",
  "event",
  "food",
  "emotion",
  "abstract",
] as const;

export const SYMBOL_ROLES = ["primary_candidate", "modifier", "context_signal"] as const;

export const SYMBOL_EMBEDDING_CHUNK_TYPES = ["searchText", "sceneModifier", "safeReading", "metaphorHook"] as const;

export const SYMBOL_EDITORIAL_STATUSES = ["needs_review", "approved"] as const;

export type SymbolEntryStatus = (typeof SYMBOL_STATUSES)[number];
export type SymbolSafetyLevel = (typeof SYMBOL_SAFETY_LEVELS)[number];
export type SymbolAccessTier = (typeof SYMBOL_ACCESS_TIERS)[number];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type SymbolCategory = (typeof SYMBOL_CATEGORIES)[number];
export type SymbolRole = (typeof SYMBOL_ROLES)[number];
export type EmbeddingChunkType = (typeof SYMBOL_EMBEDDING_CHUNK_TYPES)[number];
export type SymbolEditorialStatus = (typeof SYMBOL_EDITORIAL_STATUSES)[number];

export type FortuneValence = "auspicious" | "cautious";

export type SceneModifier = {
  triggerTerms: string[];
  reading: string;
  weight: number;
  /** 이 장면이 길조/흉조 중 어느 쪽을 가리키는지(조건부 심볼의 omen 판정용). */
  fortuneValence?: FortuneValence;
};

// 전통 점괘 의미. auspicious=무조건 길몽, conditional=장면 단서로 길/흉이 갈림.
export type SymbolFortune = {
  valence: "auspicious" | "conditional";
  auspicious: string;
  /** conditional일 때 흉으로 기운 장면의 '부드러운 환기'(불행 예측 금지). */
  cautious?: string;
};

export type SymbolDisambiguationRule = {
  alias: string;
  confirmWhen?: string[];
  rejectWhen?: string[];
  fallback: "candidate_only" | "reject";
};

export type SymbolDisambiguation = Partial<Record<SupportedLocale, SymbolDisambiguationRule[]>>;

export type EmbeddingProfile = {
  chunkTypes: EmbeddingChunkType[];
};

export type LocalizedSymbolEntry = {
  label: string;
  aliases: string[];
  searchText: string;
  coreMeanings: string[];
  lightReadings: string[];
  shadowReadings: string[];
  sceneModifiers: Record<string, SceneModifier>;
  contextQuestions: string[];
  metaphorHooks: string[];
  cardTitleSeeds: string[];
  smallPrescriptions: string[];
  safeReading: string;
  avoidExpressions: string[];
  /** 전통 점괘 의미. playful 허용 + lean에 따라 인용, 절대 단정은 금지. */
  fortune?: SymbolFortune;
};

export type SymbolEntry = {
  id: string;
  status: SymbolEntryStatus;
  editorialStatus: SymbolEditorialStatus;
  category: SymbolCategory;
  subcategory: string;
  facets: string[];
  symbolRole: SymbolRole[];
  safetyLevel: SymbolSafetyLevel;
  accessTier: SymbolAccessTier;
  embeddingProfile: EmbeddingProfile;
  universalMeanings: string[];
  relatedIds: string[];
  sourceBasis: string[];
  disambiguation?: SymbolDisambiguation;
  locales: Record<SupportedLocale, LocalizedSymbolEntry>;
};

export type RuntimeSymbolEntry = {
  id: string;
  category: SymbolCategory;
  subcategory: string;
  facets: string[];
  symbolRole: SymbolRole[];
  safetyLevel: SymbolSafetyLevel;
  accessTier: SymbolAccessTier;
  label: string;
  aliases: string[];
  searchText: string;
  relatedIds: string[];
  disambiguation?: SymbolDisambiguation;
  evidence: {
    coreMeanings: string[];
    lightReadings: string[];
    shadowReadings: string[];
    sceneModifiers: Record<string, SceneModifier>;
    metaphorHooks: string[];
    avoidExpressions: string[];
    fortune?: SymbolFortune;
  };
};
