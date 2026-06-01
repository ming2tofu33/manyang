import { getRuntimeSymbolEntries } from "../data/symbol-encyclopedia";
import type { RuntimeSymbolEntry, SupportedLocale, SymbolCategory } from "../contracts/symbol-encyclopedia";
import {
  compactText as compact,
  matchedTerms,
  matchedTriggers,
  normalizeText as normalize,
  tokenizeText as tokenize,
} from "./korean-text-matching";

export type StructuredDreamAnalysisRequest = {
  dreamText: string;
  dreamDate?: string;
  wakeMood?: string;
  dreamMood?: string;
  dreamAtmospheres?: string[];
  dreamSensations?: string[];
  dreamSensationOther?: string;
  /** 형태소 분석기가 돌려준 어간 목록(있으면 토큰에 합쳐 매칭 정확도를 높인다). */
  lemmas?: string[];
  locale?: SupportedLocale;
};

export type SymbolCandidate = {
  text: string;
  normalizedText: string;
  candidateId?: string;
  type: SymbolCategory;
  evidenceText: string;
  roleInDream: string;
  source: "explicit" | "inferred";
  importance: 1 | 2 | 3 | 4 | 5;
  confidence: number;
};

export type SelectedMood = {
  source: "wakeMood" | "dreamMood";
  value: string;
};

export type EmotionSignal = {
  label: string;
  source: "text" | "selectedMood";
  evidenceText?: string;
  confidence: number;
};

export type ThemeSignal = {
  label: string;
  evidenceText?: string;
  confidence: number;
};

export type SafetySignal = {
  type: "none" | "distress" | "crisis" | "medicalOrDiagnostic" | "violence" | "sexualContent";
  severity: "low" | "medium" | "high";
  evidenceText?: string;
};

export type StructuredDreamAnalysis = {
  normalizedText: string;
  summary: string;
  sceneFacts: string[];
  symbolCandidates: SymbolCandidate[];
  literalQueries: string[];
  sceneQueries: string[];
  themeQueries: string[];
  modifierQueries: string[];
  selectedMoods: SelectedMood[];
  /** 사용자가 명시적으로 고른 분위기 정서(현지화 라벨). 작은 처방의 정서 앵커로 쓰인다. */
  selectedAtmosphereLabels: string[];
  /** 사용자가 명시적으로 고른 감각(현지화 라벨). 작은 처방·행동의 단서로 쓰인다. */
  selectedSensationLabels: string[];
  inferredEmotions: EmotionSignal[];
  themes: ThemeSignal[];
  safetySignals: SafetySignal[];
  /** 심볼별 길흉 판정. lean=both면 양면 제시, cautious면 부드러운 환기만. */
  fortuneReadings: FortuneReading[];
  /** 전달 톤(분위기+감각 valence). omen은 안 바꾸고 색만 입힌다. */
  readingTone: "warm" | "heavy" | "neutral";
  /** 확신도(vivid/hazy 등). low면 단정 말고 양면으로 기운다. */
  readingCertainty: "high" | "normal" | "low";
  language: SupportedLocale;
};

export type FortuneReading = {
  symbolId: string;
  label: string;
  lean: "auspicious" | "cautious" | "both";
  auspicious: string;
  cautious?: string;
};

// 분위기 옵션 id → 정서 라벨(현지화). frontend/src/lib/dream-entry-options.ts와 동기화.
const ATMOSPHERE_EMOTION: Record<string, { ko: string; en: string }> = {
  calm: { ko: "평온함", en: "calm" },
  warm: { ko: "따뜻함", en: "warmth" },
  excited: { ko: "설렘", en: "excitement" },
  wistful: { ko: "그리움", en: "longing" },
  sad: { ko: "슬픔", en: "sadness" },
  lonely: { ko: "쓸쓸함", en: "loneliness" },
  anxious: { ko: "불안함", en: "anxiety" },
  fearful: { ko: "두려움", en: "fear" },
  stifling: { ko: "답답함", en: "feeling stifled" },
  unfamiliar: { ko: "낯섦", en: "unfamiliarity" },
  eerie: { ko: "묘함", en: "eeriness" },
  mystical: { ko: "신비함", en: "mystery" },
  hazy: { ko: "흐릿함", en: "haziness" },
  complex: { ko: "복잡함", en: "complexity" },
  unpleasant: { ko: "불쾌함", en: "discomfort" },
  // Deprecated ids kept so older saved drafts still produce meaningful labels.
  angry: { ko: "분노", en: "anger" },
  ashamed: { ko: "부끄러움", en: "shame" },
  confused: { ko: "혼란", en: "confusion" },
};

