import type { EncyclopediaEntry, RuntimeSymbolEntry } from "@manyang/backend";

export type EncyclopediaSearchMainCategory = EncyclopediaEntry["category"] | RuntimeSymbolEntry["category"];
export type EncyclopediaSearchCategory = "all" | EncyclopediaSearchMainCategory;

export type EncyclopediaSearchEntry = Pick<EncyclopediaEntry, "symbol" | "slug"> & {
  category: EncyclopediaSearchMainCategory;
  aliases?: readonly string[];
  coreMeanings?: readonly string[];
  positiveReadings?: readonly string[];
  negativeReadings?: readonly string[];
  contextQuestions?: readonly string[];
  relatedSymbols?: readonly string[];
  catInterpretationHint?: string;
  body?: string;
  searchText?: string;
};

export const encyclopediaCategoryLabelMap: Record<EncyclopediaSearchMainCategory, string> = {
  place: "장소",
  person: "사람",
  animal: "동물",
  nature: "자연",
  object: "사물",
  body: "몸",
  action: "행동",
  event: "사건",
  food: "음식",
  emotion: "감정",
  abstract: "추상",
};

const categoryDisplayOrder: EncyclopediaSearchMainCategory[] = [
  "place",
  "person",
  "animal",
  "nature",
  "object",
  "body",
  "action",
  "event",
  "food",
  "emotion",
  "abstract",
];

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchValue(value: string): string {
  return normalizeSearchValue(value).replace(/\s/g, "");
}

export function getEncyclopediaCategoryLabel(category: EncyclopediaSearchMainCategory): string {
  return encyclopediaCategoryLabelMap[category];
}

export function getEncyclopediaCategoryTabs(entries: readonly EncyclopediaSearchEntry[]): EncyclopediaSearchCategory[] {
  const usedCategories = new Set(entries.map((entry) => entry.category));

  return ["all", ...categoryDisplayOrder.filter((category) => usedCategories.has(category))];
}

export function buildEncyclopediaSearchText(entry: EncyclopediaSearchEntry): string {
  return [
    entry.symbol,
    entry.slug,
    getEncyclopediaCategoryLabel(entry.category),
    ...(entry.aliases ?? []),
    ...(entry.coreMeanings ?? []),
    ...(entry.positiveReadings ?? []),
    ...(entry.negativeReadings ?? []),
    ...(entry.contextQuestions ?? []),
    ...(entry.relatedSymbols ?? []),
    entry.catInterpretationHint,
    entry.body,
    entry.searchText,
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterEncyclopediaSearchEntries<TEntry extends EncyclopediaSearchEntry>(
  entries: readonly TEntry[],
  options: {
    query: string;
    category: EncyclopediaSearchCategory;
  },
): TEntry[] {
  const normalizedQuery = normalizeSearchValue(options.query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return entries.filter((entry) => {
    if (options.category !== "all" && entry.category !== options.category) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = normalizeSearchValue(buildEncyclopediaSearchText(entry));
    const compactSearchText = compactSearchValue(searchText);
    const compactQuery = compactSearchValue(normalizedQuery);

    return searchText.includes(normalizedQuery) || compactSearchText.includes(compactQuery) || queryTokens.every((token) => searchText.includes(token));
  });
}
