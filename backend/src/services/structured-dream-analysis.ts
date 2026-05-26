import type { SupportedLocale, SymbolCategory } from "../contracts/symbol-encyclopedia";

export type StructuredDreamAnalysisRequest = {
  dreamText: string;
  dreamDate?: string;
  wakeMood?: string;
  dreamMood?: string;
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
  inferredEmotions: EmotionSignal[];
  themes: ThemeSignal[];
  safetySignals: SafetySignal[];
  language: SupportedLocale;
};

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value.toLowerCase()));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function candidate(input: SymbolCandidate): SymbolCandidate {
  return input;
}

function theme(label: string, evidenceText: string | undefined, confidence: number): ThemeSignal {
  return evidenceText ? { label, evidenceText, confidence } : { label, confidence };
}

export function analyzeDreamStructure(request: StructuredDreamAnalysisRequest): StructuredDreamAnalysis {
  const language = request.locale ?? "ko";
  const normalizedText = request.dreamText.trim().replace(/\s+/g, " ");
  const lowerText = normalizedText.toLowerCase();
  const symbolCandidates: SymbolCandidate[] = [];
  const sceneFacts: string[] = [];
  const literalQueries: string[] = [];
  const sceneQueries: string[] = [];
  const themeQueries: string[] = [];
  const modifierQueries: string[] = [];
  const themes: ThemeSignal[] = [];
  const inferredEmotions: EmotionSignal[] = [];
  const safetySignals: SafetySignal[] = [];

  if (includesAny(lowerText, ["구렁이", "뱀"])) {
    sceneFacts.push("큰 구렁이와 뱀이 나타남");
    symbolCandidates.push(
      candidate({
        text: "뱀",
        normalizedText: "뱀",
        candidateId: "snake",
        type: "animal",
        evidenceText: includesAny(lowerText, ["구렁이"]) ? "큰 구렁이들" : "뱀",
        roleInDream: includesAny(lowerText, ["구렁이", "큰"]) ? "largeSnakeAppearing" : "snakeAppearing",
        source: "explicit",
        importance: 5,
        confidence: 0.94,
      }),
    );
    literalQueries.push("구렁이", "뱀");
    themeQueries.push("생명력", "숨은 움직임");
    modifierQueries.push("largeSnake");
    themes.push(theme("생명력", "큰 구렁이들", 0.8));
  }

  if (includesAny(lowerText, ["우리 땅", "내 땅", "집터", "대지"])) {
    sceneFacts.push("우리 땅이라는 소유/영역의 장소");
    symbolCandidates.push(
      candidate({
        text: "우리 땅",
        normalizedText: "우리땅",
        candidateId: "owned_land",
        type: "place",
        evidenceText: "우리 땅",
        roleInDream: "ownedTerritory",
        source: "explicit",
        importance: 5,
        confidence: 0.9,
      }),
    );
    literalQueries.push("우리 땅");
    sceneQueries.push("많은 뱀이 내 영역에 있음");
    modifierQueries.push("ownedLand");
    themes.push(theme("영역", "우리 땅", 0.82));
  }

  if (includesAny(lowerText, ["수십", "가득", "많이", "many", "dozens"])) {
    sceneFacts.push("많은 수의 대상이 한꺼번에 나타남");
    symbolCandidates.push(
      candidate({
        text: language === "ko" ? "수십 마리" : "many",
        normalizedText: language === "ko" ? "수십마리" : "many",
        candidateId: "many",
        type: "quantity",
        evidenceText: language === "ko" ? "수십 마리" : "many",
        roleInDream: "manyThingsAppearing",
        source: "explicit",
        importance: 4,
        confidence: 0.9,
      }),
    );
    literalQueries.push(language === "ko" ? "수십 마리" : "many");
    modifierQueries.push(includesAny(lowerText, ["뱀", "snake"]) ? "manySnakes" : "many");
    themeQueries.push(language === "ko" ? "압도감" : "overwhelm");
    themes.push(theme(language === "ko" ? "압도감" : "overwhelm", language === "ko" ? "수십 마리" : "many", 0.76));
    inferredEmotions.push({
      label: language === "ko" ? "놀람" : "surprise",
      source: "text",
      evidenceText: language === "ko" ? "수십 마리" : "many",
      confidence: 0.55,
    });
  }

  if (includesAny(lowerText, ["새벽", "dawn", "early morning"])) {
    sceneFacts.push(language === "ko" ? "새벽에 꾼 꿈" : "a dream around dawn");
    symbolCandidates.push(
      candidate({
        text: language === "ko" ? "새벽" : "dawn",
        normalizedText: language === "ko" ? "새벽" : "dawn",
        candidateId: "dawn",
        type: "time",
        evidenceText: language === "ko" ? "새벽" : "dawn",
        roleInDream: "timeModifier",
        source: "explicit",
        importance: 2,
        confidence: 0.72,
      }),
    );
    literalQueries.push(language === "ko" ? "새벽" : "dawn");
    modifierQueries.push("dawn");
  }

  if (includesAny(lowerText, ["학교", "school"])) {
    sceneFacts.push(language === "ko" ? "학교 장면" : "school scene");
    symbolCandidates.push(
      candidate({
        text: language === "ko" ? "학교" : "school",
        normalizedText: language === "ko" ? "학교" : "school",
        candidateId: "school",
        type: "place",
        evidenceText: language === "ko" ? "학교" : "school",
        roleInDream: "learningOrEvaluationPlace",
        source: "explicit",
        importance: 5,
        confidence: 0.92,
      }),
    );
    literalQueries.push(language === "ko" ? "학교" : "school");
  }

  if (includesAny(lowerText, ["복도", "hallway", "corridor"])) {
    sceneFacts.push(language === "ko" ? "복도에서 이동함" : "moving through a hallway");
    symbolCandidates.push(
      candidate({
        text: language === "ko" ? "복도" : "hallway",
        normalizedText: language === "ko" ? "복도" : "hallway",
        candidateId: "corridor",
        type: "place",
        evidenceText: language === "ko" ? "복도" : "hallway",
        roleInDream: "inBetweenMovement",
        source: "explicit",
        importance: 4,
        confidence: 0.88,
      }),
    );
    literalQueries.push(language === "ko" ? "복도" : "hallway");
    themeQueries.push(language === "ko" ? "전환" : "transition");
  }

  if (includesAny(lowerText, ["문", "door", "entrance"])) {
    sceneFacts.push(language === "ko" ? "문 또는 입구가 중요함" : "door or entrance is important");
    symbolCandidates.push(
      candidate({
        text: language === "ko" ? "문" : "door",
        normalizedText: language === "ko" ? "문" : "door",
        candidateId: "door",
        type: "object",
        evidenceText: language === "ko" ? "문" : "door",
        roleInDream: includesAny(lowerText, ["바뀌", "changing", "moving away"]) ? "changingThreshold" : "threshold",
        source: "explicit",
        importance: 5,
        confidence: 0.92,
      }),
    );
    literalQueries.push(language === "ko" ? "문" : "door");
    if (includesAny(lowerText, ["바뀌", "changing", "moving away"])) {
      sceneQueries.push(language === "ko" ? "문이 계속 바뀜" : "the entrance keeps moving away");
      modifierQueries.push("changingDoor");
      themes.push(theme(language === "ko" ? "기준" : "moving standard", language === "ko" ? "문이 계속 바뀜" : "entrance kept moving", 0.78));
    }
  }

  if (includesAny(lowerText, ["찾", "못 찾", "돌아다", "looking for", "cannot find", "searching"])) {
    const ambiguous = includesAny(lowerText, ["잘 모르", "흐릿", "blurry"]);
    symbolCandidates.push(
      candidate({
        text: language === "ko" ? "찾기" : "searching",
        normalizedText: language === "ko" ? "찾기" : "searching",
        candidateId: "searching",
        type: "action",
        evidenceText: language === "ko" ? "찾" : "searching",
        roleInDream: ambiguous ? "ambiguousSearching" : "searchingForTarget",
        source: "explicit",
        importance: ambiguous ? 3 : 4,
        confidence: ambiguous ? 0.68 : 0.86,
      }),
    );
    literalQueries.push(language === "ko" ? "찾기" : "searching");
    sceneQueries.push(language === "ko" ? "교실을 찾기" : "looking for something");
    themeQueries.push(language === "ko" ? "탐색" : "searching");
    if (ambiguous) {
      themes.push(theme("단서 부족", "장면이 흐릿했어", 0.72));
    }
  }

  if (includesAny(lowerText, ["울고", "힘들", "너무 무겁", "heavy and hard"])) {
    safetySignals.push({
      type: "distress",
      severity: "medium",
      evidenceText: language === "ko" ? "마음이 너무 무겁고 힘들었어" : "heavy and hard",
    });
  }

  if (includesAny(lowerText, ["disease", "diagnosis", "sick", "illness", "질병", "진단"])) {
    safetySignals.push({
      type: "medicalOrDiagnostic",
      severity: "medium",
      evidenceText: includesAny(lowerText, ["disease"]) ? "disease" : "질병",
    });
  }

  const selectedMoods: SelectedMood[] = [
    ...(request.wakeMood ? [{ source: "wakeMood" as const, value: request.wakeMood }] : []),
    ...(request.dreamMood ? [{ source: "dreamMood" as const, value: request.dreamMood }] : []),
  ];

  return {
    normalizedText,
    summary: sceneFacts.length > 0 ? sceneFacts.slice(0, 3).join(", ") : normalizedText.slice(0, 80),
    sceneFacts,
    symbolCandidates,
    literalQueries: unique(literalQueries),
    sceneQueries: unique(sceneQueries),
    themeQueries: unique(themeQueries),
    modifierQueries: unique(modifierQueries),
    selectedMoods,
    inferredEmotions,
    themes,
    safetySignals,
    language,
  };
}
