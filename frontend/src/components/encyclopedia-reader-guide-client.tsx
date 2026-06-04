"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
  type CatReaderId,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

function subscribeToLocationChange(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);

  return () => window.removeEventListener("popstate", onStoreChange);
}

function getResultSourceSnapshotFromBrowser() {
  return new URLSearchParams(window.location.search).get("from") === "result";
}

function getResultSourceSnapshotFromServer() {
  return false;
}

function useIsResultSource(source: "default" | "result" = "default") {
  const isResultSourceFromQuery = useSyncExternalStore(
    subscribeToLocationChange,
    getResultSourceSnapshotFromBrowser,
    getResultSourceSnapshotFromServer,
  );

  return source === "result" || isResultSourceFromQuery;
}

function useSelectedCatReader() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );

  return getCatReaderById(selectedCatReaderId);
}

export function getEncyclopediaBannerForCatReader(readerId: CatReaderId): string {
  const reader = getCatReaderById(readerId);

  return manyangAssets.illustrations.encyclopediaBanners[reader.assetKey];
}

export function EncyclopediaBackgroundOverlay() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const reader = getCatReaderById(selectedCatReaderId);
  const backgroundSrc = manyangAssets.illustrations.encyclopediaBanners[reader.assetKey];

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[20.5rem] overflow-hidden">
        <Image
          key={backgroundSrc}
          src={backgroundSrc}
          alt=""
          width={1536}
          height={1024}
          priority
          sizes="430px"
          className="absolute left-1/2 top-0 h-[20.5rem] w-[30.75rem] max-w-none -translate-x-1/2 object-cover opacity-95"
        />
      </div>
      <div className="absolute inset-x-0 top-0 h-[12.5rem] bg-[linear-gradient(180deg,rgba(5,4,11,0.54),rgba(5,4,11,0.26)_58%,rgba(5,4,11,0.00))]" />
      <div className="absolute inset-x-0 top-[13.5rem] h-[10rem] bg-[linear-gradient(180deg,rgba(5,4,11,0.00),rgba(5,4,11,0.86)_62%,rgba(5,4,11,0.99))]" />
      <section
        className="absolute left-[11.25rem] right-4 top-[8.85rem] rounded-[1.1rem] border border-[#8c5948]/70 bg-[rgba(8,6,17,0.78)] px-4 py-3 text-left shadow-[0_0_22px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md before:absolute before:left-[-0.43rem] before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rotate-45 before:border-b before:border-l before:border-[#8c5948]/70 before:bg-[rgba(8,6,17,0.78)]"
        data-encyclopedia-speech-bubble="true"
      >
        <p className="text-[12px] font-semibold text-[#f0bc7d]">{reader.name} 사전 안내</p>
        <p className="mt-1 text-[14px] leading-5 text-[#fff3d7]">
          꿈속의 상징은 마음을 비추는 작은 거울이라냥.
        </p>
      </section>
    </>
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

export function EncyclopediaResultContextClient({ source = "default" }: { source?: "default" | "result" }) {
  const isResultSource = useIsResultSource(source);

  if (!isResultSource) {
    return null;
  }

  return <ResultContextPanel />;
}

export function ResultContextPanel() {
  return (
    <section
      className="rounded-[1.15rem] border border-[#b98255]/52 bg-[rgba(7,6,18,0.78)] p-4 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md"
      data-result-encyclopedia-context="true"
    >
      <p className="text-sm font-semibold text-[#ffd98a]">영수증에 담긴 상징 메모</p>
      <p className="mt-2 text-[15px] leading-6 text-[#fff3d7]/84">
        방금 받은 꿈 영수증에서 이어서 살펴보는 상징이에요.
      </p>
    </section>
  );
}

export function EncyclopediaDetailActionClient({
  symbol,
  slug,
  source = "default",
}: {
  symbol: string;
  slug: string;
  source?: "default" | "result";
}) {
  const isResultSource = useIsResultSource(source);

  return (
    <section className={cn(ui.panel, "p-5")}>
      <p className="text-lg font-semibold leading-7 text-[#ffd98a]">
        {isResultSource ? `${symbol} 상징을 더 살펴봤어요` : `내 꿈에도 ${symbol}${getSubjectParticle(symbol)} 나왔나요?`}
      </p>
      <p className="mt-2 text-[15px] leading-6 text-[#fff3d7]/82">
        {isResultSource
          ? "영수증으로 돌아가 다른 상징과 함께 보면 꿈의 흐름이 더 선명해져요."
          : "상징만으로 단정하기보다 꿈의 장면과 기분을 함께 넣으면 더 자연스럽게 읽을 수 있어요."}
      </p>
      <AssetTextButton
        href={isResultSource ? "/result" : `/write?symbol=${slug}`}
        frame={isResultSource ? manyangAssets.buttons.mediumPrimary : manyangAssets.buttons.dreammemorySubmit}
        iconSrc={isResultSource ? manyangAssets.actionIcons.arrowLeft : manyangAssets.actionIcons.pencil}
        className="mt-4"
        contentClassName="min-h-[3.35rem] text-base"
        iconClassName="h-7 w-7"
      >
        {isResultSource ? "영수증으로 돌아가기" : "오늘의 꿈 영수증 받기"}
      </AssetTextButton>
      {isResultSource ? (
        <AssetTextButton
          href="/encyclopedia"
          frame={manyangAssets.buttons.mediumSecondary}
          iconSrc={manyangAssets.actionIcons.book}
          className="mt-3"
          contentClassName="min-h-[3.25rem] text-base"
          iconClassName="h-7 w-7"
        >
          다른 상징도 보기
        </AssetTextButton>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-[#caa37b]">
        마냥 꿈해몽은 오락과 자기 성찰을 위한 해석을 제공하며, 의학적·법적·심리 진단을 대신하지 않아요.
      </p>
    </section>
  );
}

function getSubjectParticle(value: string): "이" | "가" {
  const lastChar = value.at(-1);

  if (!lastChar) {
    return "이";
  }

  const code = lastChar.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (code < hangulStart || code > hangulEnd) {
    return "이";
  }

  return (code - hangulStart) % 28 === 0 ? "가" : "이";
}
