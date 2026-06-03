import { getRuntimeSymbolEntry } from "../data/symbol-encyclopedia";
import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import type { DreamEmbeddingProvider } from "./dream-embedding-provider";
import { buildDreamRagChunks, type DreamRagChunk } from "./dream-rag-chunks";
import {
  searchDreamVectorIndex,
  type DreamVectorIndex,
  type DreamVectorSearchResult,
} from "./dream-vector-index";
import { scoreRetrievalCandidate } from "./retrieval-scoring";
import { findRuntimeSymbolMatches, type RuntimeSymbolMatch } from "./symbol-matcher";
import type { StructuredDreamAnalysis } from "./structured-dream-analysis";

export type RetrieveDreamEvidenceInput = {
  dreamText: string;
  locale?: SupportedLocale;
  /** 형태소 분석기가 돌려준 어간 목록(있으면 explicit 매처에 합쳐 활용형 매칭을 보강한다). */
  lemmas?: string[];
  structuredAnalysis?: StructuredDreamAnalysis;
  vectorMatches?: DreamVectorSearchResult[];
  includeChunkMatches?: boolean;
  limit?: number;
  semanticCandidateLimit?: number;
  vectorCandidateMinScore?: number;
  vectorCandidateWithExplicitMinScore?: number;
  semanticPromotionMinConfidence?: number;
  vectorPromotionMinScore?: number;
  vectorNewSymbolLimit?: number;
};

export type RetrieveDreamEvidenceWithVectorIndexInput = RetrieveDreamEvidenceInput & {
  vectorIndex: DreamVectorIndex;
  embeddingProvider: DreamEmbeddingProvider;
  vectorLimit?: number;
  vectorMinScore?: number;
};

export type DreamEvidenceRetrievalPolicy = {
  confirmedRule: string;
  candidateRule: string;
  semanticFalsePositiveRule: string;
  vectorTrustRule: string;
};

export type DreamEvidenceSet = {
  confirmedEvidence: RuntimeSymbolMatch[];
  candidateEvidence: RuntimeSymbolMatch[];
  retrievalPolicy: DreamEvidenceRetrievalPolicy;
};

const DEFAULT_SEMANTIC_CANDIDATE_LIMIT = 1;
// 임계값은 실제 인덱스(text-embedding-3-small, ko/en 847청크)의 코사인 분포에 맞춰 보정됨:
// 구조분석으로 확장된 쿼리에서 정답 심볼은 ~0.55–0.78, 무관 노이즈는 ~0.34–0.40에 분포한다.
// 기존 0.85/0.92는 그 범위를 한참 웃돌아 벡터 후보/승격이 사실상 한 번도 발화하지 못했다(dead lane).
// 노이즈 바닥(~0.40)보다 충분히 높고 정답대(~0.55+) 안에 드는 값으로 내려, promotion-by-agreement 경로를 살린다.
const DEFAULT_VECTOR_CANDIDATE_MIN_SCORE = 0.6;
// 0.68 → 0.62: 무관한 explicit 매치(예: 손)가 있을 때도 진짜 벡터 후보(예: teeth 0.628)가
// 막히지 않도록 낮춤. 노이즈 바닥(~0.40)보다 충분히 높아 precision 영향은 제한적(eval로 검증).
const DEFAULT_VECTOR_CANDIDATE_WITH_EXPLICIT_MIN_SCORE = 0.62;
const DEFAULT_SEMANTIC_PROMOTION_MIN_CONFIDENCE = 0.8;
const DEFAULT_VECTOR_PROMOTION_MIN_SCORE = 0.68;
const DEFAULT_VECTOR_NEW_SYMBOL_LIMIT = 1;

const retrievalPolicy: DreamEvidenceRetrievalPolicy = {
  confirmedRule:
    "Explicit alias matches are confirmed; non-sensitive new symbols can be confirmed only by strong semantic/vector agreement.",
  candidateRule:
    "New semantic or vector symbols can surface as candidate evidence, but chunk-only or vector-only candidates must not be interpreted symbolically.",
  semanticFalsePositiveRule:
    "Broad semantic chunk matches need multiple meaningful terms and cannot become confirmed evidence by chunk overlap alone.",
  vectorTrustRule:
    "Vector-only symbols need high similarity and remain candidate evidence unless a strong semantic chunk agrees on the same safe symbol.",
};

