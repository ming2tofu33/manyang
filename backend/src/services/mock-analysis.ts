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
import { analyzeDreamSafetyPolicy, applySafetyPolicyToResponse } from "./dream-safety-policy";
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

const commonReaderNote = "마냥은 꿈속 상징과 감정의 연결을 같은 기준으로 차분히 정리했어요.";

const catReaderProfiles: Record<CatReaderType, CatReaderResponse & { note: string }> = {
  black_cat: {
    id: "black_cat",
    name: "검은냥",
    access: "free",
    note: commonReaderNote,
  },
  white_cat: {
    id: "white_cat",
    name: "하얀냥",
    access: "free",
    note: commonReaderNote,
  },
  cheese_cat: {
    id: "cheese_cat",
    name: "치즈냥",
    access: "free",
    note: commonReaderNote,
  },
  gray_cat: {
    id: "gray_cat",
    name: "잿빛냥",
    access: "annual_premium",
    note: commonReaderNote,
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

function hasFinalConsonant(value: string): boolean {
  const lastHangul = [...value].reverse().find((char) => /[가-힣]/u.test(char));

  if (!lastHangul) {
    return false;
  }

  return (lastHangul.charCodeAt(0) - 0xac00) % 28 !== 0;
}

function topicParticle(value: string): "은" | "는" {
  return hasFinalConsonant(value) ? "은" : "는";
}

function connectiveParticle(value: string): "과" | "와" {
  return hasFinalConsonant(value) ? "과" : "와";
}

function getCatReaderProfile(readerType: CatReaderType | string | undefined): CatReaderResponse & { note: string } {
  const normalizedReaderType = readerType === "orange_cat" || readerType === "yellow_cat" ? "cheese_cat" : readerType;

  return catReaderProfiles[(normalizedReaderType as CatReaderType | undefined) ?? "black_cat"] ?? catReaderProfiles.black_cat;
}

function fallbackEntries(locale: SupportedLocale): RuntimeSymbolEntry[] {
  return ["door", "water", "cat"].map((id) => getRuntimeSymbolEntry(id, locale));
}

// wakeMood가 "분위기: X / 감각: Y" 같은 표시용 복합 라벨이면 감정으로 취급하지 않는다.
// 구조화된 분위기 정서는 structuredAnalysis.inferredEmotions(=inferredLabels)로 이미 들어온다.
function isCompositeMoodLabel(value: string): boolean {
  return value.includes("분위기:") || value.includes("감각:");
}

function inferEmotions(request: DreamAnalysisRequest, inferredLabels: string[]): string[] {
  const selected = [request.wakeMood, request.dreamMood].flatMap((mood) =>
    mood && !isCompositeMoodLabel(mood) ? [moodLabels[mood] ?? mood] : [],
  );

  return unique([...selected, ...inferredLabels]).slice(0, 4);
}

function symbolReadingFor(match: RuntimeSymbolMatch, locale: SupportedLocale): string {
  const modifierKey = match.usedFields.find((field) => field.startsWith("sceneModifiers."))?.replace("sceneModifiers.", "");
  const modifierReading = modifierKey ? match.evidence.sceneModifiers[modifierKey]?.reading : undefined;
  const baseReading = modifierReading ?? match.evidence.lightReadings[0] ?? match.evidence.coreMeanings[0] ?? "마음의 단서";

  if (locale === "en") {
    return `${match.label} can be read as ${baseReading}.`;
  }

  return `${match.label}${topicParticle(match.label)} ${baseReading}으로 읽을 수 있어요.`;
}

function buildSymbolReadings(matches: RuntimeSymbolMatch[], locale: SupportedLocale): DreamAnalysisResponse["symbolReadings"] {
  return matches.slice(0, 5).map((match) => ({
    symbol: match.label,
    reading: symbolReadingFor(match, locale),
  }));
}

function buildFallbackSymbolReadings(entries: RuntimeSymbolEntry[], locale: SupportedLocale): DreamAnalysisResponse["symbolReadings"] {
  return entries.slice(0, 3).map((entry) => ({
    symbol: entry.label,
    reading:
      locale === "en"
        ? `${entry.label} can be used only as a light fallback clue for ${entry.evidence.lightReadings[0] ?? entry.evidence.coreMeanings[0]}.`
        : `${entry.label}${topicParticle(entry.label)} ${entry.evidence.lightReadings[0] ?? entry.evidence.coreMeanings[0]}의 단서로 낮게 참고할 수 있어요.`,
  }));
}

function buildInterpretation(matches: RuntimeSymbolMatch[], themes: string[], isFallback: boolean, locale: SupportedLocale): string {
  if (isFallback) {
    return locale === "en"
      ? "The dream does not offer a clear registered symbol, but the feeling that remains can still be a small clue. Rather than forcing an answer, keep one sentence about the atmosphere of the dream."
      : "뚜렷한 상징은 적지만, 남아 있는 느낌 자체가 오늘 마음의 온도를 보여주는 단서일 수 있어요. 꿈을 억지로 맞히기보다 흐릿한 감각을 한 문장으로 남겨보면 좋겠다냥.";
  }

  const symbolIds = matches.map((match) => match.entryId);

  if (symbolIds.includes("snake") && symbolIds.includes("owned_land")) {
    if (locale === "en") {
      return "Rather than treating this as a bad omen, the dream can be read as a scene where signals inside your own territory become visible at once. The snake and the land point less to a fixed event and more to alert energy moving through a space you feel responsible for.";
    }

    return "이 꿈은 불길함으로 몰아가기보다, 내 영역 안에서 조용히 커지고 있던 감각들이 한꺼번에 모습을 드러낸 장면으로 읽을 수 있어요. 큰 구렁이와 많은 뱀은 하나의 작은 사건보다 여러 갈래의 힘이나 가능성이 동시에 움직이는 느낌에 가깝습니다.";
  }

  if (symbolIds.includes("door") && symbolIds.includes("corridor")) {
    if (locale === "en") {
      return "This dream looks less like having no destination and more like standing in a transition zone before the next scene. The door and corridor can show a mind pausing at a threshold while it tries to find a usable direction.";
    }

    return "이 꿈은 목적지가 없다는 뜻보다, 다음 장면으로 들어가기 전 기준을 찾는 전환 구간에 가까워 보여요. 문이나 복도는 선택 앞에서 잠시 멈춰 방향을 살피는 마음을 보여줄 수 있습니다.";
  }

  const [firstMatch, secondMatch] = matches;
  const firstTheme = themes[0] ?? firstMatch?.evidence.coreMeanings[0] ?? "감정의 흐름";
  const secondLabel = secondMatch ? ` ${secondMatch.label}의 단서가 함께 더해져,` : "";

  if (locale === "en") {
    const secondClause = secondMatch ? ` With ${secondMatch.label} adding another clue,` : "";

    return `It is hard to be certain, but ${firstMatch?.label ?? "this scene"} seems connected to ${firstTheme}.${secondClause} the dream gives you a more concrete way to look at the feeling it left behind.`;
  }

  const firstLabel = firstMatch?.label ?? "이 장면";

  return `단정하긴 어렵지만, ${firstLabel}${topicParticle(firstLabel)} ${firstTheme}${connectiveParticle(firstTheme)} 연결되어 보여요.${secondLabel} 꿈이 남긴 감각을 조금 더 구체적으로 바라보게 합니다.`;
}

function buildSmallPrescription(matches: RuntimeSymbolMatch[], isFallback: boolean, locale: SupportedLocale): string {
  if (isFallback) {
    return locale === "en"
      ? "Write down one scene or feeling you still remember."
      : "기억나는 감각을 한 문장으로 적어두자냥.";
  }

  const symbolIds = matches.map((match) => match.entryId);

  if (symbolIds.includes("snake") && symbolIds.includes("owned_land")) {
    if (locale === "en") {
      return "Name one area of life you feel responsible for protecting, then choose one small way to tend it today.";
    }

    return "오늘은 내가 지켜야 한다고 느끼는 영역 하나를 적고, 실제로 챙길 수 있는 작은 행동 하나만 정해보세요.";
  }

  if (symbolIds.includes("door")) {
    if (locale === "en") {
      return "Give one decision today a temporary standard before choosing.";
    }

    return "오늘 결정해야 하는 일 하나에 임시 기준을 붙여보자냥.";
  }

  if (symbolIds.includes("water")) {
    if (locale === "en") {
      return "Name one feeling today instead of trying to solve it immediately.";
    }

    return "오늘은 감정을 해결하려 하기보다 이름 하나만 붙여보자냥.";
  }

  return locale === "en"
    ? "Keep one scene from the dream as today's short note."
    : "꿈에서 가장 선명했던 장면 하나만 오늘의 메모로 남겨보자냥.";
}

function buildCard(
  matches: RuntimeSymbolMatch[],
  themes: string[],
  emotions: string[],
  summary: string,
  isFallback: boolean,
  locale: SupportedLocale,
): DreamCardResponse {
  if (isFallback) {
    return {
      name: locale === "en" ? "Faint Dream Fragment" : "흐릿한 꿈 조각",
      type: "soft_moon",
      keywords: locale === "en" ? ["trace", "note", "feeling"] : ["잔상", "기록", "감각"],
      summary,
      message:
        locale === "en"
          ? "Even a faint dream can become a small clue for today."
          : "희미한 꿈도 오늘의 작은 단서가 될 수 있다냥.",
      theme: locale === "en" ? "emotional note" : "감정 정리",
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
    if (locale === "en") {
      return {
        name: "Signals on My Ground",
        type: "earth_moon",
        keywords: unique(["territory", "life force", "boundary", "overwhelm"]).slice(0, 4),
        summary,
        message: "Treat the rising signals as something to notice, not as a fixed omen.",
        theme: "territory",
      };
    }

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
    name:
      locale === "en"
        ? `Night Looking at ${primary?.label ?? "a Dream Fragment"}`
        : `${primary?.label ?? "꿈 조각"}을 살피는 밤`,
    type: emotion === "불안" || emotion === "anxious" ? "half_moon" : "soft_moon",
    keywords,
    summary,
    message:
      locale === "en"
        ? "Do not turn the feeling into a conclusion too quickly; carry it only as a small clue for today."
        : `${emotion}을 바로 결론 내리지 말고, 오늘의 작은 단서로만 데려가보자냥.`,
    theme: themes[0] ?? (locale === "en" ? "emotional note" : "감정 정리"),
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
    ...(request.dreamAtmospheres ? { dreamAtmospheres: request.dreamAtmospheres } : {}),
    ...(request.dreamSensations ? { dreamSensations: request.dreamSensations } : {}),
    ...(request.dreamSensationOther ? { dreamSensationOther: request.dreamSensationOther } : {}),
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
  const summarySubject = symbols.slice(0, 3).join(", ");
  const summary = locale === "en"
    ? isFallback
      ? "A faint dream feeling remains"
      : `${summarySubject} stood out in the dream`
    : isFallback
      ? "희미한 느낌이 남은 꿈"
      : `${summarySubject}${topicParticle(summarySubject) === "은" ? "이" : "가"} 특히 남은 꿈`;
  const interpretation = buildInterpretation(matches, themes, isFallback, locale);
  const smallPrescription = buildSmallPrescription(matches, isFallback, locale);
  const symbolReadings = isFallback ? buildFallbackSymbolReadings(fallback, locale) : buildSymbolReadings(matches, locale);
  const reader = getCatReaderProfile(request.catReaderType);

  const response: DreamAnalysisResponse = {
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
    card: buildCard(matches, themes, emotions, summary, isFallback, locale),
  };

  return applySafetyPolicyToResponse(response, analyzeDreamSafetyPolicy(request));
}
