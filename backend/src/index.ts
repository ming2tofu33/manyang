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
export { encyclopediaEntries, getEntryBySymbol } from "./data/encyclopedia";
export { analyzeDream } from "./services/mock-analysis";
export { findMatchingSymbols } from "./services/symbol-matcher";
export type { SymbolMatch, SymbolMatchOptions } from "./services/symbol-matcher";
