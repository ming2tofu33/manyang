import { describe, expect, test } from "vitest";

import {
  createResultEncyclopediaHref,
  createReceiptFileName,
  createReceiptShareText,
  createReceiptSvg,
  createTarotReadingFileName,
  createTarotReadingShareText,
  createTarotReadingSvg,
  getPrimarySymbolSlug,
  getPrimaryResultSymbolSlug,
} from "./result-actions";
import type { DreamCompletedPayload } from "./dream-storage";
import type { DailyTarotReading } from "./daily-tarot";

function createPayload(): DreamCompletedPayload {
  return {
    dreamText: "낡은 학교 복도에서 신발을 잃어버렸어요.",
    dreamDate: "2026-05-24",
    catReaderType: "white_cat",
    wakeMood: "불안",
    analysis: {
      dreamId: "dream-id",
      analysisId: "analysis-id",
      cardId: "card-id",
      reader: {
        id: "white_cat",
        name: "하얀냥",
        access: "free",
      },
      summary: "복도와 신발이 남은 꿈",
      symbols: ["복도", "신발", "학교"],
      emotions: ["불안"],
      themes: ["장소와 전환"],
      interpretation: "단정하긴 어렵지만, 복도는 전환 구간과 연결되어 보여요.",
      smallPrescription: "준비물 하나만 먼저 확인해보자냥.",
      symbolReadings: [
        {
          symbol: "복도",
          reading: "복도는 다음 장면으로 이동하는 과정으로 읽을 수 있어요.",
        },
      ],
      readingBasis: {
        usedSymbols: ["복도", "신발"],
        mainThemes: ["장소와 전환"],
        confidence: 0.7,
      },
      card: {
        name: "복도를 살피는 밤",
        type: "half_moon",
        keywords: ["전환", "준비", "탐색"],
        summary: "복도와 신발이 남은 꿈",
        message: "불안을 작은 단서로 데려가보자냥.",
        theme: "장소와 전환",
      },
      readerNote: "마냥은 꿈속 상징과 감정의 연결을 같은 기준으로 차분히 정리했어요.",
    },
  };
}

function createTarotReading(): DailyTarotReading {
  const card = {
    id: 0,
    roman: "0",
    slug: "the-fool",
    nameEn: "THE FOOL",
    nameKo: "The Fool",
    image: "/manyang/tarot/major/00-the-fool.png",
    keywords: ["start", "possibility"],
    visualSymbols: ["small bag"],
    symbolMeanings: [
      {
        symbol: "small bag",
        meaning: "The small bag keeps the card focused on what is essential for the first step.",
      },
    ],
    mood: "Bright beginning.",
    upright: {
      summary: "New beginning",
      dailyFlow: "A small attempt may shift the day.",
      cardMessage: "Check the basics first.",
      readingScene: "The card tells a story about stepping into a new path before every answer is visible.",
      reflectionQuestion: "What small beginning is asking for attention today?",
      smallAction: "Name one first step that is small enough to try today.",
    },
    reversed: {
      summary: "Rushed start",
      dailyFlow: "Slow down before moving.",
      cardMessage: "Make one safety check first.",
      readingScene: "The card tells a story about excitement that needs a little more grounding.",
      reflectionQuestion: "Where am I mistaking speed for readiness?",
      smallAction: "Pause once and check the practical condition under the idea.",
    },
    contexts: {
      love: "New feeling",
      career: "New project",
      money: "Watch impulse spending",
      general: "Possibility",
    },
  };

  return {
    id: "daily-tarot-daily_one_card-2026-06-01",
    spread: "daily_one_card",
    source: "llm",
    appDate: "2026-06-01",
    selectedAt: "2026-06-01T00:00:00.000Z",
    card,
    orientation: "upright",
    position: "today",
    cards: [{ position: "today", orientation: "upright", card }],
    generated: {
      title: "A small first step opens the day",
      overview: "The selected Fool card is read as a day where a light first step matters.",
      cardReadings: [],
      advice: "Choose one small action.",
    },
    keywords: ["start", "possibility"],
    title: "A small first step opens the day",
    message: "The selected Fool card is read as a day where a light first step matters.",
    advice: "Choose one small action.",
  };
}

describe("result action helpers", () => {
  test("maps the primary known symbol to an encyclopedia slug", () => {
    expect(getPrimarySymbolSlug(["복도", "신발"])).toBe("corridor");
  });

  test("prioritizes symbol readings when choosing the result encyclopedia symbol", () => {
    const payload = createPayload();
    payload.analysis.symbols = ["학교", "복도", "신발"];
    payload.analysis.readingBasis = {
      usedSymbols: ["학교", "복도", "신발"],
      mainThemes: ["장소와 전환"],
      confidence: 0.7,
    };
    payload.analysis.symbolReadings = [
      {
        symbol: "복도",
        reading: "복도는 다음 장면으로 이동하는 과정으로 읽을 수 있어요.",
      },
    ];

    expect(getPrimaryResultSymbolSlug(payload.analysis)).toBe("corridor");
  });

  test("creates result-context encyclopedia links", () => {
    expect(createResultEncyclopediaHref("신발")).toBe("/encyclopedia/shoes?from=result");
  });

  test("falls back to an encoded unknown symbol slug", () => {
    expect(getPrimarySymbolSlug(["낯선상징"])).toBe("%EB%82%AF%EC%84%A0%EC%83%81%EC%A7%95");
  });

  test("creates a stable svg receipt filename", () => {
    expect(createReceiptFileName(createPayload())).toBe("manyang-receipt-2026-05-24-dream-id.svg");
  });

  test("creates share text with the summary, symbols, and prescription", () => {
    const text = createReceiptShareText(createPayload());

    expect(text).toContain("복도와 신발이 남은 꿈");
    expect(text).toContain("From. 하얀냥");
    expect(text).not.toContain("테마: 하얀냥");
    expect(text).toContain("복도, 신발, 학교");
    expect(text).toContain("준비물 하나만 먼저 확인해보자냥.");
  });

  test("creates an svg receipt image document", () => {
    const svg = createReceiptSvg(createPayload());

    expect(svg).toContain("<svg");
    expect(svg).toContain("복도와 신발이 남은 꿈");
    expect(svg).toContain("From. 하얀냥");
    expect(svg).not.toContain("테마: 하얀냥");
    expect(svg).toContain("stamp-text");
    expect(svg).toContain("공통 해몽");
    expect(svg).toContain("준비물 하나만 먼저 확인해보자냥.");
  });

  test("creates a stable tarot reading svg filename", () => {
    expect(createTarotReadingFileName(createTarotReading())).toBe(
      "manyang-tarot-2026-06-01-daily_one_card-the-fool.svg",
    );
  });

  test("creates tarot share text with card, orientation, and card message", () => {
    const text = createTarotReadingShareText(createTarotReading());

    expect(text).toContain("오늘의 타로");
    expect(text).toContain("The Fool · 정방향");
    expect(text).not.toContain("A small first step opens the day");
    expect(text).toContain("카드 메시지: Choose one small action.");
    expect(text).not.toContain("조언: Choose one small action.");
    expect(text).toContain("Choose one small action.");
  });

  test("creates a tarot svg image document", () => {
    const svg = createTarotReadingSvg(createTarotReading());

    expect(svg).toContain("<svg");
    expect(svg).toContain("오늘의 타로");
    expect(svg).not.toContain("A small first step opens");
    expect(svg).toContain("THE FOOL");
    expect(svg).toContain("카드 메시지");
    expect(svg).not.toContain(">조언<");
    expect(svg).toContain("Choose one small action.");
  });
});