// 감각 옵션 id → 감각 라벨(현지화) + 연결되는 KB 심볼(약한 검색 신호용).
const SENSATION_SIGNAL: Record<string, { ko: string; en: string; symbolQuery?: { ko: string; en: string } }> = {
  vivid: { ko: "선명함", en: "vividness" },
  hazy: { ko: "흐릿함", en: "haziness" },
  heavy: { ko: "무거움", en: "heaviness" },
  stuck: { ko: "갇힌 느낌", en: "feeling stuck" },
  falling: { ko: "떨어지는 느낌", en: "falling", symbolQuery: { ko: "떨어지는", en: "falling" } },
  floating: { ko: "떠다니는 느낌", en: "floating", symbolQuery: { ko: "떠다니는", en: "flying" } },
  chased: { ko: "쫓기는 느낌", en: "being chased", symbolQuery: { ko: "쫓기는", en: "chased" } },
  cold: { ko: "차가움", en: "coldness" },
  warmth: { ko: "온기", en: "warmth" },
};

function localizedLabelsFor(
  ids: string[] | undefined,
  table: Record<string, { ko: string; en: string }>,
  locale: SupportedLocale,
): string[] {
  return unique((ids ?? []).flatMap((id) => (table[id] ? [table[id][locale]] : [])));
}

// 톤(전달 분위기)용 valence. omen은 안 바꾸고 색만 입힌다.
const ATMOSPHERE_TONE: Record<string, "positive" | "negative"> = {
  calm: "positive",
  warm: "positive",
  excited: "positive",
  mystical: "positive",
  anxious: "negative",
  fearful: "negative",
  sad: "negative",
  lonely: "negative",
  angry: "negative",
  ashamed: "negative",
  stifling: "negative",
  complex: "negative",
  unpleasant: "negative",
};
const SENSATION_TONE: Record<string, "positive" | "negative"> = {
  warmth: "positive",
  floating: "positive",
  heavy: "negative",
  stuck: "negative",
  chased: "negative",
  cold: "negative",
  falling: "negative",
};
// 확신도를 낮추는(양면으로 끄는) 신호.
const LOW_CERTAINTY_ATMOSPHERES = new Set(["confused", "eerie", "unfamiliar", "hazy", "complex"]);

function countToneSignals(
  atmosphereIds: string[] | undefined,
  sensationIds: string[] | undefined,
): { positive: number; negative: number } {
  let positive = 0;
  let negative = 0;
  for (const id of atmosphereIds ?? []) {
    if (ATMOSPHERE_TONE[id] === "positive") positive += 1;
    if (ATMOSPHERE_TONE[id] === "negative") negative += 1;
  }
  for (const id of sensationIds ?? []) {
    if (SENSATION_TONE[id] === "positive") positive += 1;
    if (SENSATION_TONE[id] === "negative") negative += 1;
  }
  return { positive, negative };
}

function resolveReadingTone(
  atmosphereIds: string[] | undefined,
  sensationIds: string[] | undefined,
): "warm" | "heavy" | "neutral" {
  const { positive, negative } = countToneSignals(atmosphereIds, sensationIds);
  if (negative > positive) return "heavy";
  if (positive > negative) return "warm";
  return "neutral";
}

function resolveReadingCertainty(
  atmosphereIds: string[] | undefined,
  sensationIds: string[] | undefined,
): "high" | "normal" | "low" {
  const sensations = sensationIds ?? [];
  const lowFromAtmosphere = (atmosphereIds ?? []).some((id) => LOW_CERTAINTY_ATMOSPHERES.has(id));
  if (sensations.includes("hazy") || lowFromAtmosphere) return "low";
  if (sensations.includes("vivid")) return "high";
  return "normal";
}

