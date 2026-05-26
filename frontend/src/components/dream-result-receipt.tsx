"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

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
  createReceiptFileName,
  createReceiptShareText,
  createReceiptSvg,
  getPrimarySymbolSlug,
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

export function DreamResultReceipt() {
  const storedPayload = useSyncExternalStore(
    subscribeToStorage,
    getLatestAnalysisSnapshotFromBrowser,
    () => null,
  );
  const storedSeed = useSyncExternalStore(subscribeToDreamSeed, getDreamSeedSnapshotFromBrowser, () => null);
  const [pawprintCreated, setPawprintCreated] = useState(false);
  const hasStoredPayload = storedPayload !== null;
  const payload = storedPayload ?? fallbackPayload;

  const { analysis } = payload;
  const reader = getCatReaderById(payload.catReaderType ?? analysis.reader?.id);
  const displayMood = payload.wakeMood ?? analysis.emotions[0] ?? "기록 없음";
  const primarySymbolHref = `/encyclopedia/${getPrimarySymbolSlug(analysis.symbols)}`;
  const relatedSeed = isDreamSeedRelatedToDreamDate(storedSeed, payload.dreamDate) ? storedSeed : null;

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
      <section className="animate-receipt-slide-up relative mx-auto aspect-[771/1730] w-full max-w-[360px] overflow-hidden">
        <Image
          src="/manyang/receipts/empty.png"
          alt=""
          fill
          sizes="360px"
          unoptimized
          className="object-contain drop-shadow-[0_18px_60px_rgba(0,0,0,0.38)]"
        />
        <div className="relative z-10 mx-auto flex h-full w-[78%] flex-col px-1 pt-[152px] text-[#2f2117]">
          <h1 className="animate-ink-fade text-center text-2xl font-semibold leading-snug text-[#24180f]" style={{ animationDelay: "1.0s" }}>
            {analysis.summary}
          </h1>
          <div className="animate-ink-fade mt-5 flex justify-center gap-2 text-sm text-[#5b4029]" style={{ animationDelay: "1.5s" }}>
            <span>{formatDreamDate(payload.dreamDate)}</span>
            <span>|</span>
            <span>{displayMood}</span>
          </div>
          <p className="animate-ink-fade mt-2 text-center text-sm font-semibold text-[#6b4d36]" style={{ animationDelay: "1.7s" }}>
            From. {reader.name}
          </p>
          <div className="animate-ink-fade mt-6 flex flex-wrap justify-center gap-2" style={{ animationDelay: "2.0s" }}>
            {analysis.symbols.slice(0, 5).map((symbol) => (
              <span key={symbol} className="rounded-full border border-[#7b5536]/40 px-4 py-2 text-sm text-[#4b3422]">
                {symbol}
              </span>
            ))}
          </div>
          <p className="animate-ink-fade mt-7 text-[15px] leading-7 text-[#2f2117]" style={{ animationDelay: "2.6s" }}>{analysis.interpretation}</p>
          {analysis.readerNote ? (
            <p className="animate-ink-fade mt-4 rounded-[0.85rem] border border-[#8b6345]/24 bg-[#d9b984]/36 px-3 py-2 text-[14px] leading-6 text-[#3b2819]" style={{ animationDelay: "3.0s" }}>
              {analysis.readerNote}
            </p>
          ) : null}
          <p className="animate-ink-fade mt-5 border-t border-[#8b6345]/30 pt-5 text-[15px] leading-7 text-[#2f2117]" style={{ animationDelay: "3.3s" }}>
            {analysis.smallPrescription}
          </p>
        </div>
      </section>
      {relatedSeed ? (
        <section
          className="animate-ink-fade rounded-[1.1rem] border border-[#b98255]/45 bg-[rgba(7,6,18,0.76)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md"
          style={{ animationDelay: "3.7s" }}
        >
          <p className="flex items-center gap-2 font-semibold text-[#ffd98a]">
            <span className="relative h-5 w-5">
              <Image src={manyangAssets.icons.star} alt="" fill sizes="20px" unoptimized className="object-contain" />
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
      <div className="animate-ink-fade grid grid-cols-2 gap-3" style={{ animationDelay: "4.0s" }}>
        <AssetTextButton
          frame={manyangAssets.boxes.pillWide}
          iconSrc={manyangAssets.icons.download}
          onClick={handleDownload}
          contentClassName="min-h-[3.75rem] px-3 text-[15px]"
          iconClassName="h-7 w-7"
        >
          저장하기
        </AssetTextButton>
        <AssetTextButton
          frame={manyangAssets.boxes.pillWide}
          iconSrc={manyangAssets.icons.share}
          onClick={() => void handleShare()}
          contentClassName="min-h-[3.75rem] px-3 text-[15px]"
          iconClassName="h-7 w-7"
        >
          공유하기
        </AssetTextButton>
      </div>
      <AssetTextButton
        href={primarySymbolHref}
        frame={manyangAssets.boxes.pillDashedSparkles}
        iconSrc={manyangAssets.icons.book}
        className="animate-ink-fade"
        contentClassName="min-h-[3.75rem] justify-start px-5 text-left text-[16px]"
        iconClassName="h-8 w-8"
        style={{ animationDelay: "4.3s" }}
      >
        <span className="min-w-0 flex-1">상징 백과에서 자세히 보기</span>
        <span aria-hidden="true">›</span>
      </AssetTextButton>
      {pawprintCreated ? <p className="text-center text-sm font-semibold text-[#f0bc7d]">오늘의 발자국이 남았어요.</p> : null}
      {hasStoredPayload ? (
        <p className="text-center text-sm text-[#f0bc7d]/82">이 꿈은 기록에 자동으로 남겨졌어요.</p>
      ) : null}
    </div>
  );
}
