export const TAROT_READING_DRAFT_SCHEMA_NAME = "tarot_reading_draft";

export const TAROT_READING_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      minLength: 1,
    },
    overview: {
      type: "string",
      minLength: 80,
    },
    keywords: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "string",
        minLength: 1,
      },
    },
    cardReadings: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          position: {
            type: "string",
            enum: ["today", "situation", "flow", "advice"],
          },
          heading: {
            type: "string",
            enum: ["지금 드러난 조건", "이어지는 국면", "판단의 기준"],
          },
          reading: {
            type: "string",
            minLength: 40,
          },
        },
        required: ["position", "heading", "reading"],
      },
    },
  },
  required: ["title", "overview", "keywords", "cardReadings"],
} as const;

export type TarotReadingSpread = "daily_one_card" | "question_one_card" | "daily_three_card";
export type TarotReadingPosition = "today" | "situation" | "flow" | "advice";
export type TarotReadingOrientation = "upright" | "reversed";

export type TarotCardSymbolMeaning = {
  symbol: string;
  meaning: string;
};

export type TarotPromptCardMeaning = {
  summary: string;
  dailyFlow: string;
  cardMessage: string;
  readingScene: string;
};

export type TarotPromptCard = {
  id: number;
  nameKo: string;
  nameEn: string;
  keywords: readonly string[];
  visualSymbols: readonly string[];
  symbolMeanings: readonly TarotCardSymbolMeaning[];
  mood: string;
  upright: TarotPromptCardMeaning;
  reversed: TarotPromptCardMeaning;
};

export type TarotReadingPromptCardInput = {
  position: TarotReadingPosition;
  orientation: TarotReadingOrientation;
  card: TarotPromptCard;
};

export type TarotQuestionPromptContext = {
  stateKey: string;
  stateLabel: string;
  questionKey: string;
  questionText: string;
};

export type TarotQuestionInterpretationLens = {
  domain: string;
  readThrough: string;
  preferTerms: readonly string[];
  avoidTerms: readonly string[];
};

export type TarotQuestionFrame = {
  type:
    | "inner_reflection"
    | "hidden_emotion"
    | "relationship_emotion"
    | "work_focus"
    | "practical_check"
    | "decision_standard"
    | "supportive_energy"
    | "daily_attention";
  answerGoal: string;
  paragraphRoles: readonly string[];
  keywordMode: string;
  closingGuidance: string;
  languageRegister?: string;
  phrasePalette?: readonly string[];
};

export type TarotReadingPromptInput = {
  appDate: string;
  locale?: "ko" | "en";
  spread: TarotReadingSpread;
  cards: TarotReadingPromptCardInput[];
  questionContext?: TarotQuestionPromptContext;
};

export type TarotReadingPrompt = {
  instructions: string;
  input: string;
};

function getSpreadContract(spread: TarotReadingSpread): string {
  if (spread === "daily_three_card") {
    return [
      "Use exactly three cardReadings in this order: situation, flow, advice.",
      "situation reads the visible current condition; flow reads the next change or pressure; advice reads a judgment criterion, not an action command.",
      "The overview must connect all three cards before the per-card readings.",
    ].join(" ");
  }

  if (spread === "question_one_card") {
    return "Use cardReadings as an empty array for question_one_card; answer the selected question through the one selected card in overview.";
  }

  return "Use cardReadings as an empty array for daily_one_card; put the full user-facing reading in overview.";
}

function getLengthContract(spread: TarotReadingSpread, locale: "ko" | "en"): string {
  if (locale === "en") {
    return spread === "daily_three_card"
      ? "overview 120 to 190 English words; each card reading 45 to 90 English words."
      : "overview 110 to 180 English words; cardReadings must be empty.";
  }

  return spread === "daily_three_card"
    ? "overview 350 to 620 Korean characters; each card reading 120 to 220 Korean characters."
    : "overview 360 to 620 Korean characters; cardReadings must be empty.";
}

function serializeCardMeaning(meaning: TarotPromptCardMeaning): TarotPromptCardMeaning {
  return {
    summary: meaning.summary,
    dailyFlow: meaning.dailyFlow,
    cardMessage: meaning.cardMessage,
    readingScene: meaning.readingScene,
  };
}

