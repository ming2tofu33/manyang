import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LatestAnalysisPayload } from "@/lib/dream-storage";

import { DreamResultReceipt } from "./dream-result-receipt";

function createLongReceiptPayload(): LatestAnalysisPayload {
  const longInterpretation = Array.from(
    { length: 40 },
    (_, index) => `긴 해석 문장 ${index + 1}은 영수증 안에서 전부 보존되지만 표시 높이는 보호되어야 합니다.`,
  ).join(" ");

  return {
    dreamText: "아주 긴 해석이 필요한 꿈",
    dreamDate: "2026-05-29",
    wakeMood: "불안함",
    catReaderType: "black_cat",
    analysis: {
      dreamId: "long-dream",
      analysisId: "long-analysis",
      cardId: "long-card",
      reader: {
        id: "black_cat",
        name: "검은냥",
        access: "free",
      },
      summary: "긴 해석 보호 테스트",
      symbols: ["병원"],
      emotions: ["불안함"],
      themes: ["돌봄"],
      interpretation: longInterpretation,
      smallPrescription: "지금 필요한 돌봄을 한 문장으로 적어보세요.",
      symbolReadings: [
        {
          symbol: "병원",
          reading: "병원은 돌봄과 회복 욕구를 살피는 장면으로 읽을 수 있어요.",
        },
      ],
      readingBasis: {
        usedSymbols: ["병원"],
        mainThemes: ["돌봄"],
        confidence: 0.82,
      },
      card: {
        name: "긴 해석 보호 테스트",
        type: "soft_moon",
        keywords: ["병원", "돌봄"],
        summary: "긴 해석 보호 테스트",
        message: "지금 필요한 돌봄을 한 문장으로 적어보세요.",
        theme: "돌봄",
      },
      readerNote: "검은냥은 긴 해석도 영수증 밖으로 흘러나가지 않게 조용히 정리했다냥.",
    },
  };
}

function createSafetyNoticeReceiptPayload(): LatestAnalysisPayload {
  const payload = createLongReceiptPayload();

  return {
    ...payload,
    analysis: {
      ...payload.analysis,
      summary: "병원 장면이 남은 꿈",
      interpretation: "병원 장면은 돌봄과 확인을 기다리는 불안을 비출 수 있어요.",
      safetyNotice: "마냥의 꿈 해석은 의학적 진단을 대체하지 않습니다. 건강이 걱정된다면 전문가와 상담해 주세요.",
    },
  };
}

