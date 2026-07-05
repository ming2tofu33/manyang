import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DreamCompletedPayload, DreamRecord } from "@/lib/dream-storage";

const mockedRoutineRecords = vi.hoisted(() => ({
  nightCheckInRecords: [
    {
      moodId: "calm",
      moodLabel: "편안함",
      conditionId: "settled",
      conditionLabel: "조용함",
      note: "잠들기 전 마음이 가라앉아 있었어요.",
      checkInDate: "2026-05-23",
      savedAt: "2026-05-23T22:00:00.000Z",
    },
  ],
}));

const mockedArchiveDreamRecords = vi.hoisted(() => ({
  dreamRecords: [] as DreamRecord[],
  deleteDreamRecord: vi.fn(async () => true),
}));

vi.mock("@/lib/use-routine-records", () => ({
  mergeRemotePawprintResult: vi.fn(),
  useRoutineRecords: () => ({
    pawprints: [],
    morningMoodRecords: [],
    nightCheckInRecords: mockedRoutineRecords.nightCheckInRecords,
    source: "local",
    isLoadingRoutineRecords: false,
    canViewRoutines: true,
  }),
}));

vi.mock("@/lib/use-archive-dream-records", () => ({
  useArchiveDreamRecords: () => ({
    dreamRecords: mockedArchiveDreamRecords.dreamRecords,
    source: "local",
    isLoadingServerRecords: false,
    openDreamRecord: vi.fn(),
    deleteDreamRecord: mockedArchiveDreamRecords.deleteDreamRecord,
    canViewArchive: true,
  }),
}));

import { DreamResultReceipt } from "./dream-result-receipt";

beforeEach(() => {
  mockedArchiveDreamRecords.dreamRecords = [];
  mockedArchiveDreamRecords.deleteDreamRecord.mockClear();
});

function createLongReceiptPayload(): DreamCompletedPayload {
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
      readerNote: "마냥은 꿈속 상징과 감정의 연결을 같은 기준으로 차분히 정리했어요.",
    },
  };
}

