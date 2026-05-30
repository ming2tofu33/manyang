export type RetrievalMatchType = "exact" | "alias" | "keyword" | "semantic" | "related" | "fallback";
export type RetrievalCandidateSource = "explicit" | "inferred";
export type RetrievalGroup = "primary" | "supporting" | "excluded";

export type RetrievalScoreInput = {
  matchType: RetrievalMatchType;
  source: RetrievalCandidateSource;
  importance: 1 | 2 | 3 | 4 | 5;
  hasEvidenceText: boolean;
  hasSceneModifier: boolean;
  localeMatches: boolean;
  selectedMoodMatches?: boolean;
  repeatedSymbolBoost?: number;
  isSensitiveDuringSafetySignal?: boolean;
  isOverBroad?: boolean;
};

export const MATCH_TYPE_BASE_SCORES: Record<RetrievalMatchType, number> = {
  exact: 1,
  alias: 0.92,
  keyword: 0.72,
  semantic: 0.62,
  related: 0.48,
  fallback: 0.32,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function importanceBoost(importance: RetrievalScoreInput["importance"]): number {
  if (importance === 5) {
    return 0.08;
  }

  if (importance === 4) {
    return 0.04;
  }

  return 0;
}

function capByMatchType(confidence: number, input: RetrievalScoreInput): number {
  const { matchType } = input;

  if (matchType === "exact") {
    return Math.min(confidence, input.hasSceneModifier ? 0.98 : 0.96);
  }

  if (matchType === "alias") {
    return Math.min(confidence, input.hasSceneModifier ? 0.94 : 0.9);
  }

  if (matchType === "keyword") {
    return Math.min(confidence, 0.9);
  }

  if (matchType === "semantic") {
    return Math.min(confidence, 0.86);
  }

  if (matchType === "related") {
    return Math.min(confidence, 0.74);
  }

  return Math.min(confidence, 0.7);
}

export function scoreRetrievalCandidate(input: RetrievalScoreInput): number {
  const rawScore =
    MATCH_TYPE_BASE_SCORES[input.matchType] +
    (input.source === "explicit" ? 0.12 : 0) +
    (input.hasSceneModifier ? 0.1 : 0) +
    importanceBoost(input.importance) +
    (input.selectedMoodMatches ? 0.03 : 0) +
    (input.localeMatches ? 0.04 : 0) +
    clamp(input.repeatedSymbolBoost ?? 0, 0, 0.08) -
    (input.source === "inferred" ? 0.1 : 0) -
    (input.hasEvidenceText ? 0 : 0.18) -
    (input.isSensitiveDuringSafetySignal ? 0.05 : 0) -
    (input.isOverBroad ? 0.08 : 0);

  const confidence = capByMatchType(clamp(rawScore), input);

  return Number(confidence.toFixed(2));
}

export function classifyRetrievalMatch(input: {
  confidence: number;
  matchType: RetrievalMatchType;
}): RetrievalGroup {
  if (input.matchType === "fallback") {
    return "excluded";
  }

  if (input.confidence >= 0.82) {
    return "primary";
  }

  if (input.confidence >= 0.62) {
    return "supporting";
  }

  return "excluded";
}