describe("DreamResultReceipt", () => {
  it("uses sliced receipt assets at runtime instead of stretching a single receipt image", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain('src="/manyang/receipts/empty-top.webp"');
    expect(markup).toContain('src="/manyang/receipts/empty-bottom.webp"');
    expect(markup).toContain("background-image:url(/manyang/receipts/empty-middle.webp)");
    expect(markup).toContain("background-repeat:repeat-y");
    expect(markup).not.toContain('src="/manyang/receipts/empty.webp"');
    expect(markup).not.toContain('src="/manyang/receipts/empty.png"');
    expect(markup).not.toContain("/_next/image");
  });

  it("lets long LLM readings extend the receipt by repeating only the middle paper texture", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).not.toContain("aspect-[771/1730]");
    expect(markup).not.toContain("object-fill drop-shadow-[0_18px_60px_rgba(0,0,0,0.38)]");
    expect(markup).toContain("data-receipt-paper=\"sliced\"");
    expect(markup).toContain("data-receipt-paper-middle=\"true\"");
    expect(markup).toContain("--receipt-paper-width:min(calc(100vw - 32px), 372px)");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 720 / 771)");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 1730 / 771)");
    expect(markup).not.toContain("pt-[292px]");
    expect(markup).not.toContain("pb-[96px]");
    expect(markup).toContain("padding-top:calc(var(--receipt-paper-width) * 360 / 771)");
    expect(markup).toContain("padding-bottom:calc(var(--receipt-paper-width) * 104 / 771)");
  });

  it("keeps a reserved blank area near the bottom for a future cat stamp asset", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-stamp-space=\"true\"");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 192 / 771)");
  });

  it("keeps the inner text column away from the receipt side pattern", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).not.toContain("w-[80%]");
    expect(markup).not.toContain("w-[84%]");
    expect(markup).toContain("w-[82%]");
  });

  it("scales the receipt up proportionally without stretching it sideways", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-viewport-frame=\"true\"");
    expect(markup).not.toContain("max-w-[360px]");
    expect(markup).toContain("max-w-[372px]");
    expect(markup).toContain("w-screen");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 1730 / 771)");
  });

  it("shows a folded cat-read symbol panel instead of jumping directly to a single encyclopedia entry", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-symbol-basis-panel=\"true\"");
    expect(markup).toContain("고양이가 읽은 상징들");
    expect(markup).toContain("영수증에 담긴 상징 메모를 펼쳐봅니다");
    expect(markup).toContain("꿈 영수증에 담긴 상징 메모예요.");
    expect(markup).toContain("꿈에서 잡힌 상징");
    expect(markup).toContain("복도는 다음 장면으로 이동하는 과정과 전환의 감각으로 읽을 수 있어요.");
    expect(markup).toContain("href=\"/encyclopedia/corridor?from=result\"");
    expect(markup).toContain("href=\"/encyclopedia/shoes?from=result\"");
    expect(markup).not.toContain("이 꿈의 상징 근거 보기");
    expect(markup).not.toContain("고양이가 영수증을 쓸 때 참고한 상징들이에요.");
    expect(markup).not.toContain("상징 백과에서 자세히 보기");
    expect(markup).not.toContain("href=\"/encyclopedia/school\"");
  });

  it("streams receipt reading copy one word at a time while preserving accessible full text", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-streaming-text=\"interpretation\"");
    expect(markup).toContain("data-receipt-streaming-text=\"reader-note\"");
    expect(markup).toContain("data-receipt-streaming-text=\"small-prescription\"");
    expect(markup).toContain("class=\"sr-only\">이 꿈은 목적지보다 준비 상태가 더 신경 쓰이는 마음과 연결되어 보인다냥.");
    expect(markup).toContain("aria-hidden=\"true\"");
    expect(markup).toContain("receipt-stream-word");
    expect(markup).toContain("animation-delay:6200ms");
    expect(markup).toContain("animation-delay:9665ms");
    expect(markup).toContain(">이</span> <span");
    expect(markup).toContain(">꿈은</span> <span");
    expect(markup).not.toContain(
      "class=\"animate-ink-fade mt-6 text-[15px] leading-7 text-[#2f2117]\" style=\"animation-delay:2.6s\"",
    );
  });

  it("uses a quieter receipt header and reveals tags in a quick sequence", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-title=\"true\"");
    expect(markup).toContain("animate-receipt-title-fade");
    expect(markup).not.toContain("animate-ink-fade text-center text-[22px]");
    expect(markup).toContain("data-receipt-meta=\"true\"");
    expect(markup).toContain("data-receipt-date-line=\"true\"");
    expect(markup).toContain("data-receipt-detail-line=\"true\"");
    expect(markup).not.toContain("whitespace-nowrap");
    expect(markup).toContain("2026.05.24");
    expect(markup).toContain("불안함");
    expect(markup).toContain("검은냥이 읽음");
    expect(markup).not.toContain("From. 검은냥");
    expect(markup).toContain("receipt-tag-pop");
    expect(markup).toContain("data-receipt-symbol-tags=\"true\"");
    expect(markup).toContain("justify-center");
    expect(markup).not.toContain("justify-start");
    expect(markup).toContain("animation-delay:4300ms");
    expect(markup).toContain("animation-delay:5050ms");
    expect(markup).toContain("animation-delay:5160ms");
    expect(markup).toContain("animation-delay:5270ms");
  });

  it("shows save and share when the receipt settles instead of waiting for all streamed text", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-result-actions=\"true\"");
    expect(markup).toContain("animation-delay:3500ms");
    expect(markup).toContain("저장하기");
    expect(markup).toContain("공유하기");
    expect(markup).not.toContain("data-receipt-result-actions=\"true\" style=\"animation-delay:9000ms\"");
  });

  it("bounds long LLM receipt sections without truncating the saved interpretation text", () => {
    const payload = createLongReceiptPayload();
    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={payload} />);

    expect(markup).toContain("data-receipt-text-frame=\"interpretation\"");
    expect(markup).toContain("max-h-[22rem]");
    expect(markup).toContain("overflow-hidden");
    expect(markup).not.toContain("overflow-y-auto");
    expect(markup).not.toContain("[scrollbar-width:thin]");
    expect(markup).toContain("data-receipt-overflow-guard=\"true\"");
    expect(markup).toContain("data-receipt-expand-control=\"interpretation\"");
    expect(markup).toContain("해석 전체 보기");
    expect(markup).toContain("긴 해석 문장 40은 영수증 안에서 전부 보존되지만 표시 높이는 보호되어야 합니다.");
    expect(markup).not.toContain("line-clamp");
  });

  it("shows safety notices on the dream receipt when the analysis includes one", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={createSafetyNoticeReceiptPayload()} />);

    expect(markup).toContain("data-receipt-safety-notice=\"true\"");
    expect(markup).toContain("마냥의 꿈 해석은 의학적 진단을 대체하지 않습니다.");
    expect(markup).toContain("건강이 걱정된다면 전문가와 상담해 주세요.");
  });
});