type ChunkCandidate = {
  chunk: DreamRagChunk;
  score: number;
  matchedTerms: string[];
};

type SymbolCandidateGroup = {
  symbolId: string;
  bestScore: number;
  chunks: ChunkCandidate[];
};

const stopWords = new Set([
  "그리고",
  "그런데",
  "있는",
  "느낌",
  "느껴졌고",
  "장소",
  "꿈",
  "꿈에서",
  "같았어",
  "a",
  "an",
  "as",
  "at",
  "by",
  "for",
  "in",
  "is",
  "it",
  "no",
  "of",
  "on",
  "or",
  "saw",
  "then",
  "to",
  "was",
  "way",
  "were",
  "while",
  "with",
  "and",
  "the",
  "that",
  "this",
  "there",
  "felt",
  "feeling",
  "dream",
]);

const weakSemanticCandidateTerms = new Set(
  [
    "감정",
    "마음",
    "느낌",
    "느껴졌고",
    "크게",
    "해소",
    "슬픔",
    "안도",
    "벅찬",
    "어려운",
    "장면",
    "장면만",
    "희미",
    "희미함",
    "feeling",
    "emotion",
    "mind",
    "scene",
    "dream",
    "hard",
    "difficult",
    "unclear",
    "vague",
    "blurry",
  ].map(compact),
);

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function compact(text: string): string {
  return normalize(text).replace(/[^\p{L}\p{N}]/gu, "");
}

function usefulTokens(text: string): string[] {
  return [...new Set(tokenize(text).filter((token) => compact(token).length >= 2 && !stopWords.has(token)))];
}

function tokenMatches(queryToken: string, chunkToken: string): boolean {
  const queryKey = compact(queryToken);
  const chunkKey = compact(chunkToken);

  if (!queryKey || !chunkKey) {
    return false;
  }

  if (queryKey === chunkKey) {
    return true;
  }

  if (!isLatinToken(queryKey) || !isLatinToken(chunkKey)) {
    return queryKey.includes(chunkKey) || chunkKey.includes(queryKey);
  }

  const queryStem = englishStem(queryKey);
  const chunkStem = englishStem(chunkKey);

  if (queryStem.length >= 4 && queryStem === chunkStem) {
    return true;
  }

  const shorterLength = Math.min(queryKey.length, chunkKey.length);
  const longerLength = Math.max(queryKey.length, chunkKey.length);

  return shorterLength >= 5 && longerLength - shorterLength <= 3 && (queryKey.startsWith(chunkKey) || chunkKey.startsWith(queryKey));
}

function isLatinToken(value: string): boolean {
  return /^[a-z0-9]+$/.test(value);
}

function englishStem(value: string): string {
  if (value.length > 5 && value.endsWith("ing")) {
    return value.slice(0, -3);
  }

  if (value.length > 4 && value.endsWith("ed")) {
    return value.slice(0, -2);
  }

  if (value.length > 4 && value.endsWith("s")) {
    return value.slice(0, -1);
  }

  return value;
}

function queryTextFrom(input: RetrieveDreamEvidenceInput): string {
  const structured = input.structuredAnalysis;

  return [
    input.dreamText,
    ...(structured?.literalQueries ?? []),
    ...(structured?.sceneQueries ?? []),
    ...(structured?.themeQueries ?? []),
    ...(structured?.modifierQueries ?? []),
    ...(structured?.inferredEmotions.map((emotion) => emotion.label) ?? []),
    ...(structured?.themes.map((theme) => theme.label) ?? []),
  ].join(" ");
}

function scoreChunk(chunk: DreamRagChunk, queryTokens: string[]): ChunkCandidate | undefined {
  const chunkTokens = usefulTokens(chunk.text);
  const matchedTerms = queryTokens.filter((queryToken) =>
    chunkTokens.some((chunkToken) => tokenMatches(queryToken, chunkToken)),
  );

  if (matchedTerms.length === 0) {
    return undefined;
  }

  const exactPhraseBoost = queryTokens.filter((queryToken) => chunk.text.includes(queryToken)).length * 0.35;
  const modifierBoost = chunk.chunkType === "sceneModifier" ? 0.65 : 0;
  const score = matchedTerms.length + exactPhraseBoost + modifierBoost;

  if (score < 2) {
    return undefined;
  }

  return {
    chunk,
    score,
    matchedTerms,
  };
}