const fallbackQuestionInterpretationLens = {
  domain: "일상",
  readThrough: "오늘 실제로 알아차릴 수 있는 마음, 태도, 선택의 기준으로 읽습니다.",
  preferTerms: ["마음", "태도", "신호", "기준", "방향"],
  avoidTerms: ["예언", "확정", "정답", "운명"],
} satisfies TarotQuestionInterpretationLens;

const questionInterpretationLensByStateKey: Record<string, TarotQuestionInterpretationLens> = {
  mind_complex: {
    domain: "마음",
    readThrough: "내면의 감정, 인정하지 못한 마음, 생각의 반복, 편해질 단서로 읽습니다.",
    preferTerms: ["붙잡은 감정", "마음의 부담", "인정하기 어려운 마음", "편해질 단서", "내면의 신호"],
    avoidTerms: ["업무", "성과", "상대의 마음", "투자", "확정된 미래"],
  },
  relationship_concern: {
    domain: "관계",
    readThrough: "관계 안의 감정, 기대, 거리감, 태도, 마음의 온도로 읽습니다.",
    preferTerms: ["기대", "서운함", "거리감", "마음을 보태는 방식", "같은 방향", "엇갈린 태도"],
    avoidTerms: ["피드백", "프로젝트", "담당", "성과", "협업", "업무"],
  },
  work_blocked: {
    domain: "일",
    readThrough: "일의 진행, 막힌 원인, 집중할 지점, 다음으로 움직일 방향으로 읽습니다.",
    preferTerms: ["집중할 지점", "막힌 부분", "진행의 실마리", "다음 방향", "붙잡고 있는 일"],
    avoidTerms: ["상대의 마음", "서운함", "연애", "돈의 운", "확정된 결과"],
  },
  reality_anxiety: {
    domain: "현실",
    readThrough:
      "돈과 자원은 카드 상징을 먼저 통해 읽습니다. 돈, 시간, 체력, 도움, 이미 가진 기반, 조금씩 새는 흐름을 함께 봅니다.",
    preferTerms: ["조금씩 새는 자원", "이미 가진 기반", "미뤄둔 확인", "회복의 단서", "다시 붙잡을 수 있는 여유"],
    avoidTerms: ["호감", "상대의 태도", "감정 확인", "성과 평가", "예언", "손실 예고", "갑작스런 고지서", "심장이 조이는 느낌"],
  },
  decision_point: {
    domain: "선택",
    readThrough: "선택의 기준, 마음과 현실의 무게, 성급함, 책임의 크기로 읽습니다.",
    preferTerms: ["선택의 기준", "마음의 무게", "현실의 무게", "성급함", "감당할 책임"],
    avoidTerms: ["정답", "무조건", "확정", "운명", "당첨"],
  },
  daily_signal: {
    domain: "오늘",
    readThrough: "오늘 놓치지 말아야 할 신호, 하루의 분위기, 가볍게 볼 태도로 읽습니다.",
    preferTerms: ["오늘의 신호", "하루의 분위기", "가볍게 볼 지점", "주의할 장면", "도움 되는 기운"],
    avoidTerms: ["확정된 미래", "중대한 예언", "무조건", "운명", "정답"],
  },
};

const fallbackQuestionFrame = {
  type: "daily_attention",
  answerGoal: "선택한 질문에 맞춰 오늘 알아차릴 태도와 장면을 카드의 상징으로 읽습니다.",
  paragraphRoles: [
    "선택한 질문에 첫 문장에서 바로 답합니다.",
    "카드의 장면과 방향이 왜 그렇게 읽히는지 연결합니다.",
    "오늘 실제 생활에서 드러날 수 있는 장면을 말합니다.",
    "질문에 맞는 관점으로 부드럽게 닫습니다.",
  ],
  keywordMode: "오늘의 장면과 태도에 가까운 생활어",
  closingGuidance: "확정적인 조언 대신 오늘 붙잡을 관점으로 마무리합니다.",
} satisfies TarotQuestionFrame;

