"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Fragment, useState, useSyncExternalStore } from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import { getCatReaderById } from "@/lib/cat-readers";
import {
  getDreamSeedSnapshotFromBrowser,
  isDreamSeedRelatedToDreamDate,
  subscribeToDreamSeed,
} from "@/lib/dream-seed";
import {
  getLatestAnalysisSnapshotFromBrowser,
  type LatestAnalysisPayload,
} from "@/lib/dream-storage";
import { manyangAssets } from "@/lib/manyang-assets";
import {
  createPawprintRecord,
  getPawprintAppDate,
  savePawprintToBrowser,
} from "@/lib/pawprints";
import {
  createResultEncyclopediaHref,
  createReceiptFileName,
  createReceiptShareText,
  createReceiptSvg,
} from "@/lib/result-actions";

const fallbackPayload: LatestAnalysisPayload = {
  dreamText: "복도를 맨발로 빠르게 달렸어요. 누군가 뒤에서 부르는 것 같았지만 멈추지 않았어요.",
  dreamDate: "2026-05-24",
  wakeMood: "불안함",
  analysis: {
    dreamId: "fallback-dream",
    analysisId: "fallback-analysis",
    cardId: "fallback-card",
    reader: {
      id: "black_cat",
      name: "검은냥",
      access: "free",
    },
    summary: "맨발로 복도를 달린 꿈",
    symbols: ["학교", "복도", "신발"],
    emotions: ["불안함"],
    themes: ["장소와 전환"],
    interpretation:
      "이 꿈은 목적지보다 준비 상태가 더 신경 쓰이는 마음과 연결되어 보인다냥. 복도는 과정과 이동을, 맨발은 아직 충분히 준비되지 않았다는 감각을 보여주는 듯해요.",
    smallPrescription: "오늘은 미뤄둔 준비물 하나만 먼저 확인해보자냥.",
    symbolReadings: [
      {
        symbol: "복도",
        reading: "복도는 다음 장면으로 이동하는 과정과 전환의 감각으로 읽을 수 있어요.",
      },
      {
        symbol: "신발",
        reading: "신발은 지금 필요한 준비 상태를 확인하게 하는 단서로 볼 수 있어요.",
      },
    ],
    readingBasis: {
      usedSymbols: ["학교", "복도", "신발"],
      mainThemes: ["장소와 전환"],
      confidence: 0.7,
    },
    card: {
      name: "맨발로 복도를 달린 꿈",
      type: "half_moon",
      keywords: ["학교", "복도", "신발"],
      summary: "맨발로 복도를 달린 꿈",
      message: "오늘은 미뤄둔 준비물 하나만 먼저 확인해보자냥.",
      theme: "장소와 전환",
    },
    readerNote: "검은냥은 꿈속 상징과 장면의 연결을 조용히 먼저 살펴봤다냥.",
  },
};

function formatDreamDate(date: string): string {
  return date.replaceAll("-", ".");
}

function subscribeToStorage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

const receiptOriginalWidth = 771;
const receiptTopHeight = 626;
const receiptMiddleHeight = 720;
const receiptBottomHeight = 384;
const receiptTotalHeight = receiptTopHeight + receiptMiddleHeight + receiptBottomHeight;
const receiptContentTopOffset = 360;
const receiptContentBottomInset = 104;
const receiptStampSpaceHeight = 192;
const receiptPaperWidth = "min(calc(100vw - 32px), 372px)";

function getReceiptSliceHeight(height: number): string {
  return `calc(var(--receipt-paper-width) * ${height} / ${receiptOriginalWidth})`;
}

const receiptPaperStyle = {
  "--receipt-paper-width": receiptPaperWidth,
  width: receiptPaperWidth,
} as CSSProperties;

const receiptTopStyle: CSSProperties = {
  height: getReceiptSliceHeight(receiptTopHeight),
};

const receiptMiddleStyle: CSSProperties = {
  top: getReceiptSliceHeight(receiptTopHeight),
  bottom: getReceiptSliceHeight(receiptBottomHeight),
  minHeight: getReceiptSliceHeight(receiptMiddleHeight),
  backgroundImage: "url(/manyang/receipts/empty-middle.webp)",
  backgroundPosition: "top center",
  backgroundRepeat: "repeat-y",
  backgroundSize: "100% auto",
};

const receiptBottomStyle: CSSProperties = {
  height: getReceiptSliceHeight(receiptBottomHeight),
};

