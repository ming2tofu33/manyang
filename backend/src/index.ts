export type {
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
  DreamSymbolCategory,
  EncyclopediaEntry,
} from "./contracts/dream.js";
export { encyclopediaEntries, getEntryBySymbol } from "./data/encyclopedia.js";
export { analyzeDream } from "./services/mock-analysis.js";
export { findMatchingSymbols } from "./services/symbol-matcher.js";
export type { SymbolMatch, SymbolMatchOptions } from "./services/symbol-matcher.js";