const questionFrameByStateKey: Record<string, TarotQuestionFrame> = {
  mind_complex: {
    type: "inner_reflection",
    answerGoal:
      "지금 마음에 남아 있는 감정이나 생각을 말합니다. 정답처럼 분석하지 않고, 사용자가 무엇을 붙잡고 있는지 카드 상징으로 읽습니다.",
    paragraphRoles: [
      "지금 무엇이 마음에 걸려 있는지 첫 문장에서 바로 말합니다.",
      "카드의 장면과 방향이 그 감정이나 생각을 어떻게 비추는지 연결합니다.",
      "오늘 몸의 반응, 반복되는 생각, 말하지 못한 속마음에서 드러날 수 있는 장면을 말합니다.",
      "당장 해결해야 할 문제로 몰지 말고, 지금 마음을 알아차리는 말로 마무리합니다.",
    ],
    keywordMode: "감정과 생활 감각에 가까운 짧은 말",
    closingGuidance: "당장 해결해야 할 문제로 몰지 말고, 지금 마음을 알아차리는 말로 마무리합니다.",
    languageRegister: "상담 기록이 아니라 타로 리더가 가까이 앉아 말해주는 생활어로 씁니다.",
    phrasePalette: [
      "자꾸 돌아오는 생각",
      "마음이 걸리는 지점",
      "겉으로는 괜찮은 척함",
      "쉽게 내려놓지 못함",
      "몸이 먼저 아는 피로",
    ],
  },
  relationship_concern: {
    type: "relationship_emotion",
    answerGoal:
      "두 사람 사이에 남아 있는 마음을 말합니다. 상대의 속마음을 단정하지 않고, 관계 안에서 느껴지는 분위기와 감정의 방향을 읽습니다.",
    paragraphRoles: [
      "지금 두 사람 사이에 어떤 마음이 남아 있는지 바로 말합니다.",
      "카드의 상징을 관계 안의 말, 침묵, 거리감, 기대 같은 장면으로 풀어 말합니다.",
      "오늘 그 마음이 어떤 태도나 대화 방식으로 드러날 수 있는지 말합니다.",
      "상대의 마음을 확정하지 말고, 두 사람이 살펴볼 감정으로 마무리합니다.",
    ],
    keywordMode: "카드 사전어가 아니라 관계 안에서 느껴지는 마음과 태도",
    closingGuidance: "누가 옳은지보다 어떤 마음을 꺼내기 어려운지로 마무리합니다.",
    languageRegister: "관계 분석 보고서가 아니라 타로 리더가 말해주는 다정하고 직접적인 생활어로 씁니다.",
    phrasePalette: [
      "마음을 쉽게 꺼내지 못함",
      "먼저 무너지기 싫은 마음",
      "서운한데 단단한 척함",
      "가까워지고 싶지만 선을 세움",
      "말보다 태도로 버티는 분위기",
    ],
  },
  work_blocked: {
    type: "work_focus",
    answerGoal: "일의 진행에서 막힌 부분과 오늘 집중할 지점을 카드의 상징으로 읽습니다.",
    paragraphRoles: [
      "일에서 막혀 있거나 집중해야 할 지점을 첫 문장에서 말합니다.",
      "카드의 장면과 방향이 진행 상황을 어떻게 비추는지 연결합니다.",
      "오늘 업무, 프로젝트, 일정에서 드러날 수 있는 장면을 말합니다.",
      "무리한 행동 지시 대신 다음 판단에 도움이 되는 초점으로 닫습니다.",
    ],
    keywordMode: "진행, 집중, 막힘을 드러내는 생활어",
    closingGuidance: "해야 할 일을 명령하지 말고 오늘 초점으로 마무리합니다.",
    languageRegister: "업무 보고서가 아니라 카드 리더가 말해주는 생활어로 씁니다.",
    phrasePalette: [
      "혼자 안고 있던 일",
      "말로만 지나간 약속",
      "누가 맡았는지",
      "밖으로 꺼내야 할 부분",
      "일이 덜 꼬이게 하는 정리",
    ],
  },
  reality_anxiety: {
    type: "practical_check",
    answerGoal:
      "돈이나 자원에서 놓치고 있는 흐름을 카드 상징으로 먼저 읽습니다. 손실을 예고하지 않고, 이미 가진 것과 조금씩 새는 것을 함께 봅니다.",
    paragraphRoles: [
      "첫 문장은 질문에 답하되, 점검 항목을 나열하지 말고 놓치고 있는 자원의 성격을 말합니다.",
      "카드의 상징이 돈, 시간, 체력, 도움, 회복감 중 무엇을 비추는지 연결합니다.",
      "현실에서 확인할 수 있는 항목은 1~2개만 짚고, 은행/계약/지출 같은 실무 예시는 카드 상징이 뒷받침할 때만 사용합니다.",
      "불안한 예고가 아니라 남아 있는 기반을 다시 보는 문장으로 마무리합니다.",
    ],
    keywordMode: "자원의 흐름과 남아 있는 기반을 담은 생활어",
    closingGuidance: "불안한 예고가 아니라 남아 있는 기반을 다시 보는 말로 마무리합니다.",
    languageRegister: "점검표가 아니라 타로 리더가 카드 상징을 현실의 자원 흐름으로 풀어주는 생활어로 씁니다.",
    phrasePalette: [
      "조금씩 새는 자원",
      "이미 가진 기반",
      "미뤄둔 확인",
      "회복을 못 믿는 마음",
      "다시 붙잡을 수 있는 여유",
    ],
  },
  decision_point: {
    type: "decision_standard",
    answerGoal:
      "이 선택에서 지키고 싶은 것과 감수해야 할 것을 말합니다. 어느 쪽이 정답인지 판정하지 않고, 선택 뒤에 남을 생활의 변화를 읽습니다.",
    paragraphRoles: [
      "이 선택에서 무엇을 지키고 싶은지 첫 문장에서 말합니다.",
      "카드의 장면과 방향이 무엇을 감수해야 하는지, 어떤 책임을 남기는지 연결합니다.",
      "오늘 결정 과정에서 피하고 싶은 불편함이나 마음이 끌리는 쪽을 말합니다.",
      "정답이 아니라 선택 뒤에 감당할 기준으로 마무리합니다.",
    ],
    keywordMode: "선택 뒤에 남을 생활의 변화와 책임을 담은 생활어",
    closingGuidance: "정답이 아니라 선택 뒤에 감당할 기준으로 마무리합니다.",
    languageRegister: "판정문이 아니라 타로 리더가 선택 앞의 마음과 현실을 나란히 놓아주는 말투로 씁니다.",
    phrasePalette: [
      "지키고 싶은 것",
      "감수해야 할 것",
      "피하고 싶은 불편함",
      "결정 뒤에 남을 책임",
      "마음이 끌리는 쪽",
    ],
  },
  daily_signal: {
    type: "daily_attention",
    answerGoal:
      "오늘 눈에 들어올 장면과 가볍게 넘기면 안 되는 신호를 말합니다. 하루 전체를 예언하지 않고, 오늘 덜 흐트러지게 볼 지점을 읽습니다.",
    paragraphRoles: [
      "오늘 무엇을 놓치지 말아야 하는지 첫 문장에서 말합니다.",
      "카드의 장면과 방향이 하루의 분위기를 어떻게 비추는지 연결합니다.",
      "오늘 실제로 마주칠 수 있는 말, 분위기, 일정, 몸의 반응을 말합니다.",
      "하루 전체를 예언하지 말고, 오늘 덜 흐트러지게 볼 지점으로 마무리합니다.",
    ],
    keywordMode: "하루의 장면과 태도를 담은 생활어",
    closingGuidance: "하루 전체를 예언하지 말고 오늘 덜 흐트러지게 볼 지점으로 마무리합니다.",
    languageRegister: "운세 문구가 아니라 타로 리더가 하루의 장면을 짚어주는 생활어로 씁니다.",
    phrasePalette: [
      "오늘 눈에 들어올 장면",
      "가볍게 넘기면 안 되는 말",
      "반복해서 보이는 분위기",
      "몸이 먼저 알아차리는 신호",
      "하루를 덜 흐트러뜨리는 태도",
    ],
  },
};

