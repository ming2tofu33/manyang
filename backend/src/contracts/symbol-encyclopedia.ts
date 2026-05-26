export const SYMBOL_STATUSES = ["draft", "active", "deprecated"] as const;

export const SYMBOL_SAFETY_LEVELS = ["safe", "sensitive"] as const;

export const SYMBOL_ACCESS_TIERS = ["free", "premium"] as const;

export const SUPPORTED_LOCALES = ["ko", "en"] as const;

export const SYMBOL_CATEGORIES = [
  "place",
  "object",
  "action",
  "nature",
  "animal",
  "person",
  "emotion",
  "quantity",
  "time",
] as const;

export type SymbolEntryStatus = (typeof SYMBOL_STATUSES)[number];
export type SymbolSafetyLevel = (typeof SYMBOL_SAFETY_LEVELS)[number];
export type SymbolAccessTier = (typeof SYMBOL_ACCESS_TIERS)[number];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type SymbolCategory = (typeof SYMBOL_CATEGORIES)[number];

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
  category: SymbolCategory;
  safetyLevel: SymbolSafetyLevel;
  accessTier: SymbolAccessTier;
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
