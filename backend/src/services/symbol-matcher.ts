import { encyclopediaEntries } from "../data/encyclopedia";
import { getRuntimeSymbolEntries } from "../data/symbol-encyclopedia";
import type { EncyclopediaEntry } from "../contracts/dream";
import type { RuntimeSymbolEntry, SupportedLocale, SymbolCategory, SymbolRole } from "../contracts/symbol-encyclopedia";
import type { RetrievalMatchType } from "./retrieval-scoring";
import { scoreRetrievalCandidate } from "./retrieval-scoring";

export type SymbolMatch = {
  entry: EncyclopediaEntry;
  matchedAliases: string[];
  score: number;
};

export type SymbolMatchOptions = {
  limit?: number;
};

const allowedSuffixes = [
  "이",
  "가",
  "을",
  "를",
  "은",
  "는",
  "도",
  "에",
  "에서",
  "에게",
  "와",
  "과",
  "로",
  "으로",
  "처럼",
  "만",
  "부터",
  "까지",
  "마다",
  "앞",
  "뒤",
  "안",
  "속",
  "길",
  "고",
  "던",
  "들",
  "들이",
  "들을",
  "들과",
  "들하고",
  "들에",
  "다",
  "요",
  "어요",
  "아요",
  "었어요",
  "였어요",
  "었고",
  "였고",
  "는데",
  "면서",
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function compact(text: string): string {
  return normalize(text).replace(/[^가-힣a-z0-9]/gi, "");
}

function tokenize(text: string): string[] {
  return normalize(text).match(/[가-힣a-z0-9]+/gi) ?? [];
}

function isTokenMatch(alias: string, token: string): boolean {
  if (token === alias) {
    return true;
  }

  if (!token.startsWith(alias)) {
    return false;
  }

  const suffix = token.slice(alias.length);

  return allowedSuffixes.some((allowedSuffix) => suffix === allowedSuffix);
}

function aliasMatches(alias: string, tokens: string[], compactText: string): boolean {
  const normalizedAlias = normalize(alias);

  if (normalizedAlias.includes(" ")) {
    return compactText.includes(compact(normalizedAlias));
  }

  return tokens.some((token) => isTokenMatch(normalizedAlias, token));
}

export function findMatchingSymbols(text: string, options: SymbolMatchOptions = {}): SymbolMatch[] {
  const tokens = tokenize(text);
  const compactText = compact(text);
  const limit = options.limit ?? 5;

  return encyclopediaEntries
    .map((entry, index) => {
      const aliases = [entry.symbol, ...entry.aliases];
      const matchedAliases = [...new Set(aliases.filter((alias) => aliasMatches(alias, tokens, compactText)))];
      const score = matchedAliases.reduce((total, alias) => total + compact(alias).length, 0) + (matchedAliases.includes(entry.symbol) ? 3 : 0);

      return { entry, matchedAliases, score, index };
    })
    .filter((match) => match.matchedAliases.length > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ entry, matchedAliases, score }) => ({ entry, matchedAliases, score }));
}

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
};

function sceneModifierMatches(entry: RuntimeSymbolEntry, tokens: string[], compactText: string): string[] {
  return Object.entries(entry.evidence.sceneModifiers)
    .filter(([, modifier]) =>
      modifier.triggerTerms.some((triggerTerm) => aliasMatches(triggerTerm, tokens, compactText) || compactText.includes(compact(triggerTerm))),
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
  const tokens = tokenize(text);
  const compactText = compact(text);

  return getRuntimeSymbolEntries(locale)
    .flatMap((entry, index): Array<RuntimeSymbolMatch & { index: number }> => {
      const aliases = [entry.label, ...entry.aliases];
      const matchedText = [...new Set(aliases.filter((alias) => aliasMatches(alias, tokens, compactText)))];
      const modifierKeys = sceneModifierMatches(entry, tokens, compactText);

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
