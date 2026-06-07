import { describe, expect, test, vi } from "vitest";

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
    expect(styleContract).toContain("cardMessage");
    expect(styleContract).toContain("차분, 조용, 작은 행동, 행동 하나, 충분합니다");
    expect(styleContract).not.toContain("차분, 조용, 흐름, 작은 행동");
    expect(request?.instructions).toContain("한 장 리딩에서는 cardReadings를 만들지 마세요");
    expect(request?.instructions).toContain("overview가 사용자에게 보이는 본문입니다");
    expect(request?.instructions).not.toContain("세 장 리딩은 overview에서 세 장의 관계");
    expect(request?.instructions).not.toContain("You are Manyang's production tarot-reading engine.");
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
    expect(request?.instructions).toContain("세 장 리딩은 overview에서 세 장의 관계");
    expect(request?.instructions).not.toContain("한 장 리딩에서는 cardReadings를 만들지 마세요");
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
