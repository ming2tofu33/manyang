import { getRuntimeSymbolEntries } from "../data/symbol-encyclopedia";
import type { RuntimeSymbolEntry, SupportedLocale, SymbolCategory, SymbolRole } from "../contracts/symbol-encyclopedia";
import type { RetrievalMatchType } from "./retrieval-scoring";
import { scoreRetrievalCandidate } from "./retrieval-scoring";
import {
  matchedTerms,
  normalizeText,
  tokenizeText as tokenize,
  triggerMatchesText,
} from "./korean-text-matching";

export type RuntimeSymbolMatch = {
  entryId: string;
  entry: RuntimeSymbolEntry;
  locale: SupportedLocale;
  label: string;
  category: SymbolCategory;
  subcategory: string;
  facets: string[];
  symbolRole: SymbolRole[];
  matchType: RetrievalMatchType;
  confidence: number;
  matchedText: string[];
  usedFields: string[];
  rankReason: string;
  evidence: RuntimeSymbolEntry["evidence"];
};

export type RuntimeSymbolMatchOptions = {
  locale?: SupportedLocale;
  limit?: number;
  /** 형태소 분석기가 돌려준 어간 목록(있으면 토큰에 합쳐 활용형 매칭을 보강한다). */
  lemmas?: string[];
};

function sceneModifierMatches(entry: RuntimeSymbolEntry, normalizedText: string, tokens: string[]): string[] {
  return Object.entries(entry.evidence.sceneModifiers)
    .filter(([, modifier]) =>
      modifier.triggerTerms.some((triggerTerm) => triggerMatchesText(triggerTerm, normalizedText, tokens)),
    )
    .map(([key]) => key);
}

function rankReasonFor(matchType: RetrievalMatchType, matchedText: string[], modifierKeys: string[]): string {
  const matchDescription =
    matchType === "exact"
      ? "exact match"
      : matchType === "alias"
        ? "alias match"
        : `${matchType} match`;
  const evidenceDescription = matchedText.length > 0 ? ` on ${matchedText.slice(0, 3).join(", ")}` : "";
  const modifierDescription = modifierKeys.length > 0 ? ` with scene modifier ${modifierKeys.join(", ")}` : "";

  return `${matchDescription}${evidenceDescription}${modifierDescription}`;
}

export function findRuntimeSymbolMatches(text: string, options: RuntimeSymbolMatchOptions = {}): RuntimeSymbolMatch[] {
  const locale = options.locale ?? "ko";
  const limit = options.limit ?? 5;
  const tokens = [...tokenize(text), ...(options.lemmas ?? []).map(normalizeText)];
  const normalizedText = normalizeText(text);

  return getRuntimeSymbolEntries(locale)
    .flatMap((entry, index): Array<RuntimeSymbolMatch & { index: number }> => {
      const aliases = [entry.label, ...entry.aliases];
      const matchedText = matchedTerms(aliases, normalizedText, tokens);
      const modifierKeys = sceneModifierMatches(entry, normalizedText, tokens);

      if (matchedText.length === 0) {
        return [];
      }

      const matchType: RetrievalMatchType = matchedText.includes(entry.label) ? "exact" : "alias";
      const confidence = scoreRetrievalCandidate({
        matchType,
        source: "explicit",
        importance: modifierKeys.length > 0 ? 5 : 4,
        hasEvidenceText: matchedText.length > 0,
        hasSceneModifier: modifierKeys.length > 0,
        localeMatches: true,
      });
      const usedFields = ["aliases", ...modifierKeys.map((key) => `sceneModifiers.${key}`)];

      return [{
        entryId: entry.id,
        entry,
        locale,
        label: entry.label,
        category: entry.category,
        subcategory: entry.subcategory,
        facets: entry.facets,
        symbolRole: entry.symbolRole,
        matchType,
        confidence,
        matchedText,
        usedFields,
        rankReason: rankReasonFor(matchType, matchedText, modifierKeys),
        evidence: entry.evidence,
        index,
      }];
    })
    .sort((left, right) => right.confidence - left.confidence || left.index - right.index)
    .slice(0, limit)
    .map(({ index: _index, ...match }) => match);
}
