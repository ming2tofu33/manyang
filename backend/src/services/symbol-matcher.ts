import { encyclopediaEntries } from "../data/encyclopedia.js";
import type { EncyclopediaEntry } from "../contracts/dream.js";

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
