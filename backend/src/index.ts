export type {
  CatReaderAccess,
  CatReaderResponse,
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
  DreamSymbolCategory,
  EncyclopediaEntry,
} from "./contracts/dream";
export {
  SUPPORTED_LOCALES,
  SYMBOL_ACCESS_TIERS,
  SYMBOL_CATEGORIES,
  SYMBOL_SAFETY_LEVELS,
  SYMBOL_STATUSES,
} from "./contracts/symbol-encyclopedia";
export type {
  CultureNote,
  LocalizedSymbolEntry,
  RuntimeSymbolEntry,
  SceneModifier,
  SupportedLocale,
  SymbolAccessTier,
  SymbolCategory,
  SymbolEntry,
  SymbolEntryStatus,
  SymbolSafetyLevel,
} from "./contracts/symbol-encyclopedia";
export { encyclopediaEntries, getEntryBySymbol } from "./data/encyclopedia";
export { getRuntimeSymbolEntries, getRuntimeSymbolEntry, symbolEntries } from "./data/symbol-encyclopedia";
export { analyzeDream } from "./services/mock-analysis";
export { analyzeDreamStructure } from "./services/structured-dream-analysis";
export type {
  EmotionSignal,
  SafetySignal,
  SelectedMood,
  StructuredDreamAnalysis,
  StructuredDreamAnalysisRequest,
  SymbolCandidate,
  ThemeSignal,
} from "./services/structured-dream-analysis";
export {
  classifyRetrievalMatch,
  MATCH_TYPE_BASE_SCORES,
  scoreRetrievalCandidate,
} from "./services/retrieval-scoring";
export type {
  RetrievalCandidateSource,
  RetrievalGroup,
  RetrievalMatchType,
  RetrievalScoreInput,
} from "./services/retrieval-scoring";
export { findMatchingSymbols, findRuntimeSymbolMatches } from "./services/symbol-matcher";
export type {
  RuntimeSymbolMatch,
  RuntimeSymbolMatchOptions,
  SymbolMatch,
  SymbolMatchOptions,
} from "./services/symbol-matcher";
