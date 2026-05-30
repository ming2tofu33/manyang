export const SYMBOL_STATUSES = ["draft", "active", "deprecated"] as const;

export const SYMBOL_SAFETY_LEVELS = ["safe", "sensitive"] as const;

export const SYMBOL_ACCESS_TIERS = ["free", "premium"] as const;

export const SUPPORTED_LOCALES = ["ko", "en"] as const;

export const SYMBOL_CATEGORIES = [
  "place",
  "living_being",
  "object",
  "body",
  "action",
  "event",
  "nature",
  "food",
  "emotion",
  "social",
  "relationship",
  "state",
  "quantity",
  "time",
  "abstract",
] as const;

export const SYMBOL_ROLES = ["primary_candidate", "modifier", "context_signal"] as const;

export const SYMBOL_INTERPRETATION_LENSES = ["universal", "east_asian", "western"] as const;

export const SYMBOL_EMBEDDING_CHUNK_TYPES = ["searchText", "sceneModifier", "safeReading", "metaphorHook"] as const;

export const SYMBOL_EDITORIAL_STATUSES = ["needs_review", "approved"] as const;

export type SymbolEntryStatus = (typeof SYMBOL_STATUSES)[number];
export type SymbolSafetyLevel = (typeof SYMBOL_SAFETY_LEVELS)[number];
export type SymbolAccessTier = (typeof SYMBOL_ACCESS_TIERS)[number];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type SymbolCategory = (typeof SYMBOL_CATEGORIES)[number];
export type SymbolRole = (typeof SYMBOL_ROLES)[number];
export type InterpretationLensKey = (typeof SYMBOL_INTERPRETATION_LENSES)[number];
export type EmbeddingChunkType = (typeof SYMBOL_EMBEDDING_CHUNK_TYPES)[number];
export type SymbolEditorialStatus = (typeof SYMBOL_EDITORIAL_STATUSES)[number];

export type CultureNote = {
  weight: number;
  exposeByDefault: false;
  notes: string[];
  safeTransform: string[];
};

export type SceneModifier = {
  triggerTerms: string[];
  reading: string;
  weight: number;
};

export type InterpretationLens = {
  sourceBasis: string[];
  coreMeanings?: string[];
  referenceNotes?: string[];
  safeTransform: string[];
  avoidClaims: string[];
};

export type InterpretationLensMap = Record<InterpretationLensKey, InterpretationLens>;

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
  interpretationLenses: InterpretationLensMap;
  embeddingProfile: EmbeddingProfile;
  universalMeanings: string[];
  tensionAxis: string[];
  relatedIds: string[];
  sourceBasis: string[];
  cultureNotes?: Partial<Record<SupportedLocale, CultureNote>>;
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
  evidence: {
    coreMeanings: string[];
    lightReadings: string[];
    shadowReadings: string[];
    sceneModifiers: Record<string, SceneModifier>;
    metaphorHooks: string[];
    avoidExpressions: string[];
  };
};
