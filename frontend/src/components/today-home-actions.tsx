"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AssetImageTextButton } from "./asset-primitives";
import { CatReaderPicker } from "./cat-reader-picker";
import {
  getCatReaderDreamReadingState,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  saveSelectedCatReaderIdToBrowser,
  subscribeToSelectedCatReader,
  type CatReaderDreamReadingState,
} from "@/lib/cat-readers";
import { getDreamSeedSnapshotFromBrowser, subscribeToDreamSeed } from "@/lib/dream-seed";
import { nightHomeActionGroupClassName } from "@/lib/home-action-layout";
import { getHomeState } from "@/lib/home-mode";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";

function getCurrentDateSnapshot(): Date | null {
  return null;
}

type PrimaryDreamButtonProps = {
  readingState: CatReaderDreamReadingState;
  onFallbackReaderClick: () => void;
};

function PrimaryDreamButton({ readingState, onFallbackReaderClick }: PrimaryDreamButtonProps) {
  if (!readingState.isAvailable) {
    return (
      <div className="space-y-1.5">
        <AssetImageTextButton
          frame={manyangAssets.buttons.dreammemoryWrite}
          width={860}
          height={375}
          disabled
          ariaLabel={readingState.blockedLabel ?? "Moon Pass에서 열려요"}
          className="mx-auto -my-1.5 block w-[82%] max-w-[310px] px-3 py-2 disabled:cursor-not-allowed"
          imageClassName="manyang-button-glow opacity-75 grayscale-[0.28]"
          contentClassName="pb-0.5 text-[0.98rem] leading-tight"
        >
          {readingState.blockedLabel}
        </AssetImageTextButton>
        <button
          type="button"
          onClick={onFallbackReaderClick}
          className="mx-auto block rounded-full border border-[#b98255]/48 bg-[#05040b]/58 px-4 py-2 text-[12px] font-semibold text-[#f4b65f] shadow-[0_0_18px_rgba(0,0,0,0.26)] backdrop-blur-md transition hover:border-[#d799ff]/60 hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
        >
          검은냥으로 무료 해몽 받기
        </button>
      </div>
    );
  }

  return (
    <AssetImageTextButton
      href="/write"
      frame={manyangAssets.buttons.dreammemoryWrite}
      width={860}
      height={375}
      className="mx-auto -my-1.5 block w-[82%] max-w-[310px] px-3 py-2"
      imageClassName="manyang-button-glow"
      contentClassName="pb-0.5 text-[1.72rem]"
    >
      꿈 들려주기
    </AssetImageTextButton>
  );
}

function SecondaryForgotButton() {
  return (
    <AssetImageTextButton
      href="/morning"
      frame={manyangAssets.buttons.dreammemoryForgot}
      width={808}
      height={148}
      sizes="302px"
      className="mx-auto -my-1 block w-[54%] px-2 py-1"
      imageClassName="manyang-button-glow-soft"
      contentClassName="text-[1.03rem]"
    >
      기억나지 않아요
    </AssetImageTextButton>
  );
}

function NightSeedButton() {
  return (
    <AssetImageTextButton
      href="/seed"
      frame={manyangAssets.buttons.dreamseed}
      width={852}
      height={300}
      sizes="250px"
      className="mx-auto -my-1 block w-[60%] max-w-[240px] px-2 py-1"
      imageClassName="manyang-button-glow-soft"
      contentClassName="pb-0.5 text-[1.12rem]"
    >
      꿈 씨앗 심기
    </AssetImageTextButton>
  );
}

export function TodayHomeActions() {
  const seed = useSyncExternalStore(subscribeToDreamSeed, getDreamSeedSnapshotFromBrowser, () => null);
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const [currentDate, setCurrentDate] = useState<Date | null>(getCurrentDateSnapshot);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentDate(new Date()), 0);

    return () => window.clearTimeout(timer);
  }, []);

  const homeState = getHomeState(currentDate ?? new Date("2026-05-24T08:00:00"), seed);
  const isNight = homeState.mode === "night";
  const readingState = getCatReaderDreamReadingState(selectedCatReaderId);

  return (
    <div className={cn("mt-auto", isNight ? "pb-0" : "space-y-2 pb-1")}>
      <div className="px-3 pb-1 text-center">
        <p
          className={cn(
            "mx-auto font-semibold text-[#fff3d7] [text-shadow:0_0_14px_rgba(0,0,0,0.82)]",
            homeState.seedBadge ? "max-w-[19rem] text-[14px] leading-5" : "text-[15px]",
          )}
        >
          {homeState.question}
        </p>
        {homeState.seedBadge ? (
          <p className="mx-auto mt-1.5 max-w-[18rem] rounded-full border border-[#b98255]/45 bg-[#05040b]/52 px-3 py-1.5 text-[12px] font-semibold text-[#f4b65f]/90 backdrop-blur-md">
            {homeState.seedBadge}
          </p>
        ) : null}
      </div>

      <CatReaderPicker
        value={selectedCatReaderId}
        onChange={saveSelectedCatReaderIdToBrowser}
        className="mx-auto w-[82%] max-w-[330px]"
      />

      <div className={cn(isNight ? nightHomeActionGroupClassName : "space-y-2")}>
        <PrimaryDreamButton
          readingState={readingState}
          onFallbackReaderClick={() => saveSelectedCatReaderIdToBrowser(readingState.fallbackReaderId ?? "black_cat")}
        />
        {isNight ? <NightSeedButton /> : <SecondaryForgotButton />}

        <Link
          href={homeState.tertiary.href}
          className={cn(
            "mx-auto block w-fit rounded-full px-4 py-2 text-center text-[13px] font-semibold text-[#f4b65f] transition hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#f7d58b]",
            isNight ? "mt-2" : "",
          )}
        >
          {homeState.tertiary.label} &gt;
        </Link>
      </div>
    </div>
  );
}