function groupChunkCandidates(candidates: ChunkCandidate[]): SymbolCandidateGroup[] {
  const groups = new Map<string, SymbolCandidateGroup>();

  for (const candidate of candidates) {
    const current = groups.get(candidate.chunk.symbolId) ?? {
      symbolId: candidate.chunk.symbolId,
      bestScore: 0,
      chunks: [],
    };

    current.bestScore = Math.max(current.bestScore, candidate.score);
    current.chunks.push(candidate);
    groups.set(candidate.chunk.symbolId, current);
  }

  return [...groups.values()].sort((left, right) => right.bestScore - left.bestScore);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function chunkGroupToRuntimeMatch(group: SymbolCandidateGroup, locale: SupportedLocale): RuntimeSymbolMatch {
  const entry = getRuntimeSymbolEntry(group.symbolId, locale);
  const topChunks = [...group.chunks].sort((left, right) => right.score - left.score).slice(0, 3);
  const hasSceneModifier = topChunks.some((candidate) => candidate.chunk.chunkType === "sceneModifier");
  const confidence = Math.min(
    0.86,
    Math.max(
      scoreRetrievalCandidate({
        matchType: "semantic",
        source: "inferred",
        importance: hasSceneModifier ? 4 : 3,
        hasEvidenceText: true,
        hasSceneModifier,
        localeMatches: true,
      }),
      0.62 + Math.min(group.bestScore / 20, 0.2),
    ),
  );

  return {
    entryId: entry.id,
    entry,
    locale,
    label: entry.label,
    category: entry.category,
    subcategory: entry.subcategory,
    facets: entry.facets,
    symbolRole: entry.symbolRole,
    matchType: "semantic",
    confidence: Number(confidence.toFixed(2)),
    matchedText: unique(topChunks.flatMap((candidate) => candidate.matchedTerms)),
    usedFields: unique(
      group.chunks.map((candidate) =>
        candidate.chunk.metadata.modifierKey
          ? `chunks.sceneModifier.${candidate.chunk.metadata.modifierKey}`
          : `chunks.${candidate.chunk.chunkType}`,
      ),
    ),
    rankReason: `semantic RAG chunk match on ${topChunks
      .map((candidate) => candidate.chunk.chunkType)
      .join(", ")}`,
    evidence: entry.evidence,
  };
}

function vectorResultToRuntimeMatch(result: DreamVectorSearchResult, locale: SupportedLocale): RuntimeSymbolMatch {
  const entry = getRuntimeSymbolEntry(result.symbolId, locale);
  const usedField = result.metadata.modifierKey
    ? `vector.sceneModifier.${result.metadata.modifierKey}`
    : `vector.${result.chunkType}`;

  return {
    entryId: entry.id,
    entry,
    locale,
    label: entry.label,
    category: entry.category,
    subcategory: entry.subcategory,
    facets: entry.facets,
    symbolRole: entry.symbolRole,
    matchType: "semantic",
    confidence: Number(Math.max(0, Math.min(0.95, result.score)).toFixed(2)),
    matchedText: [result.label],
    usedFields: [usedField],
    rankReason: `semantic vector index match on ${result.chunkId}`,
    evidence: entry.evidence,
  };
}

function mergeMatches(
  explicitMatches: RuntimeSymbolMatch[],
  chunkMatches: RuntimeSymbolMatch[],
  vectorMatches: RuntimeSymbolMatch[],
  limit: number,
): RuntimeSymbolMatch[] {
  const byId = new Map<string, RuntimeSymbolMatch>();

  for (const match of [...chunkMatches, ...vectorMatches, ...explicitMatches]) {
    const current = byId.get(match.entryId);

    if (!current) {
      byId.set(match.entryId, match);
      continue;
    }

    byId.set(match.entryId, {
      ...current,
      matchType: current.confidence >= match.confidence ? current.matchType : match.matchType,
      confidence: Math.max(current.confidence, match.confidence),
      matchedText: unique([...current.matchedText, ...match.matchedText]),
      usedFields: unique([...current.usedFields, ...match.usedFields]),
      rankReason: `${current.rankReason}; ${match.rankReason}`,
    });
  }

  return [...byId.values()]
    .sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function uniqueSymbolMatches(matches: RuntimeSymbolMatch[]): RuntimeSymbolMatch[] {
  return matches.filter((match, index, candidates) => candidates.findIndex((candidate) => candidate.entryId === match.entryId) === index);
}

function vectorCandidateMinScore(input: RetrieveDreamEvidenceInput): number {
  const value = input.vectorCandidateMinScore;

  return typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_VECTOR_CANDIDATE_MIN_SCORE;
}

function vectorCandidateWithExplicitMinScore(input: RetrieveDreamEvidenceInput): number {
  const value = input.vectorCandidateWithExplicitMinScore;

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : DEFAULT_VECTOR_CANDIDATE_WITH_EXPLICIT_MIN_SCORE;
}

function semanticPromotionMinConfidence(input: RetrieveDreamEvidenceInput): number {
  const value = input.semanticPromotionMinConfidence;

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : DEFAULT_SEMANTIC_PROMOTION_MIN_CONFIDENCE;
}

function vectorPromotionMinScore(input: RetrieveDreamEvidenceInput): number {
  const value = input.vectorPromotionMinScore;

  return typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_VECTOR_PROMOTION_MIN_SCORE;
}

function semanticCandidateLimit(input: RetrieveDreamEvidenceInput): number {
  const value = input.semanticCandidateLimit;

  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : DEFAULT_SEMANTIC_CANDIDATE_LIMIT;
}

function vectorNewSymbolLimit(input: RetrieveDreamEvidenceInput): number {
  const value = input.vectorNewSymbolLimit;

  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : DEFAULT_VECTOR_NEW_SYMBOL_LIMIT;
}

function isMeaningfulSemanticCandidateTerm(term: string): boolean {
  const key = compact(term);

  return key.length >= 2 && !weakSemanticCandidateTerms.has(key);
}

function isStrongSemanticChunkCandidate(match: RuntimeSymbolMatch): boolean {
  const meaningfulTerms = unique(match.matchedText.filter(isMeaningfulSemanticCandidateTerm));
  const hasGroundedChunk = match.usedFields.some((field) =>
    ["chunks.searchText", "chunks.safeReading"].includes(field) || field.startsWith("chunks.sceneModifier."),
  );

  return hasGroundedChunk && meaningfulTerms.length >= 2;
}

function promotionEligibleSemanticChunkCandidate(
  match: RuntimeSymbolMatch,
  input: RetrieveDreamEvidenceInput,
): boolean {
  return (
    match.entry.safetyLevel === "safe" &&
    isStrongSemanticChunkCandidate(match) &&
    match.confidence >= semanticPromotionMinConfidence(input)
  );
}

function promotionEligibleVectorCandidate(
  match: RuntimeSymbolMatch,
  input: RetrieveDreamEvidenceInput,
): boolean {
  return match.entry.safetyLevel === "safe" && match.confidence >= vectorPromotionMinScore(input);
}

function promoteSemanticVectorAgreement(
  semanticCandidates: RuntimeSymbolMatch[],
  vectorCandidates: RuntimeSymbolMatch[],
  input: RetrieveDreamEvidenceInput,
  limit: number,
): RuntimeSymbolMatch[] {
  const eligibleVectorIds = new Set(
    vectorCandidates
      .filter((match) => promotionEligibleVectorCandidate(match, input))
      .map((match) => match.entryId),
  );
  const promotableSemanticCandidates = semanticCandidates.filter(
    (match) => eligibleVectorIds.has(match.entryId) && promotionEligibleSemanticChunkCandidate(match, input),
  );
  const promotableIds = new Set(promotableSemanticCandidates.map((match) => match.entryId));
  const promotableVectorCandidates = vectorCandidates.filter((match) => promotableIds.has(match.entryId));

  return mergeMatches([], promotableSemanticCandidates, promotableVectorCandidates, limit).map((match) => ({
    ...match,
    rankReason: `${match.rankReason}; promoted by semantic/vector agreement`,
  }));
}

export function retrieveDreamEvidenceSet(input: RetrieveDreamEvidenceInput): DreamEvidenceSet {
  const locale = input.locale ?? "ko";
  const limit = input.limit ?? 5;
  const explicitMatches = findRuntimeSymbolMatches(input.dreamText, {
    locale,
    limit,
    ...(input.lemmas ? { lemmas: input.lemmas } : {}),
  });
  const explicitIds = new Set(explicitMatches.map((match) => match.entryId));
  const queryTokens = usefulTokens(queryTextFrom(input));
  const rawChunkMatches = input.includeChunkMatches === false
    ? []
    : groupChunkCandidates(
        buildDreamRagChunks(locale)
          .map((chunk) => scoreChunk(chunk, queryTokens))
          .filter((candidate): candidate is ChunkCandidate => Boolean(candidate)),
      )
        .slice(0, limit * 2)
        .map((group) => chunkGroupToRuntimeMatch(group, locale));
  const supportingChunkMatches = rawChunkMatches.filter((match) => explicitIds.has(match.entryId));
  const candidateChunkMatches = rawChunkMatches
    .filter((match) => !explicitIds.has(match.entryId))
    .filter(isStrongSemanticChunkCandidate)
    .slice(0, semanticCandidateLimit(input));
  const vectorMatches = (input.vectorMatches ?? [])
    .filter((match) => match.locale === locale)
    .map((match) => vectorResultToRuntimeMatch(match, locale));
  const supportingVectorMatches = vectorMatches.filter((match) => explicitIds.has(match.entryId));
  const candidateVectorMinScore = explicitIds.size > 0
    ? Math.max(vectorCandidateMinScore(input), vectorCandidateWithExplicitMinScore(input))
    : vectorCandidateMinScore(input);
  const candidateVectorMatches = uniqueSymbolMatches(vectorMatches)
    .filter((match) => !explicitIds.has(match.entryId))
    .filter((match) => match.confidence >= candidateVectorMinScore)
    .slice(0, vectorNewSymbolLimit(input));
  const promotedMatches = promoteSemanticVectorAgreement(
    candidateChunkMatches,
    candidateVectorMatches,
    input,
    limit,
  );
  const confirmedEvidence = mergeMatches(
    explicitMatches,
    [...supportingChunkMatches, ...promotedMatches],
    supportingVectorMatches,
    limit,
  );
  const candidateEvidence = mergeMatches([], candidateChunkMatches, candidateVectorMatches, limit)
    .filter((match) => !confirmedEvidence.some((confirmed) => confirmed.entryId === match.entryId));

  return {
    confirmedEvidence,
    candidateEvidence,
    retrievalPolicy,
  };
}

export function retrieveDreamEvidence(input: RetrieveDreamEvidenceInput): RuntimeSymbolMatch[] {
  return retrieveDreamEvidenceSet(input).confirmedEvidence;
}

export async function retrieveDreamEvidenceSetWithVectorIndex(
  input: RetrieveDreamEvidenceWithVectorIndexInput,
): Promise<DreamEvidenceSet> {
  const locale = input.locale ?? "ko";
  const limit = input.limit ?? 5;
  const [queryEmbedding] = await input.embeddingProvider.embedTexts([queryTextFrom(input)]);
  const vectorMatches = queryEmbedding
    ? searchDreamVectorIndex(input.vectorIndex, queryEmbedding, {
        limit: input.vectorLimit ?? limit * 3,
        minScore: input.vectorMinScore ?? 0.35,
      })
    : [];

  return retrieveDreamEvidenceSet({
    ...input,
    locale,
    vectorMatches: [...(input.vectorMatches ?? []), ...vectorMatches],
  });
}

export async function retrieveDreamEvidenceWithVectorIndex(
  input: RetrieveDreamEvidenceWithVectorIndexInput,
): Promise<RuntimeSymbolMatch[]> {
  return (await retrieveDreamEvidenceSetWithVectorIndex(input)).confirmedEvidence;
}
