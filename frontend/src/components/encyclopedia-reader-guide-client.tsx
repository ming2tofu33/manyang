"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

function useSelectedCatReader() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );

  return getCatReaderById(selectedCatReaderId);
}

export function EncyclopediaReaderIntroCard() {
  const reader = useSelectedCatReader();

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-[#7c4a38]/60 bg-[rgba(5,4,12,0.74)] px-4 py-4 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="relative h-16 w-16 shrink-0">
          <Image
            src={manyangAssets.illustrations[reader.assetKey]}
            alt={`${reader.name} 백과 안내`}
            fill
            sizes="64px"
            unoptimized
            className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.26)]"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[#f0bc7d]">{reader.name} 사전 안내</p>
          <p className="mt-1 text-[15px] leading-6 text-[#fff3d7]">
            꿈속의 상징은 마음을 비추는 작은 거울이라냥.
          </p>
        </div>
      </div>
    </section>
  );
}

export function EncyclopediaReaderGuideNote() {
  const reader = useSelectedCatReader();

  return (
    <section className="relative overflow-hidden rounded-[1.1rem] border border-[#7c4a38]/58 bg-[linear-gradient(135deg,rgba(44,22,74,0.82),rgba(8,6,18,0.82))] p-3 shadow-[0_0_24px_rgba(0,0,0,0.26)]">
      <div className="relative z-10 flex items-center gap-3">
        <span className="relative h-16 w-16 shrink-0">
          <Image
            src={manyangAssets.illustrations[reader.assetKey]}
            alt=""
            fill
            sizes="64px"
            unoptimized
            className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.28)]"
          />
        </span>
        <p className="text-sm leading-6 text-[#f1c5d8]">
          같은 상징도 꿈의 장면과 기분에 따라 다르게 읽을 수 있어요. 여러 조각을 함께 보면 더 선명한 흐름을 찾을 수 있어요.
        </p>
      </div>
      <span className="pointer-events-none absolute right-4 top-4 text-2xl text-[#b970ff]/60">✦</span>
    </section>
  );
}

export function EncyclopediaReaderSymbolHint({ hint }: { hint: string }) {
  const reader = useSelectedCatReader();

  return (
    <section className={cn(ui.panel, "flex gap-4 p-5")}>
      <span className="relative mt-1 h-16 w-16 shrink-0">
        <Image
          src={manyangAssets.illustrations[reader.assetKey]}
          alt={`${reader.name} 상징 힌트`}
          fill
          sizes="64px"
          unoptimized
          className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.28)]"
        />
      </span>
      <div>
        <p className="text-sm text-[#f0bc7d]">{reader.name} 상징 힌트</p>
        <p className="mt-3 leading-7 text-[#fff3d7]/88">{hint}</p>
      </div>
    </section>
  );
}