const questionFrameByStateAndQuestionKey: Record<string, TarotQuestionFrame> = {
  "mind_complex:unrecognized_feeling": {
    type: "hidden_emotion",
    answerGoal: "사용자가 모른 척하고 있는 감정을 이름 붙이고, 그 감정이 왜 부담이 되었는지 부드럽게 해석합니다.",
    paragraphRoles: [
      "모른 척하고 있는 감정을 첫 문장에서 바로 말합니다.",
      "카드의 장면과 방향이 그 감정을 어떻게 비추는지 연결합니다.",
      "오늘 몸, 생각, 생활에서 그 감정이 드러나는 장면을 말합니다.",
      "감정을 해결하라고 몰아붙이지 않고 알아차림의 문장으로 닫습니다.",
    ],
    keywordMode: "감정과 생활 감각에 가까운 짧은 말",
    closingGuidance: "추상적인 깨달음으로 닫지 말고, 말하지 못한 감정이나 미뤄둔 표현을 알아차리는 문장으로 마무리합니다.",
  },
  "daily_signal:helpful_energy": {
    type: "supportive_energy",
    answerGoal: "오늘 도움으로 삼을 태도나 관점을 카드의 상징으로 읽습니다.",
    paragraphRoles: [
      "오늘 도움 되는 기운이나 태도를 첫 문장에서 말합니다.",
      "카드의 장면과 방향이 왜 그 태도를 돕는지 연결합니다.",
      "어떤 상황에서 그 태도가 힘이 되는지 말합니다.",
      "확인 기준이 아니라 오늘 도움으로 삼을 관점으로 닫습니다.",
    ],
    keywordMode: "도움 되는 태도와 하루의 힘을 담은 생활어",
    closingGuidance: "확인 기준이 아니라 오늘 도움으로 삼을 태도나 관점으로 마무리합니다.",
  },
};