const receiptContentStyle: CSSProperties = {
  minHeight: getReceiptSliceHeight(receiptTotalHeight),
  paddingTop: getReceiptSliceHeight(receiptContentTopOffset),
  paddingBottom: getReceiptSliceHeight(receiptContentBottomInset),
};

const receiptStampSpaceStyle: CSSProperties = {
  minHeight: getReceiptSliceHeight(receiptStampSpaceHeight),
};
const receiptPaperSettledDelayMs = 3500;
const receiptTitleDelayMs = 900;
const receiptMetaDelayMs = 4300;
const receiptTagStartDelayMs = 5050;
const receiptTagStepMs = 110;
const receiptInterpretationStartDelayMs = 6200;
const receiptTextGapMs = 260;
const receiptWordBloomMs = 1300;

type SymbolBasisItem = {
  symbol: string;
  reading: string;
};

function getSymbolBasisItems(analysis: LatestAnalysisPayload["analysis"]): SymbolBasisItem[] {
  const readings = analysis.symbolReadings ?? [];
  const readingBySymbol = new Map(readings.map((reading) => [reading.symbol, reading.reading]));
  const orderedSymbols = [
    ...readings.map((reading) => reading.symbol),
    ...(analysis.readingBasis?.usedSymbols ?? []),
    ...analysis.symbols,
  ];
  const uniqueSymbols = Array.from(new Set(orderedSymbols)).filter(Boolean);

  return uniqueSymbols.slice(0, 4).map((symbol) => ({
    symbol,
    reading: readingBySymbol.get(symbol) ?? "꿈에서 잡힌 단서로, 장면과 기분을 읽을 때 함께 참고했어요.",
  }));
}

function createReceiptStreamingWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function getReceiptStreamingStepMs(wordCount: number): number {
  if (wordCount > 90) {
    return 68;
  }

  if (wordCount > 64) {
    return 84;
  }

  if (wordCount > 42) {
    return 108;
  }

  return 155;
}

function shouldPauseAfterReceiptWord(word: string): boolean {
  return /[.!?。！？…]$/.test(word.trim());
}

function getReceiptStreamingWordDelayMs(words: string[], wordIndex: number, startDelayMs: number): number {
  const stepMs = getReceiptStreamingStepMs(words.length);
  let delayMs = startDelayMs;

  for (let index = 0; index < wordIndex; index += 1) {
    delayMs += stepMs;

    if (shouldPauseAfterReceiptWord(words[index])) {
      delayMs += 210;
    }
  }

  return delayMs;
}

function getReceiptStreamingDurationMs(text: string): number {
  const words = createReceiptStreamingWords(text);
  const lastWordDelayMs = words.length > 0 ? getReceiptStreamingWordDelayMs(words, words.length - 1, 0) : 0;

  return Math.min(lastWordDelayMs + receiptWordBloomMs, 9000);
}

function createReceiptDelayStyle(delayMs: number): CSSProperties {
  return {
    animationDelay: `${Math.round(delayMs)}ms`,
  };
}

function shouldShowReceiptExpandControl(text: string, label: string): boolean {
  const wordCount = createReceiptStreamingWords(text).length;

  if (label === "interpretation") {
    return wordCount > 110;
  }

  if (label === "reader-note") {
    return wordCount > 64;
  }

  return wordCount > 42;
}

function getReceiptExpandControlText(label: string, isExpanded: boolean): string {
  if (label === "reader-note") {
    return isExpanded ? "고양이 메모 접기" : "고양이 메모 전체 보기";
  }

  if (label === "small-prescription") {
    return isExpanded ? "작은 처방 접기" : "작은 처방 전체 보기";
  }

  return isExpanded ? "해석 접기" : "해석 전체 보기";
}

function getReceiptGuardedTextClassName(baseClassName: string, maxHeightClassName: string, isExpanded: boolean): string {
  if (isExpanded) {
    return `${baseClassName} overflow-visible`;
  }

  return `${baseClassName} ${maxHeightClassName} overflow-hidden`;
}