// (A) 원칙: omen은 오직 장면 단서(scene modifier valence)로만 정한다. 단서 없으면 양면.
function resolveSymbolLean(match: MatchedSymbol): "auspicious" | "cautious" | "both" {
  const fortune = match.entry.evidence.fortune;
  if (fortune?.valence === "auspicious") {
    return "auspicious";
  }
  const valences = match.matchedModifiers.flatMap((modifier) => {
    const valence = match.entry.evidence.sceneModifiers[modifier.key]?.fortuneValence;
    return valence ? [valence] : [];
  });
  const hasAuspicious = valences.includes("auspicious");
  const hasCautious = valences.includes("cautious");
  if (hasAuspicious && !hasCautious) return "auspicious";
  if (hasCautious && !hasAuspicious) return "cautious";
  return "both";
}

function resolveFortuneReadings(matchedSymbols: MatchedSymbol[]): FortuneReading[] {
  return matchedSymbols.flatMap((match) => {
    const fortune = match.entry.evidence.fortune;
    if (!fortune) {
      return [];
    }
    return [
      {
        symbolId: match.entry.id,
        label: match.entry.label,
        lean: resolveSymbolLean(match),
        auspicious: fortune.auspicious,
        ...(fortune.cautious ? { cautious: fortune.cautious } : {}),
      },
    ];
  });
}

type MatchedModifier = {
  key: string;
  matchedTerms: string[];
  weight: number;
};

type MatchedSymbol = {
  entry: RuntimeSymbolEntry;
  matchedAliases: string[];
  matchedModifiers: MatchedModifier[];
  index: number;
};


const ENGLISH_SCENE_STOP_WORDS = new Set([
  "about",
  "across",
  "after",
  "again",
  "being",
  "beside",
  "could",
  "dream",
  "dreamed",
  "during",
  "every",
  "felt",
  "from",
  "have",
  "into",
  "just",
  "like",
  "mean",
  "more",
  "over",
  "really",
  "scene",
  "something",
  "that",
  "there",
  "this",
  "while",
  "with",
  "were",
  "what",
  "when",
  "where",
  "would",
]);

const LEGACY_MODIFIER_QUERY_BY_SYMBOL_MODIFIER: Record<string, string[]> = {
  "snake:large": ["largeSnake"],
  "snake:many": ["manySnakes"],
  "owned_land:filledWithAnimals": ["ownedLand"],
  "many:manyAnimals": ["manySnakes"],
  "door:changing": ["changingDoor"],
};

const LEGACY_SYMBOL_MODIFIER_QUERY: Record<string, string[]> = {
  dawn: ["dawn"],
  owned_land: ["ownedLand"],
};

const LEGACY_THEME_BY_SYMBOL: Record<string, { ko: string; en: string }> = {
  snake: { ko: "생명력", en: "life force" },
  owned_land: { ko: "영역", en: "territory" },
  many: { ko: "압도감", en: "overwhelm" },
};

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value.toLocaleLowerCase()));
}

function matchedModifiers(entry: RuntimeSymbolEntry, normalizedText: string, tokens: string[]): MatchedModifier[] {
  return Object.entries(entry.evidence.sceneModifiers)
    .map(([key, modifier]) => ({
      key,
      weight: modifier.weight,
      matchedTerms: matchedTriggers(modifier.triggerTerms, normalizedText, tokens),
    }))
    .filter((modifier) => modifier.matchedTerms.length > 0);
}

function findMatchedSymbols(text: string, locale: SupportedLocale, lemmas: string[] = []): MatchedSymbol[] {
  const normalizedText = normalize(text);
  // 형태소 분석기가 준 어간을 토큰에 합친다("올라갔어"가 안 잡혀도 어간 "올라가"로 잡히게).
  const tokens = unique([...tokenize(text), ...lemmas.map(normalize)]);

  return getRuntimeSymbolEntries(locale)
    .map((entry, index): MatchedSymbol => {
      const aliases = [...entry.aliases, entry.label];

      return {
        entry,
        matchedAliases: matchedTerms(aliases, normalizedText, tokens),
        matchedModifiers: matchedModifiers(entry, normalizedText, tokens),
        index,
      };
    })
    .filter(
      (match) =>
        match.matchedAliases.length > 0 ||
        (match.matchedModifiers.length > 0 && match.entry.symbolRole.some((role) => role !== "primary_candidate")),
    )
    .sort((left, right) => {
      const leftImportance = symbolImportance(left.entry, left.matchedModifiers);
      const rightImportance = symbolImportance(right.entry, right.matchedModifiers);

      return rightImportance - leftImportance || confidenceFor(right) - confidenceFor(left) || left.index - right.index;
    });
}

