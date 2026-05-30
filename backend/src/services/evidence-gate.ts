import type { DreamSafetyPolicyResult } from "./dream-safety-policy";
import type { StructuredDreamAnalysis, SymbolCandidate } from "./structured-dream-analysis";
import type { RuntimeSymbolMatch } from "./symbol-matcher";

export type VerifiedEvidenceSymbol = {
  id: string;
  label: string;
  aliases: string[];
  matchedText: string[];
};

export type EvidenceGateResult = {
  verifiedSymbols: VerifiedEvidenceSymbol[];
  unverifiedSceneElements: string[];
  evidenceRules: {
    canInterpretSymbolically: string[];
    sceneOnly: string[];
  };
};

export type EvidenceGateInput = {
  structuredAnalysis: StructuredDreamAnalysis;
  matches: RuntimeSymbolMatch[];
  candidateMatches?: RuntimeSymbolMatch[] | undefined;
  safetyPolicy?: DreamSafetyPolicyResult;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function compact(value: string): string {
  return normalize(value).replace(/[^\p{L}\p{N}]/gu, "");
}

function uniqueByNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = compact(trimmed);

    if (!trimmed || !key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function candidateTerms(candidate: SymbolCandidate): string[] {
  return uniqueByNormalized([
    candidate.text,
    candidate.normalizedText,
    candidate.evidenceText,
    ...(candidate.candidateId ? [candidate.candidateId] : []),
  ]);
}

function verifiedTermSet(matches: RuntimeSymbolMatch[]): Set<string> {
  return new Set(matches.flatMap(verifiedTermsForMatch).map(compact));
}

function isSymbolIdentityTerm(term: string, match: RuntimeSymbolMatch): boolean {
  const key = compact(term);

  if (!key) {
    return false;
  }

  return [match.entryId, match.label, ...match.entry.aliases].some((identityTerm) => compact(identityTerm) === key);
}

function verifiedMatchedText(match: RuntimeSymbolMatch): string[] {
  return uniqueByNormalized(match.matchedText.filter((term) => isSymbolIdentityTerm(term, match)));
}

function verifiedTermsForMatch(match: RuntimeSymbolMatch): string[] {
  return [
    match.entryId,
    match.label,
    ...match.entry.aliases,
    ...verifiedMatchedText(match),
  ];
}

function isVerifiedTerm(term: string, verifiedTerms: Set<string>): boolean {
  const key = compact(term);

  return Boolean(key) && verifiedTerms.has(key);
}

function sceneOnlyTermsFromCandidates(candidates: SymbolCandidate[], verifiedTerms: Set<string>): string[] {
  return candidates
    .filter((candidate) => !candidate.candidateId || !isVerifiedTerm(candidate.candidateId, verifiedTerms))
    .flatMap(candidateTerms)
    .filter((term) => !isVerifiedTerm(term, verifiedTerms));
}

function sceneOnlyTermsFromSafety(policy: DreamSafetyPolicyResult | undefined, verifiedTerms: Set<string>): string[] {
  return (policy?.risks ?? [])
    .flatMap((risk) => risk.evidenceTerms)
    .filter((term) => !isVerifiedTerm(term, verifiedTerms));
}

function sceneOnlyTermsFromCandidateMatches(matches: RuntimeSymbolMatch[] | undefined, verifiedTerms: Set<string>): string[] {
  return (matches ?? [])
    .flatMap((match) => [match.entryId, match.label, ...verifiedMatchedText(match)])
    .filter((term) => !isVerifiedTerm(term, verifiedTerms));
}

export function buildEvidenceGate(input: EvidenceGateInput): EvidenceGateResult {
  const verifiedTerms = verifiedTermSet(input.matches);
  const verifiedSymbols = input.matches.map<VerifiedEvidenceSymbol>((match) => ({
    id: match.entryId,
    label: match.label,
    aliases: match.entry.aliases,
    matchedText: verifiedMatchedText(match),
  }));
  const unverifiedSceneElements = uniqueByNormalized([
    ...sceneOnlyTermsFromCandidates(input.structuredAnalysis.symbolCandidates, verifiedTerms),
    ...sceneOnlyTermsFromCandidateMatches(input.candidateMatches, verifiedTerms),
    ...sceneOnlyTermsFromSafety(input.safetyPolicy, verifiedTerms),
  ]);

  return {
    verifiedSymbols,
    unverifiedSceneElements,
    evidenceRules: {
      canInterpretSymbolically: verifiedSymbols.map((symbol) => symbol.label),
      sceneOnly: unverifiedSceneElements,
    },
  };
}

export function isVerifiedSymbolLabel(symbol: string, evidenceGate: EvidenceGateResult): boolean {
  const key = compact(symbol);

  if (!key) {
    return false;
  }

  return evidenceGate.verifiedSymbols.some((verifiedSymbol) =>
    [
      verifiedSymbol.id,
      verifiedSymbol.label,
      ...verifiedSymbol.aliases,
      ...verifiedSymbol.matchedText,
    ].some((term) => compact(term) === key),
  );
}