function getQuestionInterpretationLens(
  questionContext: TarotQuestionPromptContext | undefined,
): TarotQuestionInterpretationLens | undefined {
  if (!questionContext) {
    return undefined;
  }

  return questionInterpretationLensByStateKey[questionContext.stateKey] ?? fallbackQuestionInterpretationLens;
}

function getQuestionFrame(questionContext: TarotQuestionPromptContext | undefined): TarotQuestionFrame | undefined {
  if (!questionContext) {
    return undefined;
  }

  return (
    questionFrameByStateAndQuestionKey[`${questionContext.stateKey}:${questionContext.questionKey}`] ??
    questionFrameByStateKey[questionContext.stateKey] ??
    fallbackQuestionFrame
  );
}

function getStyleContract(spread: TarotReadingSpread): string[] {
  const baseStyle = [
    "키워드는 보고서식 명사보다 생활어에 가까운 짧은 구절로 쓰세요. 좋은 예: 흔들린 기반, 오해가 풀리는 중, 다시 판단할 때. 피할 예: 구조의 드러남, 불확실성 해명, 과거 재평가.",
    "선택된 방향의 요약, 하루 분위기, 장면 설명, 상징 설명을 해석의 근거로 사용하세요.",
    "고정 카드 메시지는 앱이 별도로 보여줍니다. 같은 문장을 그대로 반복하거나 최종 조언처럼 다시 쓰지 마세요.",
    "카드의 그림 속 상징을 최소 1개 이상 자연스럽게 연결하되, 입력에 없는 상징은 만들지 마세요.",
    "키워드는 선택된 카드, 방향, 해석에서 나온 짧은 단어 3~5개만 사용하세요.",
    "한국어 키워드는 자연스러운 띄어쓰기를 유지하세요. 예: 희망의 단서, 억눌린 감정, 새 출발.",
    "선택된 카드, 정/역방향, 포지션을 바꾸지 마세요.",
    "의학, 법률, 금융, 실제 죽음, 고정된 미래 예언처럼 단정적인 말은 하지 마세요.",
    "마지막 행동 지시나 최종 조언을 만들지 마세요. 앱은 카드 사전의 카드 메시지를 별도로 보여줍니다.",
    "입력 데이터의 영문 항목명, 프롬프트, 로컬 데이터, 시스템 구조를 언급하지 마세요.",
    "금지어는 title, overview, heading, reading, keywords 모든 출력 필드에서 절대 사용하지 마세요: 차분, 조용, 작은 행동, 행동 하나, 충분합니다.",
    "흐름이라는 단어를 반복적인 마무리나 heading으로 남발하지 마세요. flow 포지션의 heading은 '이어지는 국면', '다음 장면', '뒤따르는 변화'처럼 구체적으로 쓰세요.",
  ];

  if (spread === "daily_three_card") {
    return [
      ...baseStyle,
      "세 장 리딩은 overview에서 세 카드의 관계를 먼저 하나의 장면으로 묶은 뒤 cardReadings를 작성하세요.",
      "세 장의 cardReadings는 situation=지금 드러난 조건, flow=뒤따르는 변화나 압력, advice=행동 지시가 아닌 판단 기준으로 구분하세요.",
      "각 카드의 기본 의미를 다시 설명하는 데 머물지 마세요. 세 장이 함께 놓였을 때 달라지는 관계와 역할을 설명하세요.",
      "조언 포지션도 명령형으로 쓰지 마세요. '~하세요', '~해보세요' 대신 '~가 판단 기준입니다'처럼 설명하세요.",
    ];
  }

  if (spread === "question_one_card") {
    return [
      ...baseStyle,
      "질문형 한 장 리딩은 선택한 질문을 직접 답하되, 예/아니오나 미래 단정으로 답하지 마세요.",
      "함께 제공된 질문 프레임의 답변 목적, 문단 역할, 마무리 방식을 우선 따르세요.",
      "질문 프레임에 languageRegister나 phrasePalette가 있으면 그 말투와 표현 결을 우선 사용하세요.",
      "overview는 4문장 안팎으로 구성하세요. 첫 문장은 선택한 질문에 바로 답하세요. 이후 문장은 질문 프레임의 역할 순서를 따라 카드 근거, 오늘 드러나는 장면, 질문에 맞는 마무리로 이어 쓰세요.",
      "모든 질문을 '신호→확인할 기준' 틀로 맞추지 마세요. 감정 질문은 알아차림으로, 도움 질문은 도움으로 삼을 관점으로, 현실 질문은 카드 상징이 가리키는 자원 흐름을 먼저 읽고 확인할 항목은 1~2개만 보조로 쓰세요.",
      "문장은 카드 리더가 직접 읽어주는 생활어로 쓰고, 추상 명사만 이어 붙인 보고서식 표현을 피하세요.",
      "불씨, 흐름, 에너지, 기준처럼 같은 상징어를 두 번 이상 반복하지 마세요.",
      "질문형 한 장 리딩의 키워드는 정확히 3개로 쓰고, 같은 어근이나 같은 감정어를 반복하지 마세요.",
    ];
  }

  return [
    ...baseStyle,
    "한 장 리딩은 cardReadings를 빈 배열로 두고 overview 안에서 카드 장면, 오늘의 상태, 주의해서 볼 지점을 자연스럽게 이어 쓰세요.",
  ];
}

