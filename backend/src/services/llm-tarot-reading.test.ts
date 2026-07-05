import { describe, expect, test, vi } from "vitest";

import { buildTarotReadingPrompt, TAROT_READING_DRAFT_JSON_SCHEMA } from "./tarot-reading-prompt";
import { LlmProviderTimeoutError, type DreamReadingLlmProvider, type DreamReadingLlmRequest } from "./llm-provider";
import { generateTarotReadingForUser, type TarotReadingInput } from "./llm-tarot-reading";

function createTarotCard(id: number, nameKo: string) {
  return {
    id,
    nameKo,
    nameEn: `CARD ${id}`,
    keywords: ["focus", "choice"],
    visualSymbols: ["빛", "문"],
    symbolMeanings: [
      {
        symbol: "빛",
        meaning: "이미 드러난 부분과 아직 보이지 않는 부분 사이의 차이를 비춥니다.",
      },
      {
        symbol: "문",
        meaning: "한 장면에서 다음 장면으로 넘어가는 경계를 뜻합니다.",
      },
    ],
    mood: "밝지만 긴장이 남아 있는 카드 분위기입니다.",
    upright: {
      summary: "정방향 요약",
      dailyFlow: "정방향 하루 흐름",
      cardMessage: "정방향 카드 메시지",
      readingScene: "정방향 장면은 이미 보이는 단서가 다음 선택의 기준이 되는 모습을 보여줍니다.",
      reflectionQuestion: "무엇이 이미 드러나 있나요?",
      smallAction: "보이는 일을 하나 실행하세요.",
    },
    reversed: {
      summary: "역방향 요약",
      dailyFlow: "역방향 하루 흐름",
      cardMessage: "역방향 카드 메시지",
      readingScene: "역방향 장면은 생각이 흩어진 채 문턱 앞에서 머무르는 모습을 보여줍니다.",
      reflectionQuestion: "무엇을 미루고 있나요?",
      smallAction: "방해 요소 하나를 치우세요.",
    },
  };
}

const oneCardInput = {
  appDate: "2026-05-31",
  locale: "ko",
  spread: "daily_one_card",
  cards: [
    {
      position: "today",
      orientation: "upright",
      card: createTarotCard(0, "바보"),
    },
  ],
} satisfies TarotReadingInput;

const questionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "mind_complex",
    stateLabel: "마음이 복잡해",
    questionKey: "held_feeling",
    questionText: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
  },
} satisfies TarotReadingInput;

const hiddenEmotionQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "mind_complex",
    stateLabel: "내 마음이 궁금해",
    questionKey: "unrecognized_feeling",
    questionText: "내가 모른 척하고 있는 감정은 뭘까?",
  },
} satisfies TarotReadingInput;

const relationshipQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "relationship_concern",
    stateLabel: "관계가 신경 쓰여",
    questionKey: "between_us",
    questionText: "상대와 나 사이에 놓인 감정은?",
  },
} satisfies TarotReadingInput;

const workQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "work_blocked",
    stateLabel: "일이 막힌 느낌이야",
    questionKey: "focus_point",
    questionText: "오늘 내가 집중해야 할 핵심은?",
  },
} satisfies TarotReadingInput;

const realityQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "reality_anxiety",
    stateLabel: "돈이나 현실이 불안해",
    questionKey: "next_practical_check",
    questionText: "현실적으로 다음에 확인해야 할 건?",
  },
} satisfies TarotReadingInput;

const decisionQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "decision_point",
    stateLabel: "결정해야 할 일이 있어",
    questionKey: "real_criterion",
    questionText: "이 선택에서 먼저 봐야 할 건 뭐야?",
  },
} satisfies TarotReadingInput;

const dailyQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "daily_signal",
    stateLabel: "오늘 하루가 궁금해",
    questionKey: "missed_signal",
    questionText: "오늘 내가 놓치지 말아야 할 건 뭐야?",
  },
} satisfies TarotReadingInput;

