import { describe, expect, test } from "vitest";

import {
  createTarotModelAbMarkdown,
  parseTarotModelList,
  runTarotModelAbEval,
  type TarotModelAbCase,
} from "../src/services/tarot-model-ab-eval";
import type { DreamReadingLlmProvider, DreamReadingLlmRequest } from "../src/services/llm-provider";

function createTarotCard(id: number, nameKo: string) {
  return {
    id,
    nameKo,
    nameEn: `CARD ${id}`,
    keywords: ["감정", "표현", "흐름"],
    visualSymbols: ["물", "잔"],
    symbolMeanings: [
      {
        symbol: "물",
        meaning: "감정이 흐르는 방식과 말하지 못한 마음을 보여줍니다.",
      },
      {
        symbol: "잔",
        meaning: "마음에 담긴 기대와 표현의 방식을 보여줍니다.",
      },
    ],
    mood: "감정이 조심스럽게 올라오는 카드입니다.",
    upright: {
      summary: "감정을 순수하게 표현하려는 흐름입니다.",
      dailyFlow: "감정 표현이 부드럽게 열립니다.",
      cardMessage: "컵 시종은 순수한 감정 표현인지 봅니다.",
      readingScene: "작은 컵과 물의 상징이 조심스러운 표현을 보여줍니다.",
    },
    reversed: {
      summary: "감정 표현이 막히고 상상에 머물 수 있습니다.",
      dailyFlow: "말하지 못한 감정이 안쪽에서 반복됩니다.",
      cardMessage: "컵 시종은 현실을 피하는 상상인지 봅니다.",
      readingScene: "컵과 물의 상징이 말하지 못한 감정을 보여줍니다.",
    },
  };
}

const cases = [
  {
    id: "hidden-cups-page",
    label: "숨긴 감정 / 컵 시종 역방향",
    input: {
      appDate: "2026-07-07",
      locale: "ko",
      spread: "question_one_card",
      questionContext: {
        stateKey: "mind_complex",
        stateLabel: "내 마음이 궁금해",
        questionKey: "unrecognized_feeling",
        questionText: "내가 모른 척하고 있는 감정은 뭘까?",
      },
      cards: [
        {
          position: "today",
          orientation: "reversed",
          card: createTarotCard(33, "컵 시종"),
        },
      ],
    },
  },
] satisfies TarotModelAbCase[];

describe("tarot model A/B evaluation", () => {
  test("parses a unique comma-separated model list", () => {
    expect(parseTarotModelList(" gpt-5-mini, gpt-5, gpt-5-mini ,, ")).toEqual(["gpt-5-mini", "gpt-5"]);
  });

  test("runs every case against every model with the same prompt input", async () => {
    const requests: DreamReadingLlmRequest[] = [];
    const provider: DreamReadingLlmProvider = {
      async generateJson(request) {
        requests.push(request);

        return {
          title: `${request.model} 리딩`,
          overview:
            "선택한 질문에 맞춰 카드의 물과 잔 상징을 감정 표현의 망설임으로 읽습니다. 말하지 못한 감정이 상상 안에서 반복되고, 오늘은 표현할 순간에 조심스러운 태도로 드러날 수 있습니다.",
          keywords: ["말하지 못한 마음", "표현의 망설임", "반복된 상상"],
          cardReadings: [],
        };
      },
    };

    const report = await runTarotModelAbEval({
      cases,
      models: ["model-a", "model-b"],
      provider,
      generatedAt: "2026-07-07T00:00:00.000Z",
      providerTimeoutMs: 1200,
    });

    expect(requests.map((request) => request.model)).toEqual(["model-a", "model-b"]);
    expect(requests[0]?.input).toEqual(requests[1]?.input);
    expect(report.results).toHaveLength(2);
    expect(report.results[0]).toMatchObject({
      caseId: "hidden-cups-page",
      model: "model-a",
      status: "ok",
    });
  });

  test("creates a markdown report that keeps model outputs side by side", async () => {
    const markdown = createTarotModelAbMarkdown({
      generatedAt: "2026-07-07T00:00:00.000Z",
      models: ["model-a", "model-b"],
      cases,
      results: [
        {
          caseId: "hidden-cups-page",
          model: "model-a",
          status: "ok",
          durationMs: 100,
          title: "A 리딩",
          keywords: ["감정", "표현", "망설임"],
          overview: "A 모델의 리딩 본문입니다.",
        },
        {
          caseId: "hidden-cups-page",
          model: "model-b",
          status: "ok",
          durationMs: 120,
          title: "B 리딩",
          keywords: ["마음", "말", "표현"],
          overview: "B 모델의 리딩 본문입니다.",
        },
      ],
    });

    expect(markdown).toContain("# Tarot Model A/B Report");
    expect(markdown).toContain("## 숨긴 감정 / 컵 시종 역방향");
    expect(markdown).toContain("### model-a");
    expect(markdown).toContain("### model-b");
    expect(markdown).toContain("A 모델의 리딩 본문입니다.");
    expect(markdown).toContain("B 모델의 리딩 본문입니다.");
  });
});