function clampImportance(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function symbolImportance(entry: RuntimeSymbolEntry, modifiers: MatchedModifier[]): 1 | 2 | 3 | 4 | 5 {
  const base =
    entry.subcategory === "day_phase"
      ? 2
      : entry.subcategory === "intensity"
        ? 4
        : entry.symbolRole.includes("primary_candidate")
          ? 4
          : 3;

  return clampImportance(base + (modifiers.length > 0 ? 1 : 0));
}

function confidenceFor(match: MatchedSymbol): number {
  const labelMatched = match.matchedAliases.some((term) => compact(term) === compact(match.entry.label));
  const aliasScore = labelMatched ? 0.86 : match.matchedAliases.length > 0 ? 0.8 : 0.66;
  const modifierScore = Math.min(0.12, match.matchedModifiers.length * 0.05);
  const weightScore = Math.min(0.06, Math.max(0, ...match.matchedModifiers.map((modifier) => modifier.weight)) * 0.06);

  return Number(Math.min(0.96, aliasScore + modifierScore + weightScore).toFixed(2));
}

function roleFor(match: MatchedSymbol, isAmbiguousSearching: boolean): string {
  if (match.entry.id === "searching" && isAmbiguousSearching) {
    return "ambiguousSearching";
  }

  if (match.matchedModifiers.length > 0) {
    return match.matchedModifiers.map((modifier) => modifier.key).join("+");
  }

  if (match.entry.symbolRole.includes("context_signal")) {
    return "contextSignal";
  }

  if (match.entry.symbolRole.includes("modifier")) {
    return "modifier";
  }

  return "primarySymbol";
}

function buildCandidate(match: MatchedSymbol, isAmbiguousSearching: boolean): SymbolCandidate {
  const matchedTerm = match.matchedAliases[0] ?? match.matchedModifiers[0]?.matchedTerms[0] ?? match.entry.label;
  const confidence = match.entry.id === "searching" && isAmbiguousSearching ? 0.68 : confidenceFor(match);

  return {
    text: matchedTerm,
    normalizedText: compact(matchedTerm),
    candidateId: match.entry.id,
    type: match.entry.category,
    evidenceText: matchedTerm,
    roleInDream: roleFor(match, isAmbiguousSearching),
    source: "explicit",
    importance: match.entry.id === "searching" && isAmbiguousSearching ? 3 : symbolImportance(match.entry, match.matchedModifiers),
    confidence,
  };
}

function theme(label: string, evidenceText: string | undefined, confidence: number): ThemeSignal {
  return evidenceText ? { label, evidenceText, confidence } : { label, confidence };
}

function sceneFactFor(match: MatchedSymbol, locale: SupportedLocale): string {
  const evidence = unique([
    ...match.matchedAliases,
    ...match.matchedModifiers.flatMap((modifier) => modifier.matchedTerms),
  ]).slice(0, 4);
  const suffix = evidence.length > 0 ? evidence.join(locale === "en" ? ", " : ", ") : match.entry.label;

  return locale === "en" ? `${match.entry.label} scene: ${suffix}` : `${match.entry.label} 장면: ${suffix}`;
}

function modifierQueriesFor(match: MatchedSymbol): string[] {
  return unique([
    ...match.matchedModifiers.map((modifier) => modifier.key),
    ...match.matchedModifiers.flatMap((modifier) => LEGACY_MODIFIER_QUERY_BY_SYMBOL_MODIFIER[`${match.entry.id}:${modifier.key}`] ?? []),
    ...(LEGACY_SYMBOL_MODIFIER_QUERY[match.entry.id] ?? []),
  ]);
}

function legacySceneQueries(matches: MatchedSymbol[], locale: SupportedLocale): string[] {
  const ids = new Set(matches.map((match) => match.entry.id));
  const modifierKeys = new Set(matches.flatMap((match) => match.matchedModifiers.map((modifier) => `${match.entry.id}:${modifier.key}`)));
  const queries: string[] = [];

  if (locale === "ko" && ids.has("owned_land") && (ids.has("snake") || ids.has("many"))) {
    queries.push("많은 뱀이 내 영역에 있음");
  }

  if (locale === "ko" && (modifierKeys.has("school:lostClassroom") || (ids.has("school") && ids.has("searching")))) {
    queries.push("교실을 찾기");
  }

  if (locale === "ko" && modifierKeys.has("door:changing")) {
    queries.push("문이 계속 바뀜");
  }

  return queries;
}

function buildThemes(matches: MatchedSymbol[], locale: SupportedLocale, isAmbiguousSearching: boolean): ThemeSignal[] {
  const legacyThemes = matches.flatMap((match) => {
    const legacyTheme = LEGACY_THEME_BY_SYMBOL[match.entry.id]?.[locale];
    const evidenceText = match.matchedAliases[0] ?? match.matchedModifiers[0]?.matchedTerms[0] ?? match.entry.label;

    return legacyTheme ? [theme(legacyTheme, evidenceText, match.entry.id === "many" ? 0.76 : 0.8)] : [];
  });

  const coreThemes = matches.flatMap((match) => {
    const evidenceText = match.matchedAliases[0] ?? match.matchedModifiers[0]?.matchedTerms[0] ?? match.entry.label;

    return match.entry.evidence.coreMeanings.slice(0, 2).map((label) => theme(label, evidenceText, 0.62));
  });
  const themes = [...legacyThemes, ...coreThemes];

  if (isAmbiguousSearching) {
    themes.push(theme(locale === "ko" ? "단서 부족" : "unclear clue", locale === "ko" ? "장면이 흐릿했어" : "blurry", 0.72));
  }

  return uniqueThemes(themes);
}

function uniqueThemes(themes: ThemeSignal[]): ThemeSignal[] {
  const seen = new Set<string>();
  const output: ThemeSignal[] = [];

  for (const item of themes) {
    const key = compact(item.label);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

function inferEmotions(matches: MatchedSymbol[], locale: SupportedLocale): EmotionSignal[] {
  const ids = new Set(matches.map((match) => match.entry.id));
  const emotions: EmotionSignal[] = [];

  if (ids.has("many")) {
    emotions.push({
      label: locale === "ko" ? "놀람" : "surprise",
      source: "text",
      evidenceText: locale === "ko" ? "많은 수" : "many",
      confidence: 0.55,
    });
  }

  if (ids.has("being_chased")) {
    emotions.push({
      label: locale === "ko" ? "긴박감" : "urgency",
      source: "text",
      evidenceText: locale === "ko" ? "쫓김" : "being chased",
      confidence: 0.62,
    });
  }

  return emotions;
}

function unmatchedEnglishSceneCandidates(
  normalizedText: string,
  matchedSymbols: MatchedSymbol[],
): SymbolCandidate[] {
  const matchedKeys = new Set(
    matchedSymbols
      .flatMap((match) => [
        match.entry.label,
        ...match.matchedAliases,
        ...match.matchedModifiers.flatMap((modifier) => modifier.matchedTerms),
      ])
      .map(compact),
  );

  return unique(tokenize(normalizedText))
    .filter((token) => token.length >= 4)
    .filter((token) => !ENGLISH_SCENE_STOP_WORDS.has(token))
    .filter((token) => !matchedKeys.has(compact(token)))
    .slice(0, 4)
    .map((token) => ({
      text: token,
      normalizedText: compact(token),
      type: "object" as const,
      evidenceText: token,
      roleInDream: "unmatchedSceneDetail",
      source: "inferred" as const,
      importance: 1 as const,
      confidence: 0.25,
    }));
}

function safetySignalsFromText(lowerText: string, locale: SupportedLocale): SafetySignal[] {
  const safetySignals: SafetySignal[] = [];

  if (includesAny(lowerText, ["울고", "힘들", "너무 무겁", "heavy and hard"])) {
    safetySignals.push({
      type: "distress",
      severity: "medium",
      evidenceText: locale === "ko" ? "마음이 너무 무겁고 힘들었어" : "heavy and hard",
    });
  }

  if (includesAny(lowerText, ["disease", "diagnosis", "sick", "illness", "질병", "진단"])) {
    safetySignals.push({
      type: "medicalOrDiagnostic",
      severity: "medium",
      evidenceText: includesAny(lowerText, ["disease"]) ? "disease" : "질병",
    });
  }

  return safetySignals;
}

export function analyzeDreamStructure(request: StructuredDreamAnalysisRequest): StructuredDreamAnalysis {
  const language = request.locale ?? "ko";
  const normalizedText = request.dreamText.trim().replace(/\s+/g, " ");
  const lowerText = normalizedText.toLocaleLowerCase();
  const matchedSymbols = findMatchedSymbols(normalizedText, language, request.lemmas ?? []);
  const isAmbiguousSearching = includesAny(lowerText, ["잘 모르", "흐릿", "blurry", "unclear"]);
  const symbolCandidates = [
    ...matchedSymbols.map((match) => buildCandidate(match, isAmbiguousSearching)),
    ...(language === "en" ? unmatchedEnglishSceneCandidates(normalizedText, matchedSymbols) : []),
  ];
  const sceneFacts = matchedSymbols.map((match) => sceneFactFor(match, language));

  // 사용자가 명시적으로 고른 분위기/감각을 신호로 변환한다(약한 신호 = 검색 쿼리에만 더함).
  const selectedAtmosphereLabels = localizedLabelsFor(request.dreamAtmospheres, ATMOSPHERE_EMOTION, language);
  const otherSensationLabel = request.dreamSensationOther?.trim();
  const selectedSensationLabels = unique([
    ...localizedLabelsFor(request.dreamSensations, SENSATION_SIGNAL, language),
    ...(otherSensationLabel ? [otherSensationLabel] : []),
  ]);
  const atmosphereEmotions: EmotionSignal[] = (request.dreamAtmospheres ?? []).flatMap((id) =>
    ATMOSPHERE_EMOTION[id] ? [{ label: ATMOSPHERE_EMOTION[id][language], source: "selectedMood" as const, confidence: 0.7 }] : [],
  );
  const sensationSymbolQueries = unique(
    (request.dreamSensations ?? []).flatMap((id) =>
      SENSATION_SIGNAL[id]?.symbolQuery ? [SENSATION_SIGNAL[id].symbolQuery![language]] : [],
    ),
  );

  const literalQueries = unique([
    ...matchedSymbols.flatMap((match) => match.matchedAliases),
    ...matchedSymbols.flatMap((match) => match.matchedModifiers.flatMap((modifier) => modifier.matchedTerms)),
    ...sensationSymbolQueries,
  ]);
  const sceneQueries = unique(legacySceneQueries(matchedSymbols, language));
  const themeQueries = unique([
    ...matchedSymbols.flatMap((match) => match.entry.evidence.coreMeanings),
    ...selectedAtmosphereLabels,
  ]);
  const modifierQueries = unique(matchedSymbols.flatMap(modifierQueriesFor));
  const selectedMoods: SelectedMood[] = [
    ...(request.wakeMood ? [{ source: "wakeMood" as const, value: request.wakeMood }] : []),
    ...(request.dreamMood ? [{ source: "dreamMood" as const, value: request.dreamMood }] : []),
  ];
  const inferredEmotions = dedupeEmotions([...atmosphereEmotions, ...inferEmotions(matchedSymbols, language)]);

  return {
    normalizedText,
    summary: sceneFacts.length > 0 ? sceneFacts.slice(0, 3).join(", ") : normalizedText.slice(0, 80),
    sceneFacts,
    symbolCandidates,
    literalQueries,
    sceneQueries,
    themeQueries,
    modifierQueries,
    selectedMoods,
    selectedAtmosphereLabels,
    selectedSensationLabels,
    inferredEmotions,
    themes: buildThemes(matchedSymbols, language, isAmbiguousSearching),
    safetySignals: safetySignalsFromText(lowerText, language),
    fortuneReadings: resolveFortuneReadings(matchedSymbols),
    readingTone: resolveReadingTone(request.dreamAtmospheres, request.dreamSensations),
    readingCertainty: resolveReadingCertainty(request.dreamAtmospheres, request.dreamSensations),
    language,
  };
}

function dedupeEmotions(emotions: EmotionSignal[]): EmotionSignal[] {
  const seen = new Set<string>();
  const output: EmotionSignal[] = [];

  for (const emotion of emotions) {
    const key = compact(emotion.label);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(emotion);
  }

  return output;
}