const helpfulEnergyQuestionOneCardInput = {
  ...oneCardInput,
  spread: "question_one_card",
  questionContext: {
    stateKey: "daily_signal",
    stateLabel: "오늘 하루가 궁금해",
    questionKey: "helpful_energy",
    questionText: "오늘 나를 도와줄 기운은 뭐야?",
  },
} satisfies TarotReadingInput;

const threeCardInput = {
  appDate: "2026-05-31",
  locale: "ko",
  spread: "daily_three_card",
  cards: [
    {
      position: "situation",
      orientation: "upright",
      card: createTarotCard(1, "마법사"),
    },
    {
      position: "flow",
      orientation: "reversed",
      card: createTarotCard(2, "여사제"),
    },
    {
      position: "advice",
      orientation: "upright",
      card: createTarotCard(3, "여황제"),
    },
  ],
} satisfies TarotReadingInput;

function createProvider(response: unknown): DreamReadingLlmProvider & { requests: DreamReadingLlmRequest[] } {
  const requests: DreamReadingLlmRequest[] = [];

  return {
    requests,
    async generateJson(request) {
      requests.push(request);

      return response;
    },
  };
}

const generatedDisplayFields = {
  keywords: ["시작", "선택", "관찰"],
};

describe("generateTarotReadingForUser", () => {
  test("returns unavailable without local fallback copy when provider is missing", async () => {
    await expect(generateTarotReadingForUser(oneCardInput)).resolves.toEqual({
      status: "unavailable",
      reason: "provider_missing",
      retryable: false,
    });
  });

  test("constrains three-card drafts to fixed headings and conversational keyword wording", () => {
    const prompt = buildTarotReadingPrompt(threeCardInput);
    const input = JSON.parse(prompt.input) as {
      outputContract?: { style?: string[] };
    };
    const styleContract = input.outputContract?.style?.join("\n") ?? "";
    const cardReadingsSchema = TAROT_READING_DRAFT_JSON_SCHEMA.properties.cardReadings as {
      items?: { properties?: { heading?: { enum?: readonly string[] } } };
    };

    expect(cardReadingsSchema.items?.properties?.heading?.enum).toEqual([
      "지금 드러난 조건",
      "이어지는 국면",
      "판단의 기준",
    ]);
    expect(prompt.instructions).toContain("heading은 position에 맞는 고정 문구만 사용하세요");
    expect(styleContract).toContain("키워드는 보고서식 명사보다 생활어에 가까운 짧은 구절로 쓰세요");
    expect(styleContract).toContain("흔들린 기반");
    expect(styleContract).toContain("오해가 풀리는 중");
    expect(styleContract).toContain("다시 판단할 때");
    expect(styleContract).toContain("구조의 드러남");
    expect(styleContract).toContain("불확실성 해명");
    expect(styleContract).toContain("과거 재평가");
  });

  test("generates a one-card tarot reading from overview-focused provider JSON", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "오늘은 첫 장면을 여는 날",
      overview:
        "바보 카드의 정방향은 아직 모든 조건이 정리되지 않았어도 새 장면 앞에 선 마음을 비춥니다. 절벽 끝의 여행자는 확신보다 열린 감각을 먼저 들고 있고, 작은 보따리는 지금 손에 있는 경험만으로도 하루를 시작할 수 있음을 보여줍니다.",
      cardReadings: [],
      advice: "이 provider advice는 결과에 포함되지 않아야 합니다.",
    });

    const result = await generateTarotReadingForUser(oneCardInput, { provider, providerTimeoutMs: 1200 });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        title: "오늘은 첫 장면을 여는 날",
        overview: expect.stringContaining("바보 카드의 정방향"),
        cardReadings: [],
      },
    });
    expect(provider.requests[0]).toMatchObject({
      schemaName: "tarot_reading_draft",
      timeoutMs: 1200,
    });

    const request = provider.requests[0];
    const input = JSON.parse(request?.input ?? "{}") as {
      outputContract?: { spread?: string; length?: string; style?: string[] };
    };
    const styleContract = input.outputContract?.style?.join("\n") ?? "";

    expect(request?.input).toContain("바보");
    expect(request?.input).toContain("symbolMeanings");
    expect(request?.input).toContain("정방향 장면은 이미 보이는 단서가 다음 선택의 기준이 되는 모습을 보여줍니다.");
    expect(request?.input).toContain("cardMessage");
    expect(request?.input).toContain("readingScene");
    expect(request?.input).not.toContain("selectedMeaning.story");
    expect(request?.input).not.toContain("무엇이 이미 드러나 있나요?");
    expect(request?.input).not.toContain("보이는 일을 하나 실행하세요.");
    expect(input.outputContract?.spread).toContain("cardReadings as an empty array");
    expect(input.outputContract?.length).toContain("cardReadings must be empty");
    expect(styleContract).toContain("한 장 리딩은 cardReadings를 빈 배열로 두고 overview");
    expect(styleContract).not.toContain("세 장 리딩은 overview에서 세 카드의 관계");
    expect(styleContract).not.toMatch(/\b(?:selectedMeaning|readingScene|symbolMeanings|visualSymbols|cardMessage|dailyFlow|outputContract)\b/u);
    expect(styleContract).toContain("한국어 키워드는 자연스러운 띄어쓰기를 유지");
    expect(styleContract).toContain("차분, 조용, 작은 행동, 행동 하나, 충분합니다");
    expect(styleContract).not.toContain("차분, 조용, 흐름, 작은 행동");
    expect(request?.instructions).toContain("한 장 리딩에서는 cardReadings를 만들지 마세요");
    expect(request?.instructions).toContain("overview가 사용자에게 보이는 본문입니다");
    expect(request?.instructions).not.toContain("세 장 리딩은 overview에서 세 장의 관계");
    expect(request?.instructions).not.toMatch(/\b(?:selectedMeaning|readingScene|symbolMeanings|visualSymbols|cardMessage|dailyFlow|outputContract)\b/u);
    expect(request?.instructions).not.toContain("You are Manyang's production tarot-reading engine.");
  });

  test("builds question one-card prompts with selected question context", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "질문을 비추는 카드",
      overview:
        "선택한 질문을 카드의 장면과 연결해 읽는 본문입니다. 질문의 맥락을 벗어나지 않고 오늘 확인할 기준을 보여줍니다.",
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(questionOneCardInput, { provider })).resolves.toMatchObject({
      status: "ok",
      reading: { cardReadings: [] },
    });

    const request = provider.requests[0];
    expect(request?.input).toContain("오늘 내 마음이 붙잡고 있는 건 뭐야?");
    expect(request?.instructions).toContain("선택한 질문");
  });

  test("adds a relationship interpretation lens for relationship questions", () => {
    const prompt = buildTarotReadingPrompt(relationshipQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionInterpretationLens?: {
        domain?: string;
        readThrough?: string;
        preferTerms?: string[];
        avoidTerms?: string[];
      };
    };

    expect(input.questionInterpretationLens).toMatchObject({
      domain: "관계",
      readThrough: expect.stringContaining("감정"),
      preferTerms: expect.arrayContaining(["기대", "서운함", "거리감", "마음을 보태는 방식", "엇갈린 태도"]),
      avoidTerms: expect.arrayContaining(["피드백", "프로젝트", "담당", "성과", "협업"]),
    });
    expect(prompt.instructions).toContain("카드의 기본 의미를 질문 카테고리의 생활 영역 언어로 바꾸어 쓰세요");
  });

  test("uses direct relationship reading language for relationship emotion questions", () => {
    const prompt = buildTarotReadingPrompt(relationshipQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        keywordMode?: string;
        closingGuidance?: string;
        languageRegister?: string;
        phrasePalette?: string[];
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "relationship_emotion",
      answerGoal: expect.stringContaining("두 사람 사이에 남아 있는 마음"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("어떤 마음이 남아 있는지"),
        expect.stringContaining("말, 침묵, 거리감, 기대"),
        expect.stringContaining("상대의 마음을 확정하지 말고"),
      ]),
      keywordMode: expect.stringContaining("관계 안에서 느껴지는 마음과 태도"),
      closingGuidance: expect.stringContaining("어떤 마음을 꺼내기 어려운지"),
      languageRegister: expect.stringContaining("관계 분석 보고서가 아니라"),
      phrasePalette: expect.arrayContaining([
        "마음을 쉽게 꺼내지 못함",
        "먼저 무너지기 싫은 마음",
        "서운한데 단단한 척함",
        "가까워지고 싶지만 선을 세움",
        "말보다 태도로 버티는 분위기",
      ]),
    });
    expect(input.questionFrame?.answerGoal).not.toContain("정서적 긴장");
  });

  test("uses direct inner language for general mind questions", () => {
    const prompt = buildTarotReadingPrompt(questionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        closingGuidance?: string;
        languageRegister?: string;
        phrasePalette?: string[];
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "inner_reflection",
      answerGoal: expect.stringContaining("지금 마음에 남아 있는 감정이나 생각"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("무엇이 마음에 걸려 있는지"),
        expect.stringContaining("몸의 반응, 반복되는 생각"),
      ]),
      closingGuidance: expect.stringContaining("당장 해결해야 할 문제로 몰지"),
      languageRegister: expect.stringContaining("상담 기록이 아니라"),
      phrasePalette: expect.arrayContaining([
        "자꾸 돌아오는 생각",
        "마음이 걸리는 지점",
        "겉으로는 괜찮은 척함",
        "쉽게 내려놓지 못함",
        "몸이 먼저 아는 피로",
      ]),
    });
  });

  test("uses concrete reality reading language for practical check questions", () => {
    const prompt = buildTarotReadingPrompt(realityQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        closingGuidance?: string;
        languageRegister?: string;
        phrasePalette?: string[];
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "practical_check",
      answerGoal: expect.stringContaining("돈이나 자원에서 놓치고 있는 흐름"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("점검 항목을 나열하지 말고"),
        expect.stringContaining("돈, 시간, 체력, 도움, 회복감"),
        expect.stringContaining("1~2개만"),
      ]),
      closingGuidance: expect.stringContaining("남아 있는 기반"),
      languageRegister: expect.stringContaining("점검표가 아니라"),
      phrasePalette: expect.arrayContaining([
        "조금씩 새는 자원",
        "이미 가진 기반",
        "미뤄둔 확인",
        "회복을 못 믿는 마음",
        "다시 붙잡을 수 있는 여유",
      ]),
    });
  });

  test("uses concrete decision reading language for decision questions", () => {
    const prompt = buildTarotReadingPrompt(decisionQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        keywordMode?: string;
        closingGuidance?: string;
        languageRegister?: string;
        phrasePalette?: string[];
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "decision_standard",
      answerGoal: expect.stringContaining("지키고 싶은 것과 감수해야 할 것"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("무엇을 지키고 싶은지"),
        expect.stringContaining("무엇을 감수해야 하는지"),
        expect.stringContaining("피하고 싶은 불편함"),
      ]),
      keywordMode: expect.stringContaining("선택 뒤에 남을 생활의 변화"),
      closingGuidance: expect.stringContaining("정답이 아니라"),
      languageRegister: expect.stringContaining("판정문이 아니라"),
      phrasePalette: expect.arrayContaining([
        "지키고 싶은 것",
        "감수해야 할 것",
        "피하고 싶은 불편함",
        "결정 뒤에 남을 책임",
        "마음이 끌리는 쪽",
      ]),
    });
  });

  test("uses concrete daily reading language for daily signal questions", () => {
    const prompt = buildTarotReadingPrompt(dailyQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        closingGuidance?: string;
        languageRegister?: string;
        phrasePalette?: string[];
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "daily_attention",
      answerGoal: expect.stringContaining("오늘 눈에 들어올 장면"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("오늘 무엇을 놓치지 말아야 하는지"),
        expect.stringContaining("말, 분위기, 일정, 몸의 반응"),
      ]),
      closingGuidance: expect.stringContaining("하루 전체를 예언하지"),
      languageRegister: expect.stringContaining("운세 문구가 아니라"),
      phrasePalette: expect.arrayContaining([
        "오늘 눈에 들어올 장면",
        "가볍게 넘기면 안 되는 말",
        "반복해서 보이는 분위기",
        "몸이 먼저 알아차리는 신호",
        "하루를 덜 흐트러뜨리는 태도",
      ]),
    });
  });

  test("uses different interpretation language for relationship and work questions", () => {
    const relationshipPrompt = buildTarotReadingPrompt(relationshipQuestionOneCardInput);
    const workPrompt = buildTarotReadingPrompt(workQuestionOneCardInput);
    const relationshipInput = JSON.parse(relationshipPrompt.input) as {
      questionInterpretationLens?: { preferTerms?: string[]; avoidTerms?: string[] };
    };
    const workInput = JSON.parse(workPrompt.input) as {
      questionInterpretationLens?: { preferTerms?: string[]; avoidTerms?: string[] };
    };

    expect(relationshipInput.questionInterpretationLens?.preferTerms).toContain("마음을 보태는 방식");
    expect(relationshipInput.questionInterpretationLens?.avoidTerms).toContain("업무");
    expect(workInput.questionInterpretationLens?.preferTerms).toContain("집중할 지점");
    expect(workInput.questionInterpretationLens?.avoidTerms).toContain("상대의 마음");
  });

  test("adds a grounded reality lens that avoids alarming money predictions", () => {
    const prompt = buildTarotReadingPrompt(realityQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionInterpretationLens?: {
        readThrough?: string;
        preferTerms?: string[];
        avoidTerms?: string[];
      };
    };

    expect(input.questionInterpretationLens?.readThrough).toContain("카드 상징을 먼저");
    expect(input.questionInterpretationLens?.readThrough).toContain("돈, 시간, 체력, 도움");
    expect(input.questionInterpretationLens?.preferTerms).toEqual(
      expect.arrayContaining(["조금씩 새는 자원", "이미 가진 기반", "회복의 단서"]),
    );
    expect(input.questionInterpretationLens?.avoidTerms).toEqual(
      expect.arrayContaining(["손실 예고", "갑작스런 고지서", "심장이 조이는 느낌"]),
    );
    expect(prompt.instructions).toContain("현실/돈 질문은 불안을 키우는 예고가 아니라");
    expect(prompt.instructions).toContain("은행, 계약, 지출 같은 실무 예시는 카드 상징보다 앞세워 나열하지 마세요");
  });

  test("adds question one-card style guidance for natural symbolic Korean copy", () => {
    const prompt = buildTarotReadingPrompt(questionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      outputContract?: { style?: string[] };
    };
    const styleContract = input.outputContract?.style?.join("\n") ?? "";

    expect(styleContract).toContain("첫 문장은 선택한 질문에 바로 답하세요");
    expect(styleContract).toContain("질문 프레임의 답변 목적");
    expect(styleContract).toContain("모든 질문을 '신호→확인할 기준' 틀로 맞추지 마세요");
    expect(styleContract).toContain("질문에 맞는 마무리");
    expect(styleContract).not.toContain("오늘 실제로 알아차릴 수 있는 신호, 오늘 확인할 기준 순서");
    expect(styleContract).not.toContain("어색한 예: 불씨의 흥분");
    expect(styleContract).toContain("같은 상징어를 두 번 이상 반복하지 마세요");
    expect(prompt.instructions).toContain("정위치라는 말 대신 정방향이라고 쓰세요");
  });

  test("adds a hidden emotion question frame for unrecognized feeling questions", () => {
    const prompt = buildTarotReadingPrompt(hiddenEmotionQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        keywordMode?: string;
        closingGuidance?: string;
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "hidden_emotion",
      answerGoal: expect.stringContaining("모른 척하고 있는 감정"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("감정을 첫 문장에서 바로 말합니다"),
        expect.stringContaining("알아차림의 문장으로 닫습니다"),
      ]),
      keywordMode: expect.stringContaining("감정"),
      closingGuidance: expect.stringContaining("말하지 못한 감정이나 미뤄둔 표현"),
    });
    expect(input.questionFrame?.closingGuidance).not.toContain("내면의 단서");
  });

  test("uses a supportive energy frame instead of a fixed criteria ending", () => {
    const prompt = buildTarotReadingPrompt(helpfulEnergyQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        paragraphRoles?: string[];
        closingGuidance?: string;
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "supportive_energy",
      answerGoal: expect.stringContaining("도움으로 삼을 태도"),
      paragraphRoles: expect.arrayContaining([
        expect.stringContaining("도움 되는 기운"),
        expect.stringContaining("도움으로 삼을 관점"),
      ]),
      closingGuidance: expect.stringContaining("확인 기준이 아니라"),
    });
  });

  test("uses a softer work focus frame for focus point questions", () => {
    const prompt = buildTarotReadingPrompt(workQuestionOneCardInput);
    const input = JSON.parse(prompt.input) as {
      questionFrame?: {
        type?: string;
        answerGoal?: string;
        languageRegister?: string;
        phrasePalette?: string[];
        closingGuidance?: string;
      };
    };

    expect(input.questionFrame).toMatchObject({
      type: "work_focus",
      answerGoal: expect.stringContaining("오늘 집중할 지점"),
      languageRegister: expect.stringContaining("업무 보고서가 아니라"),
      phrasePalette: expect.arrayContaining([
        "혼자 안고 있던 일",
        "말로만 지나간 약속",
        "누가 맡았는지",
        "밖으로 꺼내야 할 부분",
        "일이 덜 꼬이게 하는 정리",
      ]),
      closingGuidance: expect.stringContaining("오늘 초점"),
    });
  });

  test("normalizes question one-card orientation wording and awkward repeated keywords", async () => {
    const provider = createProvider({
      title: "정위치 완드 에이스",
      overview:
        "오늘 카드는 정위치의 완드 에이스입니다. 시각적으로는 불타는 완드와 시작의 씨앗이 중심을 이루는데, 지금 당신에게 중요한 건 아이디어의 결과가 아니라 그 불씨가 실제로 살아있느냐는 점입니다. 일이 막힌 느낌 속에서도 새 가능성의 흥분이 올라오면 그것이 집중의 신호가 됩니다.",
      keywords: ["불씨의 흥분", "새 가능성", "지속되는 흥분"],
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(questionOneCardInput, { provider })).resolves.toMatchObject({
      status: "ok",
      reading: {
        title: "정방향 완드 에이스",
        overview: expect.not.stringContaining("정위치"),
        keywords: ["시작의 불씨", "새 가능성", "남은 의욕"],
      },
    });
  });

  test("rejects one-card provider JSON that still returns per-card readings", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "오늘은 첫 장면을 여는 날",
      overview:
        "바보 카드의 정방향은 새 장면 앞에 선 마음을 비춥니다. 절벽 끝의 여행자는 확신보다 열린 감각을 먼저 들고 있고, 작은 보따리는 지금 손에 있는 경험만으로도 하루를 시작할 수 있음을 보여줍니다.",
      cardReadings: [
        {
          position: "today",
          heading: "오늘",
          reading: "이 필드는 한 장 리딩에서 더 이상 생성하면 안 되는 카드별 본문입니다.",
        },
      ],
    });

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("requests tarot drafts without a final advice field", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "A small opening",
      overview: "The selected card points to a day where a small opening matters more than a perfect answer.",
      cardReadings: [],
      advice: "This provider advice should not be part of the tarot draft contract.",
    });

    await generateTarotReadingForUser(oneCardInput, { provider });

    const schema = provider.requests[0]?.jsonSchema as
      | { properties?: Record<string, unknown>; required?: string[] }
      | undefined;

    expect(schema?.properties).not.toHaveProperty("advice");
    expect(schema?.required).not.toContain("advice");
    expect(schema?.properties?.cardReadings).toMatchObject({ minItems: 0 });
    expect(provider.requests[0]?.input).not.toContain("advice one practical sentence");
    expect(provider.requests[0]?.instructions).toContain("마지막 행동 지시나 최종 조언을 만들지 마세요");
  });

  test("accepts concise one-card provider JSON without symbolic reading fields", async () => {
    const provider = createProvider({
      title: "A small opening",
      overview: "The selected card points to a day where a small opening matters more than a perfect answer.",
      keywords: ["opening", "choice", "attention"],
      cardReadings: [],
    });

    const result = await generateTarotReadingForUser(oneCardInput, { provider });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        keywords: ["opening", "choice", "attention"],
        cardReadings: [],
      },
    });
    expect(result).not.toMatchObject({
      reading: {
        advice: expect.any(String),
      },
    });
  });

  test("rejects one-card provider JSON without display keywords", async () => {
    const provider = createProvider({
      title: "Missing keyword fields",
      overview: "The card gives a readable daily tarot overview, but it omits the display keyword contract.",
      cardReadings: [],
      advice: "Choose one small action and review the result before deciding the next step.",
    });

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("rejects provider JSON that leaks prompt-internal field names into user-facing copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "내부 필드가 섞인 리딩",
      overview:
        "바보 카드의 장면은 새 출발을 비추지만 selectedMeaning이 가리키듯 내부 데이터 이름이 사용자 본문에 노출되고 있습니다.",
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("rejects provider JSON that leaks schema contract names into user-facing copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "계약 이름이 섞인 리딩",
      overview:
        "바보 카드의 장면은 새 출발을 비추지만 outputContract라는 스키마 이름이 사용자 본문에 노출되고 있습니다.",
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("rejects provider JSON that leaks question lens field names into user-facing copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "질문 렌즈가 섞인 리딩",
      overview:
        "바보 카드의 장면은 새 출발을 비추지만 questionInterpretationLens라는 내부 항목명이 사용자 본문에 노출되고 있습니다.",
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(relationshipQuestionOneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("rejects provider JSON that leaks question frame field names into user-facing copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "질문 프레임이 섞인 리딩",
      overview:
        "바보 카드의 장면은 새 출발을 비추지만 questionFrame과 paragraphRoles라는 내부 항목명이 사용자 본문에 노출되고 있습니다.",
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(hiddenEmotionQuestionOneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("rejects provider JSON that leaks question frame register field names into user-facing copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "질문 프레임 말투가 섞인 리딩",
      overview:
        "바보 카드의 장면은 새 출발을 비추지만 languageRegister와 phrasePalette라는 내부 항목명이 사용자 본문에 노출되고 있습니다.",
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(workQuestionOneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("normalizes cramped Korean display keywords before returning the reading", async () => {
    const provider = createProvider({
      title: "별빛이 다시 보이는 날",
      overview:
        "별 카드의 정방향은 아직 모든 것이 회복되었다고 말하지 않지만, 큰 별빛과 고요한 물이 마음을 다시 열 수 있는 단서를 보여줍니다.",
      keywords: ["희망의단서", "억눌린감정", "새출발"],
      cardReadings: [],
    });

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toMatchObject({
      status: "ok",
      reading: {
        keywords: ["희망의 단서", "억눌린 감정", "새 출발"],
      },
    });
  });

  test("removes provider tail artifacts from parsed tarot copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "Star light",
      overview: "The overview keeps the reading focused on the card imagery. }} PMID:}",
      cardReadings: [],
    });

    const result = await generateTarotReadingForUser(oneCardInput, { provider });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        overview: "The overview keeps the reading focused on the card imagery.",
        cardReadings: [],
      },
    });
  });

  test("generates a three-card tarot reading only when all spread positions are present", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "세 장이 관계를 좁히는 날",
      overview:
        "세 장은 지금 손에 든 조건을 먼저 확인하고, 이어지는 국면에서 직감과 사실이 섞이기 쉬운 지점을 지나, 마지막에는 무엇을 기준으로 판단할지 보여줍니다.",
      cardReadings: [
        {
          position: "situation",
          heading: "현재 조건",
          reading: "마법사는 이미 사용할 수 있는 도구가 있음을 보여주며, 지금 상황은 준비 부족보다 실행 방식의 선택에 가깝습니다.",
        },
        {
          position: "flow",
          heading: "이어지는 국면",
          reading: "역방향 여사제는 직감과 추측이 섞이기 쉬운 장면이라, 확인되지 않은 느낌을 사실처럼 다루지 말라고 말합니다.",
        },
        {
          position: "advice",
          heading: "판단 기준",
          reading: "여황제는 무리하게 바꾸기보다 결과가 자랄 수 있는 환경을 먼저 정리하는 편이 오늘의 기준이라고 말합니다.",
        },
      ],
      advice: "이 provider advice는 결과에 포함되지 않아야 합니다.",
    });

    const result = await generateTarotReadingForUser(threeCardInput, { provider });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        cardReadings: [
          { position: "situation" },
          { position: "flow" },
          { position: "advice" },
        ],
      },
    });

    const request = provider.requests[0];
    const input = JSON.parse(request?.input ?? "{}") as {
      outputContract?: { style?: string[] };
    };
    const styleContract = input.outputContract?.style?.join("\n") ?? "";

    expect(styleContract).toContain("세 장 리딩은 overview에서 세 카드의 관계");
    expect(styleContract).not.toContain("한 장 리딩은 cardReadings를 빈 배열");
    expect(styleContract).toContain("각 카드의 기본 의미를 다시 설명하는 데 머물지 마세요");
    expect(styleContract).toContain("조언 포지션도 명령형으로 쓰지 마세요");
    expect(request?.instructions).toContain("세 장 리딩은 overview에서 세 장의 관계");
    expect(request?.instructions).toContain("고정 카드 메시지와 같은 말을 반복하지 마세요");
    expect(request?.instructions).toContain("~하세요");
    expect(request?.instructions).not.toContain("한 장 리딩에서는 cardReadings를 만들지 마세요");
  });

  test("normalizes three-card provider headings before returning the reading", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "Three card reading",
      overview: "The three selected cards connect the visible condition, the next pressure, and the standard for judgment.",
      cardReadings: [
        {
          position: "situation",
          heading: "LLM SITUATION HEADING",
          reading: "The first card explains the visible condition.",
        },
        {
          position: "flow",
          heading: "LLM FLOW HEADING",
          reading: "The second card explains the next pressure.",
        },
        {
          position: "advice",
          heading: "LLM ADVICE HEADING",
          reading: "The third card explains the standard for judgment.",
        },
      ],
    });

    await expect(generateTarotReadingForUser(threeCardInput, { provider })).resolves.toMatchObject({
      status: "ok",
      reading: {
        cardReadings: [
          { position: "situation", heading: "지금 드러난 조건" },
          { position: "flow", heading: "이어지는 국면" },
          { position: "advice", heading: "판단의 기준" },
        ],
      },
    });
  });

  test("returns invalid_response when provider JSON does not match the requested spread", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "불완전한 리딩",
      overview: "이 응답은 세 장 리딩에 필요한 조언 카드가 빠져 있어 저장 가능한 리딩이 될 수 없습니다.",
      cardReadings: [
        {
          position: "situation",
          heading: "상황",
          reading: "상황 카드만으로는 세 장의 연결 해석을 완성할 수 없습니다.",
        },
      ],
      advice: "조언 카드가 빠졌기 때문에 사용자에게 결과처럼 보여주면 안 됩니다.",
    });

    await expect(generateTarotReadingForUser(threeCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("classifies provider timeouts as retryable unavailable results", async () => {
    const provider: DreamReadingLlmProvider = {
      generateJson: vi.fn(async () => {
        throw new LlmProviderTimeoutError(1000);
      }),
    };

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "timeout",
      retryable: true,
    });
  });
});
