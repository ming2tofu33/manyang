import { randomUUID } from "node:crypto";

import type { DreamAnalysisRequest, DreamAnalysisResponse, EncyclopediaEntry } from "../contracts/dream.js";
import { getEntryBySymbol } from "../data/encyclopedia.js";
import { findMatchingSymbols } from "./symbol-matcher.js";

const moodLabels: Record<string, string> = {
  anxious: "불안",
  calm: "평온",
  rushed: "조급함",
  curious: "호기심",
  blurry: "흐릿함",
  confusing: "혼란",
  peaceful: "평온",
  편안: "평온",
  불안: "불안",
  조급: "조급함",
  신기: "호기심",
  흐릿: "흐릿함",
};

const fallbackSymbolNames = ["문", "물", "고양이"];

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function pickFallbackEntries(): EncyclopediaEntry[] {
  return fallbackSymbolNames
    .map((symbol) => getEntryBySymbol(symbol))
    .filter((entry): entry is EncyclopediaEntry => entry !== undefined);
}

function inferEmotions(request: DreamAnalysisRequest, symbols: string[]): string[] {
  const text = request.dreamText;
  const moods = [request.wakeMood, request.dreamMood].flatMap((mood) => (mood ? [moodLabels[mood] ?? mood] : []));
  const inferred: string[] = [];

  if (/불안|무서|쫓|잃어|늦|어둡|깜깜/.test(text) || symbols.includes("잃어버림")) {
    inferred.push("불안");
  }

  if (/기억|흐릿|안개|이상한/.test(text)) {
    inferred.push("흐릿함");
  }

  if (/찾|열쇠|문|별/.test(text) || symbols.includes("찾기")) {
    inferred.push("기대");
  }

  if (/집|고양이|편안|잔잔/.test(text)) {
    inferred.push("안정감");
  }

  return unique([...moods, ...inferred]).slice(0, 4);
}

function themeFor(entry: EncyclopediaEntry): string {
  if (entry.category === "place") {
    return "장소와 전환";
  }

  if (entry.category === "object") {
    return "준비와 단서";
  }

  if (entry.category === "action") {
    return "움직임과 선택";
  }

  if (entry.category === "nature") {
    return "감정의 흐름";
  }

  if (entry.category === "animal" || entry.category === "person") {
    return "관계와 직감";
  }

  return "감정 정리";
}

function formatList(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  return `${values.slice(0, -1).join(", ")} 그리고 ${values.at(-1)}`;
}

function buildSummary(entries: EncyclopediaEntry[], isFallback: boolean): string {
  if (isFallback) {
    return "희미한 느낌이 남은 꿈";
  }

  return `${formatList(entries.slice(0, 3).map((entry) => entry.symbol))}이 특히 남은 꿈`;
}

function buildInterpretation(entries: EncyclopediaEntry[], emotions: string[], isFallback: boolean): string {
  if (isFallback) {
    return "뚜렷한 상징은 적지만, 남아 있는 느낌 자체가 오늘 마음의 온도를 보여주는 단서일 수 있어요. 꿈을 억지로 맞히기보다 흐릿한 감각을 조용히 바라보면 좋겠다냥.";
  }

  const [firstEntry, secondEntry, thirdEntry] = entries;
  const emotionText = emotions.length > 0 ? `${formatList(emotions)} 같은 감정` : "잠에서 깬 뒤의 감정";
  const firstMeaning = firstEntry?.coreMeanings.slice(0, 2).join("와 ") ?? "마음의 단서";
  const supportingMeanings = [secondEntry, thirdEntry]
    .filter((entry): entry is EncyclopediaEntry => entry !== undefined)
    .map((entry) => `${entry.symbol}은 ${entry.coreMeanings[0]}`)
    .join(", ");

  return `단정하긴 어렵지만, ${firstEntry?.symbol ?? "이 상징"}은 ${firstMeaning}와 연결되어 보여요. ${supportingMeanings ? `${supportingMeanings}의 결을 더해요. ` : ""}${emotionText}이 꿈의 장면을 통해 안전하게 rehearsing되는 중일 수 있다냥.`;
}

function buildSmallPrescription(symbols: string[], isFallback: boolean): string {
  if (isFallback) {
    return "기억나는 감각을 한 문장으로 적어두자냥.";
  }

  if (symbols.includes("신발") || symbols.includes("가방")) {
    return "오늘 움직이기 전 준비물 하나만 먼저 확인해보자냥.";
  }

  if (symbols.includes("기다림") || symbols.includes("시계")) {
    return "기다리는 일을 하나 적고, 내가 지금 할 수 있는 작은 행동만 표시해보자냥.";
  }

  if (symbols.includes("물") || symbols.includes("비") || symbols.includes("바다")) {
    return "물을 한 잔 마시고, 지금 남은 감정을 짧게 이름 붙여보자냥.";
  }

  if (symbols.includes("문") || symbols.includes("열쇠")) {
    return "오늘 열어볼 수 있는 가장 작은 선택지 하나를 정해보자냥.";
  }

  return "꿈에서 가장 선명했던 장면 하나만 오늘의 메모로 남겨보자냥.";
}

function buildCard(entries: EncyclopediaEntry[], themes: string[], emotions: string[], summary: string) {
  const primary = entries[0];
  const secondary = entries[1];
  const keywords = unique([
    ...(primary?.coreMeanings.slice(0, 2) ?? []),
    secondary?.coreMeanings[0] ?? "",
    ...themes.slice(0, 1),
  ]).slice(0, 4);
  const emotion = emotions[0] ?? "잔상";

  return {
    name: `${primary?.symbol ?? "꿈 조각"}을 살피는 밤`,
    type: emotion === "불안" ? "half_moon" : "soft_moon",
    keywords,
    summary,
    message: `${emotion}을 바로 결론 내리지 말고, 오늘의 작은 단서로만 데려가보자냥.`,
    theme: themes[0] ?? "감정 정리",
  };
}

export function analyzeDream(request: DreamAnalysisRequest): DreamAnalysisResponse {
  if (request.dreamText.trim().length === 0) {
    throw new Error("dreamText is required");
  }

  const matches = findMatchingSymbols(request.dreamText, { limit: 5 });
  const isFallback = matches.length === 0;
  const entries = isFallback ? pickFallbackEntries() : matches.map((match) => match.entry);
  const symbols = entries.map((entry) => entry.symbol);
  const emotions = inferEmotions(request, symbols);
  const themes = unique(entries.map(themeFor)).slice(0, 4);
  const summary = buildSummary(entries, isFallback);
  const interpretation = buildInterpretation(entries, emotions, isFallback);
  const smallPrescription = buildSmallPrescription(symbols, isFallback);

  return {
    dreamId: randomUUID(),
    analysisId: randomUUID(),
    cardId: randomUUID(),
    summary,
    symbols,
    emotions,
    themes,
    interpretation,
    smallPrescription,
    card: buildCard(entries, themes, emotions, summary),
  };
}