function getInstructionContract(spread: TarotReadingSpread, locale: "ko" | "en"): string[] {
  const baseInstructions = [
    "당신은 만양의 타로 리딩 문장을 작성합니다.",
    "앱이 이미 카드, 포지션, 정방향/역방향을 정했습니다. 절대 다른 카드나 방향으로 바꾸지 마세요.",
    "카드의 상징 설명과 선택된 방향의 장면 설명을 중심 자료로 사용하세요.",
    "고정 카드 메시지는 결과 화면에서 따로 노출됩니다. 같은 문장을 반복하지 말고 본문 해석은 카드들의 관계와 상징 해석에 집중하세요.",
    "사용자는 타로 해석을 원합니다. 장면 묘사만 길게 쓰지 말고, 카드 그림이 오늘의 상태를 어떻게 비추는지 설명하세요.",
  ];
  const spreadInstructions =
    spread === "daily_three_card"
      ? [
          "heading은 position에 맞는 고정 문구만 사용하세요: situation=지금 드러난 조건, flow=이어지는 국면, advice=판단의 기준.",
          "세 장 리딩은 overview에서 세 장의 관계를 먼저 읽고, cardReadings에서는 각 포지션이 맡은 역할만 분명히 나누세요.",
          "세 장 리딩의 situation은 지금 드러난 조건, flow는 뒤따르는 변화나 압력, advice는 행동 지시가 아닌 판단 기준으로 쓰세요.",
          "각 카드의 기본 의미를 다시 설명하는 데 머물지 말고, 고정 카드 메시지와 같은 말을 반복하지 마세요.",
          "advice 포지션도 '~하세요', '~해보세요' 같은 명령형 대신 '~가 판단 기준입니다'처럼 기준을 설명하세요.",
        ]
      : spread === "question_one_card"
        ? [
            "한 장 리딩에서는 cardReadings를 만들지 마세요. overview가 사용자에게 보이는 본문입니다.",
            "선택한 질문을 카드의 상징과 방향으로 읽되, 예/아니오나 확정 예언으로 답하지 마세요.",
            "카드의 기본 의미를 질문 카테고리의 생활 영역 언어로 바꾸어 쓰세요. 예를 들어 관계 질문은 감정과 기대의 언어로, 일 질문은 진행과 집중의 언어로 읽으세요.",
            "현실/돈 질문은 불안을 키우는 예고가 아니라 카드 상징이 비추는 돈, 시간, 체력, 도움, 남아 있는 기반을 먼저 읽으세요. 은행, 계약, 지출 같은 실무 예시는 카드 상징보다 앞세워 나열하지 마세요.",
            "결론은 질문 프레임의 마무리 방식에 맞추세요. 감정 질문은 알아차림으로, 도움 질문은 도움으로 삼을 태도로, 현실 질문은 확인 가능한 점검으로 닫습니다.",
          ]
        : [
            "한 장 리딩에서는 cardReadings를 만들지 마세요. overview가 사용자에게 보이는 본문입니다.",
            "한 장 리딩의 overview는 카드 장면에서 출발해 오늘의 상태와 사용자가 주의해서 볼 지점을 하나의 글로 이어 주세요.",
          ];
  const commonInstructions = [
    "모든 출력 필드에서 절대 사용하지 마세요: 차분, 조용, 작은 행동, 행동 하나, 충분합니다.",
    "정위치라는 말 대신 정방향이라고 쓰세요. 역위치라는 말 대신 역방향이라고 쓰세요.",
    "흐름이라는 단어를 반복적인 마무리나 heading으로 남발하지 마세요. flow 포지션의 heading은 '이어지는 국면'처럼 표현하세요.",
    "마지막 행동 지시나 최종 조언을 만들지 마세요. 앱은 카드 사전의 카드 메시지를 별도로 보여줍니다.",
    "입력 데이터의 영문 항목명이나 스키마 이름을 사용자 문장에 쓰지 마세요.",
    "금지어를 우회해 비슷한 자기계발식 문장으로 마무리하지 말고, 카드의 상징과 장면을 근거로 읽어 주세요.",
    "문장은 카드 리더가 직접 읽어주는 말처럼 쓰고, 시스템 설명이나 데이터 출처를 말하지 마세요.",
    `스키마를 정확히 지키는 ${locale === "en" ? "English" : "Korean"} JSON만 반환하세요.`,
  ];

  return [...baseInstructions, ...spreadInstructions, ...commonInstructions];
}

