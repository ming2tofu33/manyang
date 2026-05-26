import { describe, expect, test } from "vitest";

import {
  createReceiptFileName,
  createReceiptShareText,
  createReceiptSvg,
  getPrimarySymbolSlug,
} from "./result-actions";
import type { LatestAnalysisPayload } from "./dream-storage";

function createPayload(): LatestAnalysisPayload {
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
      card: {
        name: "복도를 살피는 밤",
        type: "half_moon",
        keywords: ["전환", "준비", "탐색"],
        summary: "복도와 신발이 남은 꿈",
        message: "불안을 작은 단서로 데려가보자냥.",
        theme: "장소와 전환",
      },
      readerNote: "하얀냥은 이 꿈이 남긴 감정을 부드럽게 이름 붙여봤다냥.",
    },
  };
}

describe("result action helpers", () => {
  test("maps the primary known symbol to an encyclopedia slug", () => {
    expect(getPrimarySymbolSlug(["복도", "신발"])).toBe("corridor");
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
    expect(text).toContain("복도, 신발, 학교");
    expect(text).toContain("준비물 하나만 먼저 확인해보자냥.");
  });

  test("creates an svg receipt image document", () => {
    const svg = createReceiptSvg(createPayload());

    expect(svg).toContain("<svg");
    expect(svg).toContain("복도와 신발이 남은 꿈");
    expect(svg).toContain("From. 하얀냥");
    expect(svg).toContain("준비물 하나만 먼저 확인해보자냥.");
  });
});
