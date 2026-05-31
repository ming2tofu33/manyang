"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AssetImageTextButton } from "./asset-primitives";
import {
  homeActionGroupClassName,
  homeActionRootClassName,
  nightHomeActionGroupClassName,
} from "@/lib/home-action-layout";
import { getHomeState } from "@/lib/home-mode";
import { manyangAssets } from "@/lib/manyang-assets";
import { getNightCheckInSnapshotFromBrowser, subscribeToNightCheckIn } from "@/lib/night-checkin";
import { cn } from "@/lib/styles";

function getCurrentDateSnapshot(): Date | null {
  return null;
}

export function PrimaryDreamButton() {
  return (
    <AssetImageTextButton
      href="/write"
      frame={manyangAssets.buttons.dreammemoryWrite}
      width={860}
      height={235}
      className="mx-auto -my-1.5 block w-[76%] max-w-[288px] px-2 py-0"
      imageClassName="manyang-button-glow"
      contentClassName="pb-0.5 text-[1.42rem]"
    >
      꿈 들려주기
    </AssetImageTextButton>
  );
}

function SecondaryForgotLink() {
  return (
    <Link
      href="/morning"
      className="mx-auto mt-0.5 block w-fit rounded-full px-3 py-1 text-[13px] font-semibold text-[#f2c27d] underline decoration-[#f2c27d]/45 underline-offset-4 [text-shadow:0_0_12px_rgba(0,0,0,0.8)] transition hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
    >
      기억나지 않아요
    </Link>
  );
}

function DailyTarotButton() {
  return (
    <AssetImageTextButton
      href="/tarot"
      frame={manyangAssets.buttons.dreammemoryWrite}
      width={860}
      height={235}
      className="mx-auto -my-1.5 block w-[76%] max-w-[288px] px-2 py-0"
      imageClassName="manyang-button-glow"
      contentClassName="pb-0.5 text-[1.42rem]"
    >
      오늘의 타로 보기
    </AssetImageTextButton>
  );
}

export function TodayHomeActions() {
  const checkIn = useSyncExternalStore(subscribeToNightCheckIn, getNightCheckInSnapshotFromBrowser, () => null);
  const [currentDate, setCurrentDate] = useState<Date | null>(getCurrentDateSnapshot);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentDate(new Date()), 0);

    return () => window.clearTimeout(timer);
  }, []);

  const currentHomeDate = currentDate ?? new Date("2026-05-24T08:00:00");
  const homeState = getHomeState(currentHomeDate, checkIn);
  const isNight = homeState.mode === "night";

  return (
    <div data-home-action-stage="root" className={homeActionRootClassName}>
      <div className="px-3 pb-1 text-center">
        <p
          className={cn(
            "mx-auto font-semibold text-[#fff3d7] [text-shadow:0_0_14px_rgba(0,0,0,0.82)]",
            homeState.checkInBadge ? "max-w-[19rem] text-[14px] leading-5" : "text-[15px]",
          )}
        >
          {homeState.question}
        </p>
        {homeState.checkInBadge ? (
          <p className="mx-auto mt-1.5 max-w-[18rem] rounded-full border border-[#b98255]/45 bg-[#05040b]/52 px-3 py-1.5 text-[12px] font-semibold text-[#f4b65f]/90 backdrop-blur-md">
            {homeState.checkInBadge}
          </p>
        ) : null}
      </div>

      <div className={cn(isNight ? nightHomeActionGroupClassName : homeActionGroupClassName)}>
        <PrimaryDreamButton />
        <DailyTarotButton />
        {isNight ? null : <SecondaryForgotLink />}
      </div>
    </div>
  );
}