export function buildTarotReadingPrompt(input: TarotReadingPromptInput): TarotReadingPrompt {
  const locale = input.locale ?? "ko";
  const promptPayload = {
    locale,
    appDate: input.appDate,
    spread: input.spread,
    questionContext: input.questionContext,
    questionInterpretationLens:
      input.spread === "question_one_card" ? getQuestionInterpretationLens(input.questionContext) : undefined,
    questionFrame: input.spread === "question_one_card" ? getQuestionFrame(input.questionContext) : undefined,
    cards: input.cards.map((selection) => {
      const selectedMeaning = serializeCardMeaning(selection.card[selection.orientation]);

      return {
        position: selection.position,
        orientation: selection.orientation,
        card: {
          id: selection.card.id,
          nameKo: selection.card.nameKo,
          nameEn: selection.card.nameEn,
          keywords: selection.card.keywords,
          visualSymbols: selection.card.visualSymbols,
          symbolMeanings: selection.card.symbolMeanings,
          mood: selection.card.mood,
          selectedMeaning,
          upright: serializeCardMeaning(selection.card.upright),
          reversed: serializeCardMeaning(selection.card.reversed),
        },
      };
    }),
    outputContract: {
      spread: getSpreadContract(input.spread),
      length: getLengthContract(input.spread, locale),
      style: getStyleContract(input.spread),
    },
  };

  return {
    instructions: getInstructionContract(input.spread, locale).join("\n"),
    input: JSON.stringify(promptPayload),
  };
}
