"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Download, Share2 } from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  getLatestAnalysisSnapshotFromBrowser,
  type LatestAnalysisPayload,
} from "@/lib/dream-storage";
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
  const hasStoredPayload = storedPayload !== null;
  const payload = storedPayload ?? fallbackPayload;

  const { analysis } = payload;
  const displayMood = payload.wakeMood ?? analysis.emotions[0] ?? "기록 없음";
  const primarySymbolHref = `/encyclopedia/${getPrimarySymbolSlug(analysis.symbols)}`;

  function handleDownload() {
    const svg = createReceiptSvg(payload);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = createReceiptFileName(payload);
    anchor.click();
    URL.revokeObjectURL(url);
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
    <div className="mt-5 space-y-4 pb-5">
      <section className="relative mx-auto min-h-[890px] w-full max-w-[360px] overflow-hidden">
        <Image
          src="/manyang/dreamreceipt-empty.png"
          alt=""
          fill
          sizes="360px"
          unoptimized
          className="object-contain drop-shadow-[0_18px_60px_rgba(0,0,0,0.38)]"
        />
        <div className="relative z-10 mx-auto flex min-h-[890px] w-[78%] flex-col px-1 pt-[152px] text-[#2f2117]">
          <h1 className="text-center text-2xl font-semibold leading-snug text-[#24180f]">
            {analysis.summary}
          </h1>
          <div className="mt-5 flex justify-center gap-2 text-sm text-[#5b4029]">
            <span>{formatDreamDate(payload.dreamDate)}</span>
            <span>|</span>
            <span>{displayMood}</span>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {analysis.symbols.slice(0, 5).map((symbol) => (
              <span key={symbol} className="rounded-full border border-[#7b5536]/40 px-4 py-2 text-sm text-[#4b3422]">
                {symbol}
              </span>
            ))}
          </div>
          <p className="mt-7 text-[15px] leading-7 text-[#2f2117]">{analysis.interpretation}</p>
          <p className="mt-5 border-t border-[#8b6345]/30 pt-5 text-[15px] leading-7 text-[#2f2117]">
            {analysis.smallPrescription}
          </p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full border border-[#b98255]/75 bg-[rgba(5,4,11,0.62)] px-4 py-3 text-lg font-bold text-[#f2c27d] shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[#ffd08a]/75 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
        >
          <Download size={22} aria-hidden="true" />
          저장하기
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full border border-[#b98255]/75 bg-[rgba(5,4,11,0.62)] px-4 py-3 text-lg font-bold text-[#f2c27d] shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[#ffd08a]/75 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
        >
          <Share2 size={22} aria-hidden="true" />
          공유하기
        </button>
      </div>
      <Link
        href={primarySymbolHref}
        className="flex min-h-[3.75rem] w-full items-center justify-between rounded-full border border-[#b98255]/75 bg-[rgba(5,4,11,0.62)] px-6 py-3.5 text-lg font-bold text-[#f2c27d] shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[#ffd08a]/75 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
      >
        <span className="flex items-center gap-3">
          <BookOpen size={23} aria-hidden="true" />
          상징 백과에서 자세히 보기
        </span>
        <span aria-hidden="true">›</span>
      </Link>
      {hasStoredPayload ? (
        <p className="text-center text-sm text-[#f0bc7d]/82">이 꿈은 기록에 자동으로 남겨졌어요.</p>
      ) : null}
    </div>
  );
}
