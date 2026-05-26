import { randomUUID } from "node:crypto";

import type {
  CatReaderResponse,
  CatReaderType,
  DreamAnalysisRequest,
  DreamAnalysisResponse,
  DreamCardResponse,
} from "../contracts/dream";
import type { RuntimeSymbolEntry, SupportedLocale } from "../contracts/symbol-encyclopedia";
import { getRuntimeSymbolEntry } from "../data/symbol-encyclopedia";
import { analyzeDreamStructure } from "./structured-dream-analysis";
import { findRuntimeSymbolMatches, type RuntimeSymbolMatch } from "./symbol-matcher";

const moodLabels: Record<string, string> = {
  anxious: "불안",
  calm: "평온",
  rushed: "조급함",
  curious: "호기심",
  blurry: "흐릿함",
  confusing: "혼란",
  overwhelming: "압도감",
  heavy: "무거움",
  sad: "슬픔",
  peaceful: "평온",
  uneasy: "불편함",
  편안: "평온",
  불안: "불안",
  조급: "조급함",
  신기: "호기심",
  흐릿: "흐릿함",
};

const catReaderProfiles: Record<CatReaderType, CatReaderResponse & { note: string }> = {
  black_cat: {
    id: "black_cat",
    name: "검은냥",
    access: "free",
    note: "검은냥은 꿈속 상징과 장면의 연결을 조용히 먼저 살펴봤다냥.",
  },
  white_cat: {
    id: "white_cat",
    name: "하얀냥",
    access: "free",
    note: "하얀냥은 이 꿈이 남긴 감정을 부드럽게 이름 붙여봤다냥.",
  },
  cheese_cat: {
    id: "cheese_cat",
    name: "치즈냥",
    access: "free",
    note: "치즈냥은 꿈에서 오늘 바로 해볼 작은 행동을 찾아봤다냥.",
  },
  gray_cat: {
    id: "gray_cat",
    name: "회색냥",
    access: "annual_premium",
    note: "회색냥의 꿈+타로 리딩은 아직 준비 중이다냥.",
  },
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0.55;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function getCatReaderProfile(readerType: CatReaderType | string | undefined): CatReaderResponse & { note: string } {
  const normalizedReaderType = readerType === "orange_cat" || readerType === "yellow_cat" ? "cheese_cat" : readerType;

  return catReaderProfiles[(normalizedReaderType as CatReaderType | undefined) ?? "black_cat"] ?? catReaderProfiles.black_cat;
}

function fallbackEntries(locale: SupportedLocale): RuntimeSymbolEntry[] {
  return ["door", "water", "cat"].map((id) => getRuntimeSymbolEntry(id, locale));
}

function inferEmotions(request: DreamAnalysisRequest, inferredLabels: string[]): string[] {
  const selected = [request.wakeMood, request.dreamMood].flatMap((mood) => (mood ? [moodLabels[mood] ?? mood] : []));

  return unique([...selected, ...inferredLabels]).slice(0, 4);
}

function symbolReadingFor(match: RuntimeSymbolMatch): string {
  const modifierKey = match.usedFields.find((field) => field.startsWith("sceneModifiers."))?.replace("sceneModifiers.", "");
  const modifierReading = modifierKey ? match.evidence.sceneModifiers[modifierKey]?.reading : undefined;
  const baseReading = modifierReading ?? match.evidence.lightReadings[0] ?? match.evidence.coreMeanings[0] ?? "마음의 단서";

  return `${match.label}은 ${baseReading}으로 읽을 수 있어요.`;
}

function buildSymbolReadings(matches: RuntimeSymbolMatch[]): DreamAnalysisResponse["symbolReadings"] {
  return matches.slice(0, 5).map((match) => ({
    symbol: match.label,
    reading: symbolReadingFor(match),
  }));
}

function buildFallbackSymbolReadings(entries: RuntimeSymbolEntry[]): DreamAnalysisResponse["symbolReadings"] {
  return entries.slice(0, 3).map((entry) => ({
    symbol: entry.label,
    reading: `${entry.label}은 ${entry.evidence.lightReadings[0] ?? entry.evidence.coreMeanings[0]}의 단서로 낮게 참고할 수 있어요.`,
  }));
}

function buildInterpretation(matches: RuntimeSymbolMatch[], themes: string[], isFallback: boolean): string {
  if (isFallback) {
    return "뚜렷한 상징은 적지만, 남아 있는 느낌 자체가 오늘 마음의 온도를 보여주는 단서일 수 있어요. 꿈을 억지로 맞히기보다 흐릿한 감각을 한 문장으로 남겨보면 좋겠다냥.";
  }

  const symbolIds = matches.map((match) => match.entryId);

  if (symbolIds.includes("snake") && symbolIds.includes("owned_land")) {
    return "이 꿈은 불길함으로 몰아가기보다, 내 영역 안에서 조용히 커지고 있던 감각들이 한꺼번에 모습을 드러낸 장면으로 읽을 수 있어요. 큰 구렁이와 많은 뱀은 하나의 작은 사건보다 여러 갈래의 힘이나 가능성이 동시에 움직이는 느낌에 가깝습니다.";
  }

  if (symbolIds.includes("door") && symbolIds.includes("corridor")) {
    return "이 꿈은 목적지가 없다는 뜻보다, 다음 장면으로 들어가기 전 기준을 찾는 전환 구간에 가까워 보여요. 문이나 복도는 선택 앞에서 잠시 멈춰 방향을 살피는 마음을 보여줄 수 있습니다.";
  }

  const [firstMatch, secondMatch] = matches;
  const firstTheme = themes[0] ?? firstMatch?.evidence.coreMeanings[0] ?? "감정의 흐름";
  const secondLabel = secondMatch ? ` ${secondMatch.label}의 단서가 함께 더해져,` : "";

  return `단정하긴 어렵지만, ${firstMatch?.label ?? "이 장면"}은 ${firstTheme}와 연결되어 보여요.${secondLabel} 꿈이 남긴 감각을 조금 더 구체적으로 바라보게 합니다.`;
}

function buildSmallPrescription(matches: RuntimeSymbolMatch[], isFallback: boolean): string {
  if (isFallback) {
    return "기억나는 감각을 한 문장으로 적어두자냥.";
  }

  const symbolIds = matches.map((match) => match.entryId);

  if (symbolIds.includes("snake") && symbolIds.includes("owned_land")) {
    return "오늘은 내가 지켜야 한다고 느끼는 영역 하나를 적고, 실제로 챙길 수 있는 작은 행동 하나만 정해보세요.";
  }

  if (symbolIds.includes("door")) {
    return "오늘 결정해야 하는 일 하나에 임시 기준을 붙여보자냥.";
  }

  if (symbolIds.includes("water")) {
    return "오늘은 감정을 해결하려 하기보다 이름 하나만 붙여보자냥.";
  }

  return "꿈에서 가장 선명했던 장면 하나만 오늘의 메모로 남겨보자냥.";
}

function buildCard(matches: RuntimeSymbolMatch[], themes: string[], emotions: string[], summary: string, isFallback: boolean): DreamCardResponse {
  if (isFallback) {
    return {
      name: "흐릿한 꿈 조각",
      type: "soft_moon",
      keywords: ["잔상", "기록", "감각"],
      summary,
      message: "희미한 꿈도 오늘의 작은 단서가 될 수 있다냥.",
      theme: "감정 정리",
    };
  }

  const symbolIds = matches.map((match) => match.entryId);
  const primary = matches[0];
  const keywords = unique([
    ...themes.slice(0, 3),
    ...(primary?.evidence.coreMeanings.slice(0, 2) ?? []),
  ]).slice(0, 4);
  const emotion = emotions[0] ?? "잔상";

  if (symbolIds.includes("snake") && symbolIds.includes("owned_land")) {
    return {
      name: "땅 아래 깨어난 구렁이",
      type: "earth_moon",
      keywords: unique(["영역", "생명력", "경계", "압도감"]).slice(0, 4),
      summary,
      message: "한꺼번에 올라온 감각을 불길함으로 몰지 말고, 지금 내 영역에서 무엇이 커지고 있는지 살펴보자냥.",
      theme: "영역",
    };
  }

  return {
    name: `${primary?.label ?? "꿈 조각"}을 살피는 밤`,
    type: emotion === "불안" ? "half_moon" : "soft_moon",
    keywords,
    summary,
    message: `${emotion}을 바로 결론 내리지 말고, 오늘의 작은 단서로만 데려가보자냥.`,
    theme: themes[0] ?? "감정 정리",
  };
}

function safetyNoticeFor(request: DreamAnalysisRequest): string | undefined {
  if (/질병|진단|disease|diagnosis|sick|illness/i.test(request.dreamText)) {
    if (request.locale === "en") {
      return "Manyang's reading is not a medical diagnosis. If you are worried about your health, please talk with a qualified professional.";
    }

    return "마냥의 해석은 의학적 진단을 대체하지 않습니다. 건강이 걱정된다면 전문가와 상의해 주세요.";
  }

  if (/힘들|무겁|울고|crisis|harm/i.test(request.dreamText)) {
    return "이 해석은 자기 성찰을 돕는 감성 리딩입니다. 감정이 오래 무겁다면 믿을 수 있는 사람이나 전문가에게 도움을 요청해 주세요.";
  }

  return undefined;
}

export function analyzeDream(request: DreamAnalysisRequest): DreamAnalysisResponse {
  if (request.dreamText.trim().length === 0) {
    throw new Error("dreamText is required");
  }

  const locale = request.locale ?? "ko";
  const structuredAnalysis = analyzeDreamStructure({
    dreamText: request.dreamText,
    ...(request.dreamDate ? { dreamDate: request.dreamDate } : {}),
    ...(request.wakeMood ? { wakeMood: request.wakeMood } : {}),
    ...(request.dreamMood ? { dreamMood: request.dreamMood } : {}),
    locale,
  });
  const matches = findRuntimeSymbolMatches(request.dreamText, { locale, limit: 5 });
  const isFallback = matches.length === 0;
  const fallback = isFallback ? fallbackEntries(locale) : [];
  const symbols = isFallback ? fallback.map((entry) => entry.label) : matches.map((match) => match.label);
  const emotions = inferEmotions(
    request,
    structuredAnalysis.inferredEmotions.map((emotion) => emotion.label),
  );
  const themes = unique([
    ...structuredAnalysis.themes.map((theme) => theme.label),
    ...matches.flatMap((match) => match.evidence.coreMeanings.slice(0, 1)),
  ]).slice(0, 4);
  const summary = isFallback
    ? "희미한 느낌이 남은 꿈"
    : `${symbols.slice(0, 3).join(", ")}이 특히 남은 꿈`;
  const interpretation = buildInterpretation(matches, themes, isFallback);
  const smallPrescription = buildSmallPrescription(matches, isFallback);
  const symbolReadings = isFallback ? buildFallbackSymbolReadings(fallback) : buildSymbolReadings(matches);
  const reader = getCatReaderProfile(request.catReaderType);

  const safetyNotice = safetyNoticeFor(request);

  return {
    dreamId: randomUUID(),
    analysisId: randomUUID(),
    cardId: randomUUID(),
    reader: {
      id: reader.id,
      name: reader.name,
      access: reader.access,
    },
    summary,
    symbols,
    emotions,
    themes,
    interpretation,
    symbolReadings,
    smallPrescription,
    readingBasis: {
      usedSymbols: symbols,
      mainThemes: themes,
      confidence: isFallback ? 0.55 : average(matches.map((match) => match.confidence)),
    },
    readerNote: reader.note,
    ...(safetyNotice ? { safetyNotice } : {}),
    card: buildCard(matches, themes, emotions, summary, isFallback),
  };
}