function ReceiptStreamingText({
  text,
  label,
  startDelayMs,
  className,
  overflowGuard = false,
  isExpanded = false,
  onToggleExpanded,
}: {
  text: string;
  label: string;
  startDelayMs: number;
  className: string;
  overflowGuard?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const words = createReceiptStreamingWords(text);
  const showExpandControl = overflowGuard && onToggleExpanded && shouldShowReceiptExpandControl(text, label);
  const textFrameId = `receipt-text-${label}`;

  return (
    <>
      <p
        id={textFrameId}
        className={className}
        data-receipt-streaming-text={label}
        data-receipt-text-frame={label}
        data-receipt-overflow-guard={overflowGuard ? "true" : undefined}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden="true">
          {words.map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span
                className="receipt-stream-word"
                style={createReceiptDelayStyle(getReceiptStreamingWordDelayMs(words, index, startDelayMs))}
              >
                {word}
              </span>
              {index < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </span>
      </p>
      {showExpandControl ? (
        <button
          type="button"
          aria-controls={textFrameId}
          aria-expanded={isExpanded}
          className="mt-2 self-start text-[12px] font-semibold text-[#7b5536] underline decoration-[#7b5536]/35 underline-offset-4"
          data-receipt-expand-control={label}
          onClick={onToggleExpanded}
        >
          {getReceiptExpandControlText(label, isExpanded)}
        </button>
      ) : null}
    </>
  );
}

type DreamResultReceiptProps = {
  payloadOverride?: LatestAnalysisPayload;
};

export function DreamResultReceipt({ payloadOverride }: DreamResultReceiptProps = {}) {
  const storedPayload = useSyncExternalStore(
    subscribeToStorage,
    getLatestAnalysisSnapshotFromBrowser,
    () => null,
  );
  const storedSeed = useSyncExternalStore(subscribeToDreamSeed, getDreamSeedSnapshotFromBrowser, () => null);
  const [pawprintCreated, setPawprintCreated] = useState(false);
  const [expandedReceiptTextLabels, setExpandedReceiptTextLabels] = useState<Record<string, boolean>>({});
  const hasStoredPayload = storedPayload !== null;
  const payload = payloadOverride ?? storedPayload ?? fallbackPayload;

  const { analysis } = payload;
  const reader = getCatReaderById(payload.catReaderType ?? analysis.reader?.id);
  const displayMood = payload.wakeMood ?? analysis.emotions[0] ?? "기록 없음";
  const relatedSeed = isDreamSeedRelatedToDreamDate(storedSeed, payload.dreamDate) ? storedSeed : null;
  const symbolBasisItems = getSymbolBasisItems(analysis);
  const readerNoteStartDelayMs =
    receiptInterpretationStartDelayMs + getReceiptStreamingDurationMs(analysis.interpretation) + receiptTextGapMs;
  const prescriptionStartDelayMs =
    readerNoteStartDelayMs +
    (analysis.readerNote ? getReceiptStreamingDurationMs(analysis.readerNote) + receiptTextGapMs : 0);
  const afterReceiptTextDelayMs = Math.min(
    prescriptionStartDelayMs + getReceiptStreamingDurationMs(analysis.smallPrescription) + 360,
    9000,
  );

  function isReceiptTextExpanded(label: string): boolean {
    return Boolean(expandedReceiptTextLabels[label]);
  }

  function toggleReceiptText(label: string) {
    setExpandedReceiptTextLabels((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  function handleDownload() {
    const svg = createReceiptSvg(payload);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = createReceiptFileName(payload);
    anchor.click();
    URL.revokeObjectURL(url);

    const pawprintResult = savePawprintToBrowser(
      createPawprintRecord({
        appDate: getPawprintAppDate(),
        source: "receipt_saved",
        sourceId: analysis.dreamId,
      }),
    );
    setPawprintCreated(pawprintResult?.created ?? false);
  }

  async function handleShare() {
    const text = createReceiptShareText(payload);

    if (navigator.share) {
      await navigator.share({
        title: "오늘의 꿈 영수증",
        text,
      });
      return;
    }

    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="mt-2 space-y-4 pb-5">
      <div
        className="relative left-1/2 w-screen -translate-x-1/2 overflow-visible"
        data-receipt-viewport-frame="true"
      >
        <section
          className="animate-receipt-slide-up relative mx-auto w-full max-w-[372px] overflow-visible"
          data-receipt-paper="sliced"
          style={receiptPaperStyle}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 drop-shadow-[0_18px_60px_rgba(0,0,0,0.38)]"
          >
            <div className="absolute inset-x-0 top-0" style={receiptTopStyle}>
              <Image
                src="/manyang/receipts/empty-top.webp"
                alt=""
                fill
                sizes="372px"
                unoptimized
                className="object-contain"
              />
            </div>
            <div
              className="absolute inset-x-0"
              data-receipt-paper-middle="true"
              style={receiptMiddleStyle}
            />
            <div className="absolute inset-x-0 bottom-0" style={receiptBottomStyle}>
              <Image
                src="/manyang/receipts/empty-bottom.webp"
                alt=""
                fill
                sizes="372px"
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
          <div
            className="relative z-10 mx-auto flex w-[82%] flex-col px-1 text-[#2f2117]"
            style={receiptContentStyle}
          >
            <h1
              className="animate-receipt-title-fade text-center text-[22px] font-semibold leading-[1.35] text-[#24180f]"
              data-receipt-title="true"
              style={createReceiptDelayStyle(receiptTitleDelayMs)}
            >
              {analysis.summary}
            </h1>
            <div
              className="animate-receipt-meta-fade mt-3 space-y-0.5 text-center text-[#5b4029]"
              data-receipt-meta="true"
              style={createReceiptDelayStyle(receiptMetaDelayMs)}
            >
              <p
                className="text-[12px] font-semibold leading-5 tracking-[0.08em] text-[#7b5536]"
                data-receipt-date-line="true"
              >
                {formatDreamDate(payload.dreamDate)}
              </p>
              <p
                className="mx-auto flex max-w-full flex-wrap justify-center gap-x-1.5 gap-y-0.5 text-[12px] font-medium leading-5 tracking-[0.01em] text-[#5b4029]"
                data-receipt-detail-line="true"
              >
                <span className="max-w-full break-keep">{displayMood}</span>
                <span aria-hidden="true">·</span>
                <span className="break-keep">{reader.name}이 읽음</span>
              </p>
            </div>
            <div className="mt-5 flex flex-nowrap justify-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-receipt-symbol-tags="true">
              {analysis.symbols.slice(0, 5).map((symbol, index) => (
                <span
                  key={symbol}
                  className="receipt-tag-pop min-w-[58px] shrink-0 rounded-full border border-[#7b5536]/40 px-3 py-1.5 text-center text-[13px] leading-5 text-[#4b3422]"
                  style={createReceiptDelayStyle(receiptTagStartDelayMs + receiptTagStepMs * index)}
                >
                  {symbol}
                </span>
              ))}
            </div>
            <ReceiptStreamingText
              text={analysis.interpretation}
              label="interpretation"
              startDelayMs={receiptInterpretationStartDelayMs}
              className={getReceiptGuardedTextClassName(
                "mt-6 pr-1 text-[15px] leading-7 text-[#2f2117]",
                "max-h-[22rem]",
                isReceiptTextExpanded("interpretation"),
              )}
              overflowGuard
              isExpanded={isReceiptTextExpanded("interpretation")}
              onToggleExpanded={() => toggleReceiptText("interpretation")}
            />
            {analysis.readerNote ? (
              <ReceiptStreamingText
                text={analysis.readerNote}
                label="reader-note"
                startDelayMs={readerNoteStartDelayMs}
                className={getReceiptGuardedTextClassName(
                  "mt-4 rounded-[0.85rem] border border-[#8b6345]/24 bg-[#d9b984]/36 px-3 py-2 text-[14px] leading-6 text-[#3b2819]",
                  "max-h-[14rem]",
                  isReceiptTextExpanded("reader-note"),
                )}
                overflowGuard
                isExpanded={isReceiptTextExpanded("reader-note")}
                onToggleExpanded={() => toggleReceiptText("reader-note")}
              />
            ) : null}
            <ReceiptStreamingText
              text={analysis.smallPrescription}
              label="small-prescription"
              startDelayMs={prescriptionStartDelayMs}
              className={getReceiptGuardedTextClassName(
                "mt-5 border-t border-[#8b6345]/30 pr-1 pt-5 text-[15px] leading-7 text-[#2f2117]",
                "max-h-[12rem]",
                isReceiptTextExpanded("small-prescription"),
              )}
              overflowGuard
              isExpanded={isReceiptTextExpanded("small-prescription")}
              onToggleExpanded={() => toggleReceiptText("small-prescription")}
            />
            {analysis.safetyNotice ? (
              <p
                className="mt-4 rounded-[0.85rem] border border-[#8b6345]/30 bg-[#f0d39f]/36 px-3 py-2 text-[12px] leading-5 text-[#5b4029]"
                data-receipt-safety-notice="true"
              >
                {analysis.safetyNotice}
              </p>
            ) : null}
            <div
              aria-hidden="true"
              className="mt-7 shrink-0"
              data-receipt-stamp-space="true"
              style={receiptStampSpaceStyle}
            />
          </div>
        </section>
      </div>
      {relatedSeed ? (
        <section
          className="animate-ink-fade rounded-[1.1rem] border border-[#b98255]/45 bg-[rgba(7,6,18,0.76)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md"
          style={createReceiptDelayStyle(afterReceiptTextDelayMs)}
        >
          <p className="flex items-center gap-2 font-semibold text-[#ffd98a]">
            <span className="relative h-5 w-5">
              <Image src={manyangAssets.semanticIcons.star} alt="" fill sizes="20px" unoptimized className="object-contain" />
            </span>
            어젯밤의 꿈 씨앗
          </p>
          <p className="mt-1 text-[#fff3d7]/84">
            {relatedSeed.intentLabel} · {relatedSeed.atmosphere}
          </p>
          {relatedSeed.note ? (
            <p className="mt-1 rounded-[0.8rem] border border-[#7c4a38]/55 bg-[rgba(5,4,12,0.58)] px-3 py-2 text-[#d8c7bc]">
              {relatedSeed.note}
            </p>
          ) : null}
        </section>
      ) : null}
      <div
        className="animate-ink-fade grid grid-cols-2 gap-3"
        data-receipt-result-actions="true"
        style={createReceiptDelayStyle(receiptPaperSettledDelayMs)}
      >
        <AssetTextButton
          frame={manyangAssets.buttons.compactPrimary}
          iconSrc={manyangAssets.actionIcons.download}
          onClick={handleDownload}
          contentClassName="min-h-[3.45rem] px-2.5 text-[14px]"
          iconClassName="h-6 w-6"
        >
          저장하기
        </AssetTextButton>
        <AssetTextButton
          frame={manyangAssets.buttons.compactPrimary}
          iconSrc={manyangAssets.actionIcons.share}
          onClick={() => void handleShare()}
          contentClassName="min-h-[3.45rem] px-2.5 text-[14px]"
          iconClassName="h-6 w-6"
        >
          공유하기
        </AssetTextButton>
      </div>
      <details
        className="group animate-ink-fade overflow-hidden rounded-[1.15rem] border border-[#b98255]/52 bg-[rgba(7,6,18,0.78)] shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md"
        data-symbol-basis-panel="true"
        style={createReceiptDelayStyle(afterReceiptTextDelayMs + 280)}
      >
        <summary className="flex min-h-[4rem] cursor-pointer list-none items-center gap-3 px-4 py-3 text-[#f2c27d] transition hover:text-[#ffe7b5] [&::-webkit-details-marker]:hidden">
          <span className="relative h-9 w-9 shrink-0">
            <Image src={manyangAssets.actionIcons.book} alt="" fill sizes="36px" unoptimized className="object-contain" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold">고양이가 읽은 상징들</span>
            <span className="mt-0.5 block text-[12px] font-medium text-[#caa37b]">
              영수증에 담긴 상징 메모를 펼쳐봅니다
            </span>
          </span>
          <span aria-hidden="true" className="text-xl transition group-open:rotate-90">›</span>
        </summary>
        <div className="space-y-3 border-t border-[#7c4a38]/45 px-4 pb-4 pt-3">
          <p className="text-sm leading-6 text-[#fff3d7]/82">
            꿈 영수증에 담긴 상징 메모예요.
          </p>
          <div className="space-y-2">
            {symbolBasisItems.map((item) => (
              <Link
                key={item.symbol}
                href={createResultEncyclopediaHref(item.symbol)}
                className="block rounded-[0.95rem] border border-[#7c4a38]/58 bg-[rgba(5,4,12,0.62)] px-3 py-3 transition hover:border-[#ffd08a]/72 focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold text-[#caa37b]">꿈에서 잡힌 상징</span>
                    <span className="mt-0.5 block font-semibold text-[#ffd98a]">{item.symbol}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-[#f2c27d]">
                    {item.symbol} 백과 더 보기 ›
                  </span>
                </span>
                <span className="mt-2 block text-[13px] leading-6 text-[#fff3d7]/82">{item.reading}</span>
              </Link>
            ))}
          </div>
        </div>
      </details>
      {pawprintCreated ? <p className="text-center text-sm font-semibold text-[#f0bc7d]">오늘의 발자국이 남았어요.</p> : null}
      {hasStoredPayload ? (
        <p className="text-center text-sm text-[#f0bc7d]/82">이 꿈은 기록에 자동으로 남겨졌어요.</p>
      ) : null}
    </div>
  );
}