function createSafetyNoticeReceiptPayload(): DreamCompletedPayload {
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

function getReceiptTextFrameClassName(markup: string, label: string): string {
  const match = markup.match(new RegExp(`<p id="receipt-text-${label}" class="([^"]+)"`));

  expect(match?.[1]).toBeDefined();

  return match?.[1] ?? "";
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
    expect(markup).toContain("data-receipt-export-target=\"true\"");
    expect(markup).toContain("data-receipt-paper-middle=\"true\"");
    expect(markup).toContain("--receipt-paper-width:min(calc(100vw - 32px), 372px)");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 720 / 771)");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 1730 / 771)");
    expect(markup).not.toContain("pt-[292px]");
    expect(markup).not.toContain("pb-[96px]");
    expect(markup).toContain("padding-top:calc(var(--receipt-paper-width) * 360 / 771)");
    expect(markup).toContain("padding-bottom:calc(var(--receipt-paper-width) * 104 / 771)");
  });

  it("overlaps the sliced paper seams so the receipt does not reveal gaps while sliding", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-paper-slice=\"top\"");
    expect(markup).toContain("data-receipt-paper-slice=\"middle\"");
    expect(markup).toContain("data-receipt-paper-slice=\"bottom\"");
    expect(markup).toContain("height:calc(var(--receipt-paper-width) * 626 / 771 + 2px)");
    expect(markup).toContain("top:calc(var(--receipt-paper-width) * 626 / 771 - 2px)");
    expect(markup).toContain("bottom:calc(var(--receipt-paper-width) * 384 / 771 - 2px)");
    expect(markup).toContain("height:calc(var(--receipt-paper-width) * 384 / 771 + 2px)");
  });

  it("prints the selected cat reader stamp in the reserved area near the receipt bottom", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain("data-receipt-stamp-space=\"true\"");
    expect(markup).toContain("min-height:calc(var(--receipt-paper-width) * 230 / 771)");
    expect(markup).toContain("data-receipt-stamp=\"true\"");
    expect(markup).toContain("data-receipt-stamp-reader=\"black_cat\"");
    expect(markup).toContain("/manyang/receipts/stamps/stamp-black-cat-seal.png");
    expect(markup).toContain("data-receipt-reader-signature=\"true\"");
    expect(markup).toContain("data-receipt-reader-pawprint=\"true\"");
    expect(markup).toContain("From. 검은냥");
    expect(markup).toContain("justify-between");
    expect(markup).toContain("h-[6.55rem] w-[6.55rem]");
    expect(markup).toContain("receipt-stamp-print");
    expect(markup).toContain("animation-delay:3920ms");
  });

  it("uses the matching stamp asset for non-default cat readers", () => {
    const basePayload = createLongReceiptPayload();
    const payload = {
      ...basePayload,
      catReaderType: "gray_cat" as const,
      analysis: {
        ...basePayload.analysis,
        reader: {
          id: "gray_cat" as const,
          name: "잿빛냥",
          access: "annual_premium" as const,
        },
      },
    };
    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={payload} />);

    expect(markup).toContain("data-receipt-stamp-reader=\"gray_cat\"");
    expect(markup).toContain("/manyang/receipts/stamps/stamp-gray-cat-seal.png");
    expect(markup).not.toContain("/manyang/receipts/stamps/stamp-black-cat-seal.png");
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
    expect(markup).toContain("꿈 영수증에 담긴 상징들");
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
    expect(markup).not.toContain("data-receipt-streaming-text=\"reader-note\"");
    expect(markup).toContain("data-receipt-streaming-text=\"small-prescription\"");
    expect(markup).toContain("aria-label=\"이 꿈은 목적지보다 준비 상태가 더 신경 쓰이는 마음과 연결되어 보인다냥.");
    expect(markup).not.toContain("class=\"sr-only\"");
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

  it("does not render the old generic reader note on the receipt", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={createLongReceiptPayload()} />);

    expect(markup).not.toContain("마냥은 꿈속 상징과 감정의 연결을 같은 기준으로 차분히 정리했어요.");
    expect(markup).not.toContain("data-receipt-streaming-text=\"reader-note\"");
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
    expect(markup).not.toContain("검은냥 테마");
    expect(markup).not.toContain("밤하늘 테마");
    expect(markup).toContain("From. 검은냥");
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
    expect(markup).toContain("/manyang/ui/buttons/common-compact-primary-frame.png");
    expect(markup).not.toContain("/manyang/cutouts/boxes/17-pill-wide.png");
    expect(markup).not.toContain("data-receipt-result-actions=\"true\" style=\"animation-delay:9000ms\"");
  });

  it("groups receipt actions, save prompt, and symbol panel into one settled receipt reveal", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);
    const completionStackIndex = markup.indexOf("data-receipt-completion-stack=\"true\"");
    const actionsIndex = markup.indexOf("data-receipt-result-actions=\"true\"");
    const saveSlotIndex = markup.indexOf("data-receipt-save-slot=\"true\"");
    const symbolPanelIndex = markup.indexOf("data-symbol-basis-panel=\"true\"");

    expect(completionStackIndex).toBeGreaterThan(-1);
    expect(markup).toContain("data-receipt-completion-stack=\"true\" style=\"animation-delay:3500ms\"");
    expect(actionsIndex).toBeGreaterThan(-1);
    expect(actionsIndex).toBeGreaterThan(completionStackIndex);
    expect(saveSlotIndex).toBeGreaterThan(actionsIndex);
    expect(symbolPanelIndex).toBeGreaterThan(saveSlotIndex);
    expect(markup).not.toContain("data-symbol-basis-panel=\"true\" style=\"animation-delay:9000ms\"");
  });

  it("hides save, share, and archive-only controls in shared read-only mode", () => {
    const markup = renderToStaticMarkup(
      <DreamResultReceipt payloadOverride={createLongReceiptPayload()} isSharedView />,
    );

    expect(markup).not.toContain("data-receipt-result-actions=\"true\"");
    expect(markup).not.toContain("data-receipt-save-slot=\"true\"");
    expect(markup).not.toContain("data-receipt-delete-slot=\"true\"");
    expect(markup).toContain("data-receipt-shared-view=\"true\"");
  });

  it("shows the original dream text below the receipt without putting it inside the paper", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={createLongReceiptPayload()} />);
    const receiptPaperIndex = markup.indexOf("data-receipt-paper=\"sliced\"");
    const completionStackIndex = markup.indexOf("data-receipt-completion-stack=\"true\"");
    const originalDreamIndex = markup.indexOf("data-original-dream-panel=\"true\"");

    expect(originalDreamIndex).toBeGreaterThan(completionStackIndex);
    expect(originalDreamIndex).toBeGreaterThan(receiptPaperIndex);
    expect(markup).toContain("내가 적은 꿈 보기");
    expect(markup).toContain("아주 긴 해석이 필요한 꿈");
  });

  it("shows a delete action when the current receipt exists in the archive", () => {
    const payload = createLongReceiptPayload();
    const storedRecord: DreamRecord = {
      ...payload,
      id: "stored-dream-1",
      savedAt: "2026-05-29T12:00:00.000Z",
    };
    mockedArchiveDreamRecords.dreamRecords = [storedRecord];

    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={payload} />);
    const deleteSlotIndex = markup.indexOf("data-receipt-delete-slot=\"true\"");
    const originalDreamIndex = markup.indexOf("data-original-dream-panel=\"true\"");

    expect(markup).toContain("data-receipt-delete-slot=\"true\"");
    expect(markup).toContain("data-receipt-delete-action=\"stored-dream-1\"");
    expect(markup).toContain("/manyang/ui/action-icons/action-trash.png");
    expect(deleteSlotIndex).toBeGreaterThan(-1);
    expect(originalDreamIndex).toBeGreaterThan(deleteSlotIndex);
  });

  it("reveals the related night record with receipt actions and symbols in the same settled stack", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);
    const completionStackIndex = markup.indexOf("data-receipt-completion-stack=\"true\"");
    const actionsIndex = markup.indexOf("data-receipt-result-actions=\"true\"");
    const symbolPanelIndex = markup.indexOf("data-symbol-basis-panel=\"true\"");
    const nightRecordIndex = markup.indexOf("data-related-night-checkin-panel=\"true\"");

    expect(nightRecordIndex).toBeGreaterThan(-1);
    expect(nightRecordIndex).toBeGreaterThan(completionStackIndex);
    expect(nightRecordIndex).toBeGreaterThan(actionsIndex);
    expect(symbolPanelIndex).toBeGreaterThan(actionsIndex);
    expect(nightRecordIndex).toBeGreaterThan(symbolPanelIndex);
    expect(markup).toContain("어젯밤의 기록");
    expect(markup).toContain("편안함 · 조용함");
    expect(markup).toContain("잠들기 전 마음이 가라앉아 있었어요.");
    expect(markup).not.toContain("data-related-night-checkin-panel=\"true\" style=\"animation-delay:9000ms\"");
  });

  it("lets long LLM receipt sections expand the receipt instead of clipping generated text", () => {
    const payload = createLongReceiptPayload();
    const markup = renderToStaticMarkup(<DreamResultReceipt payloadOverride={payload} />);
    const textFrameClassNames = [
      getReceiptTextFrameClassName(markup, "interpretation"),
      getReceiptTextFrameClassName(markup, "small-prescription"),
    ];

    expect(markup).toContain("data-receipt-text-frame=\"interpretation\"");
    expect(markup).not.toContain("data-receipt-text-frame=\"reader-note\"");
    for (const className of textFrameClassNames) {
      expect(className).toContain("overflow-visible");
      expect(className).not.toContain("max-h-[");
      expect(className).not.toContain("overflow-hidden");
    }
    expect(markup).not.toContain("overflow-y-auto");
    expect(markup).not.toContain("[scrollbar-width:thin]");
    expect(markup).toContain("data-receipt-overflow-guard=\"true\"");
    expect(markup).not.toContain("data-receipt-expand-control=");
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
