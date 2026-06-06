import { describe, expect, test, vi } from "vitest";

import { LlmProviderTimeoutError, type DreamReadingLlmProvider, type DreamReadingLlmRequest } from "./llm-provider";
import { generateTarotReadingForUser, type TarotReadingInput } from "./llm-tarot-reading";

function createTarotCard(id: number, nameKo: string) {
  return {
    id,
    nameKo,
    nameEn: `CARD ${id}`,
    keywords: ["focus", "choice"],
    visualSymbols: ["light", "gate"],
    symbolMeanings: [
      {
        symbol: "light",
        meaning: "The light points to the part of the situation that is already visible.",
      },
      {
        symbol: "gate",
        meaning: "The gate marks a threshold that can be crossed with one practical choice.",
      },
    ],
    mood: "A bright but quiet card mood.",
    upright: {
      summary: "Upright summary",
      dailyFlow: "Upright daily flow",
      cardMessage: "Upright card message",
      readingScene: "The upright card scene turns available focus into a clear next step.",
      reflectionQuestion: "What part of the situation is already asking for attention?",
      smallAction: "Choose one visible next step and take it before adding more plans.",
    },
    reversed: {
      summary: "Reversed summary",
      dailyFlow: "Reversed daily flow",
      cardMessage: "Reversed card message",
      readingScene: "The reversed card scene shows focus scattering before the next threshold.",
      reflectionQuestion: "Where is hesitation turning into avoidable delay?",
      smallAction: "Remove one distraction before deciding how to cross the threshold.",
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
  keywords: ["opening", "choice", "attention"],
};

describe("generateTarotReadingForUser", () => {
  test("returns unavailable without local fallback copy when provider is missing", async () => {
    await expect(generateTarotReadingForUser(oneCardInput)).resolves.toEqual({
      status: "unavailable",
      reason: "provider_missing",
      retryable: false,
    });
  });

  test("generates a one-card tarot reading from provider JSON", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "오늘은 가볍게 첫발을 떼는 날",
      overview: "선택한 바보 카드는 오늘 낯선 길 앞에서 너무 많은 확신을 기다리기보다 작은 움직임을 먼저 만들어 보라고 말합니다.",
      cardReadings: [
        {
          position: "today",
          heading: "오늘의 핵심",
          reading: "정방향 바보는 시작의 가벼움을 보여주며, 오늘은 완벽한 계획보다 작게 열어 보는 태도가 잘 맞습니다.",
        },
      ],
      advice: "오늘은 크게 결론내리기보다 한 가지 작은 시도를 정하고, 그 결과를 보고 다음 걸음을 정하세요.",
    });

    const result = await generateTarotReadingForUser(oneCardInput, { provider, providerTimeoutMs: 1200 });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        title: "오늘은 가볍게 첫발을 떼는 날",
        cardReadings: [
          {
            position: "today",
            heading: "오늘의 핵심",
          },
        ],
      },
    });
    expect(provider.requests[0]).toMatchObject({
      schemaName: "tarot_reading_draft",
      timeoutMs: 1200,
    });
    expect(provider.requests[0]?.input).toContain("바보");
    expect(provider.requests[0]?.input).toContain("symbolMeanings");
    expect(provider.requests[0]?.input).toContain("The upright card scene turns available focus into a clear next step.");
    expect(provider.requests[0]?.input).toContain("cardMessage");
    expect(provider.requests[0]?.input).toContain("readingScene");
    expect(provider.requests[0]?.input).not.toContain("selectedMeaning.story");
    expect(provider.requests[0]?.input).toContain("The light points to the part of the situation that is already visible.");
    expect(provider.requests[0]?.input).not.toContain("What part of the situation is already asking for attention?");
    expect(provider.requests[0]?.input).not.toContain("Choose one visible next step and take it before adding more plans.");
    expect(provider.requests[0]?.instructions).toContain("카드의 상징과 장면을 근거로");
    expect(provider.requests[0]?.instructions).toContain("모든 출력 필드에서 절대 사용하지 마세요");
    expect(provider.requests[0]?.instructions).toContain("이어지는 국면");
    expect(provider.requests[0]?.instructions).not.toContain("You are Manyang's production tarot-reading engine.");
  });

  test("requests tarot drafts without a final advice field", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "A small opening",
      overview: "The selected card points to a day where a small opening matters more than a perfect answer.",
      cardReadings: [
        {
          position: "today",
          heading: "Today",
          reading: "The card connects its upright tone to a careful first step rather than a rushed conclusion.",
        },
      ],
      advice: "This provider advice should not be part of the tarot draft contract.",
    });

    await generateTarotReadingForUser(oneCardInput, { provider });

    const schema = provider.requests[0]?.jsonSchema as
      | { properties?: Record<string, unknown>; required?: string[] }
      | undefined;

    expect(schema?.properties).not.toHaveProperty("advice");
    expect(schema?.required).not.toContain("advice");
    expect(provider.requests[0]?.input).not.toContain("advice one practical sentence");
    expect(provider.requests[0]?.instructions).toContain("마지막 행동 지시나 최종 조언을 만들지 마세요");
  });

  test("accepts concise one-card provider JSON without symbolic reading fields", async () => {
    const provider = createProvider({
      title: "A small opening",
      overview: "The selected card points to a day where a small opening matters more than a perfect answer.",
      keywords: ["opening", "choice", "attention"],
      cardReadings: [
        {
          position: "today",
          heading: "Today",
          reading: "The card connects its upright tone to a careful first step rather than a rushed conclusion.",
        },
      ],
    });

    const result = await generateTarotReadingForUser(oneCardInput, { provider });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        keywords: ["opening", "choice", "attention"],
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
      cardReadings: [
        {
          position: "today",
          heading: "Today",
          reading: "The card reading itself is present, but the keywords and symbol readings are missing.",
        },
      ],
      advice: "Choose one small action and review the result before deciding the next step.",
    });

    await expect(generateTarotReadingForUser(oneCardInput, { provider })).resolves.toEqual({
      status: "unavailable",
      reason: "invalid_response",
      retryable: true,
    });
  });

  test("removes provider tail artifacts from parsed tarot copy", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "Star light",
      overview: "A quiet overview keeps the reading focused on the card imagery. }} PMID:}",
      cardReadings: [
        {
          position: "today",
          heading: "The Star",
          reading: "The card points to a small but visible recovery signal. }} PMID:}",
        },
      ],
    });

    const result = await generateTarotReadingForUser(oneCardInput, { provider });

    expect(result).toMatchObject({
      status: "ok",
      reading: {
        overview: "A quiet overview keeps the reading focused on the card imagery.",
        cardReadings: [
          {
            reading: "The card points to a small but visible recovery signal.",
          },
        ],
      },
    });
  });

  test("generates a three-card tarot reading only when all spread positions are present", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "흐름을 조율하며 선택을 좁히는 날",
      overview: "세 장은 지금 손에 든 가능성을 정리하고, 느려진 감각을 통해 더 현실적인 조언으로 이동하는 흐름을 보여줍니다.",
      cardReadings: [
        {
          position: "situation",
          heading: "상황",
          reading: "마법사는 이미 사용할 수 있는 도구가 있음을 보여주며, 지금 상황은 준비 부족보다 실행 방식의 선택에 가깝습니다.",
        },
        {
          position: "flow",
          heading: "흐름",
          reading: "역방향 여사제는 직감과 추측이 섞이기 쉬운 흐름이라, 확인되지 않은 느낌을 사실처럼 다루지 말라고 말합니다.",
        },
        {
          position: "advice",
          heading: "조언",
          reading: "여황제는 무리하게 밀어붙이기보다 결과가 자랄 환경을 먼저 정리하는 편이 오늘의 조언이라고 읽힙니다.",
        },
      ],
      advice: "오늘은 하나를 바로 밀어붙이기보다 확인할 것, 기다릴 것, 돌볼 것을 나누어 적어 보세요.",
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
  });

  test("returns invalid_response when provider JSON does not match the requested spread", async () => {
    const provider = createProvider({
      ...generatedDisplayFields,
      title: "불완전한 리딩",
      overview: "이 응답은 세 장 리딩에 필요한 조언 카드가 빠져 있어서 저장 가능한 리딩이 될 수 없습니다.",
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
