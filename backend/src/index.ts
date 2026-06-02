export type {
  CatReaderAccess,
  CatReaderResponse,
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
  DreamNightContext,
  DreamSymbolCategory,
  EncyclopediaEntry,
} from "./contracts/dream";
export {
  SUPPORTED_LOCALES,
  SYMBOL_ACCESS_TIERS,
  SYMBOL_CATEGORIES,
  SYMBOL_EDITORIAL_STATUSES,
  SYMBOL_EMBEDDING_CHUNK_TYPES,
  SYMBOL_INTERPRETATION_LENSES,
  SYMBOL_ROLES,
  SYMBOL_SAFETY_LEVELS,
  SYMBOL_STATUSES,
} from "./contracts/symbol-encyclopedia";
export type {
  CultureNote,
  EmbeddingChunkType,
  EmbeddingProfile,
  InterpretationLens,
  InterpretationLensKey,
  InterpretationLensMap,
  LocalizedSymbolEntry,
  RuntimeSymbolEntry,
  SceneModifier,
  SupportedLocale,
  SymbolAccessTier,
  SymbolCategory,
  SymbolEditorialStatus,
  SymbolEntry,
  SymbolEntryStatus,
  SymbolRole,
  SymbolSafetyLevel,
} from "./contracts/symbol-encyclopedia";
export { getRuntimeSymbolEntries, getRuntimeSymbolEntry, symbolEntries } from "./data/symbol-encyclopedia";
export { getEncyclopediaEntriesForLocale } from "./services/encyclopedia-symbols";
export { analyzeDream } from "./services/mock-analysis";
export {
  analyzeDreamSafetyPolicy,
  applySafetyPolicyToResponse,
} from "./services/dream-safety-policy";
export {
  buildEvidenceGate,
  isVerifiedSymbolLabel,
} from "./services/evidence-gate";
export type {
  EvidenceGateInput,
  EvidenceGateResult,
  VerifiedEvidenceSymbol,
} from "./services/evidence-gate";
export type {
  DreamSafetyPolicyResult,
  DreamSafetyRisk,
  DreamSafetyRiskType,
  DreamSafetySeverity,
} from "./services/dream-safety-policy";
export {
  catReaderPersonas,
  getCatReaderPersona,
  normalizeCatReaderPersonaId,
} from "./services/cat-reader-personas";
export type { CatReaderPersona } from "./services/cat-reader-personas";
export {
  buildDreamReadingPrompt,
  DREAM_READING_DRAFT_JSON_SCHEMA,
  DREAM_READING_DRAFT_SCHEMA_NAME,
} from "./services/dream-reading-prompt";
export type { DreamReadingPrompt, DreamReadingPromptInput } from "./services/dream-reading-prompt";
export {
  buildTarotReadingPrompt,
  TAROT_READING_DRAFT_JSON_SCHEMA,
  TAROT_READING_DRAFT_SCHEMA_NAME,
} from "./services/tarot-reading-prompt";
export type {
  TarotPromptCard,
  TarotPromptCardMeaning,
  TarotReadingOrientation,
  TarotReadingPosition,
  TarotReadingPrompt,
  TarotReadingPromptCardInput,
  TarotReadingPromptInput,
  TarotReadingSpread,
} from "./services/tarot-reading-prompt";
export { buildDreamRagChunks } from "./services/dream-rag-chunks";
export type { DreamRagChunk } from "./services/dream-rag-chunks";
export {
  cosineSimilarity,
  loadCachedDreamVectorIndex,
  createDreamVectorIndex,
  loadDreamVectorIndex,
  saveDreamVectorIndex,
  searchDreamVectorIndex,
} from "./services/dream-vector-index";
export type {
  CreateDreamVectorIndexInput,
  DreamVectorIndex,
  DreamVectorIndexItem,
  DreamVectorSearchOptions,
  DreamVectorSearchResult,
} from "./services/dream-vector-index";
export { ingestDreamRagVectorIndex } from "./services/dream-rag-ingestion";
export type { IngestDreamRagVectorIndexInput } from "./services/dream-rag-ingestion";
export { buildDreamRagVectorIndexFile } from "./services/dream-rag-index-builder";
export type {
  BuildDreamRagVectorIndexFileInput,
  BuildDreamRagVectorIndexFileResult,
} from "./services/dream-rag-index-builder";
export {
  EmbeddingProviderConfigurationError,
  EmbeddingProviderRequestError,
} from "./services/dream-embedding-provider";
export type { DreamEmbeddingProvider } from "./services/dream-embedding-provider";
export {
  analyzeDreamWithLlm,
  generateDreamReadingForUser,
  DEFAULT_LLM_PROVIDER_TIMEOUT_MS,
} from "./services/llm-dream-analysis";
export type {
  AnalyzeDreamWithLlmOptions,
  DreamReadingResult,
  DreamReadingUnavailableReason,
} from "./services/llm-dream-analysis";
export { generateTarotReadingForUser } from "./services/llm-tarot-reading";
export type {
  GenerateTarotReadingOptions,
  TarotGeneratedCardReading,
  TarotGeneratedReading,
  TarotReadingInput,
  TarotReadingResult,
  TarotReadingUnavailableReason,
} from "./services/llm-tarot-reading";
export {
  LlmProviderTimeoutError,
  LlmProviderConfigurationError,
  LlmProviderRequestError,
} from "./services/llm-provider";
export type {
  DreamReadingLlmProvider,
  DreamReadingLlmRequest,
  JsonSchemaObject,
} from "./services/llm-provider";
export {
  createOpenAIResponsesProviderFromEnv,
  OpenAIResponsesProvider,
} from "./services/openai-responses-provider";
export type { OpenAIResponsesProviderOptions } from "./services/openai-responses-provider";
export {
  createOpenAIEmbeddingsProviderFromEnv,
  OpenAIEmbeddingsProvider,
} from "./services/openai-embeddings-provider";
export type { OpenAIEmbeddingsProviderOptions } from "./services/openai-embeddings-provider";
export { analyzeDreamStructure } from "./services/structured-dream-analysis";
export type {
  EmotionSignal,
  FortuneReading,
  SafetySignal,
  SelectedMood,
  StructuredDreamAnalysis,
  StructuredDreamAnalysisRequest,
  SymbolCandidate,
  ThemeSignal,
} from "./services/structured-dream-analysis";
export { safeLemmatize } from "./services/korean-lemmatizer";
export type { Lemmatizer, KoreanLemmatizer } from "./services/korean-lemmatizer";
export {
  createKoreanLemmatizerFromEnv,
  HttpKoreanLemmatizer,
} from "./services/http-korean-lemmatizer";
export type { HttpKoreanLemmatizerOptions } from "./services/http-korean-lemmatizer";
export { createEnglishLemmatizer, EnglishLemmatizer } from "./services/english-lemmatizer";
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
export { findRuntimeSymbolMatches } from "./services/symbol-matcher";
export type {
  RuntimeSymbolMatch,
  RuntimeSymbolMatchOptions,
} from "./services/symbol-matcher";
export {
  retrieveDreamEvidence,
  retrieveDreamEvidenceSet,
  retrieveDreamEvidenceWithVectorIndex,
  retrieveDreamEvidenceSetWithVectorIndex,
} from "./services/dream-rag-retriever";
export type {
  DreamEvidenceRetrievalPolicy,
  DreamEvidenceSet,
  RetrieveDreamEvidenceInput,
  RetrieveDreamEvidenceWithVectorIndexInput,
} from "./services/dream-rag-retriever";
export {
  createDreamReadingQualityMarkdown,
  dreamReadingQualityCases,
  runDreamReadingQualityEval,
} from "./services/dream-reading-quality-eval";
export type {
  DreamReadingQualityCase,
  DreamReadingQualityComparison,
  DreamReadingQualityFocus,
  DreamReadingQualityMetrics,
  DreamReadingQualityReport,
  EvaluatedDreamReading,
  PersonaComparison,
} from "./services/dream-reading-quality-eval";
