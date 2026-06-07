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
            minLength: 1,
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

export type TarotReadingSpread = "daily_one_card" | "daily_three_card";
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

export type TarotReadingPromptInput = {
  appDate: string;
  locale?: "ko" | "en";
  spread: TarotReadingSpread;
  cards: TarotReadingPromptCardInput[];
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

function getStyleContract(spread: TarotReadingSpread): string[] {
  const baseStyle = [
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
          "세 장 리딩은 overview에서 세 장의 관계를 먼저 읽고, cardReadings에서는 각 포지션이 맡은 역할만 분명히 나누세요.",
          "세 장 리딩의 situation은 지금 드러난 조건, flow는 뒤따르는 변화나 압력, advice는 행동 지시가 아닌 판단 기준으로 쓰세요.",
          "각 카드의 기본 의미를 다시 설명하는 데 머물지 말고, 고정 카드 메시지와 같은 말을 반복하지 마세요.",
          "advice 포지션도 '~하세요', '~해보세요' 같은 명령형 대신 '~가 판단 기준입니다'처럼 기준을 설명하세요.",
        ]
      : [
          "한 장 리딩에서는 cardReadings를 만들지 마세요. overview가 사용자에게 보이는 본문입니다.",
          "한 장 리딩의 overview는 카드 장면에서 출발해 오늘의 상태와 사용자가 주의해서 볼 지점을 하나의 글로 이어 주세요.",
        ];
  const commonInstructions = [
    "모든 출력 필드에서 절대 사용하지 마세요: 차분, 조용, 작은 행동, 행동 하나, 충분합니다.",
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
