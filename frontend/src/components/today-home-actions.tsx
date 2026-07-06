"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { AssetImageTextButton } from "./asset-primitives";
import {
  homeActionButtonClassName,
  homeActionButtonContentClassName,
  homeActionGroupClassName,
  homeActionQuestionClassName,
  homeActionRootClassName,
  nightHomeActionGroupClassName,
} from "@/lib/home-action-layout";
import { getHomeState } from "@/lib/home-mode";
import { manyangAssets } from "@/lib/manyang-assets";
import { getNightCheckInSnapshotFromBrowser, subscribeToNightCheckIn } from "@/lib/night-checkin";
import { cn } from "@/lib/styles";
import { useAccessPlan } from "@/lib/use-access-plan";
import { useAdminLabTimeOverride } from "@/lib/use-admin-lab-time-override";
import { useCurrentAppDate } from "@/lib/use-current-app-date";

export function PrimaryDreamButton() {
  return (
    <AssetImageTextButton
      href="/write"
      frame={manyangAssets.buttons.dreammemoryWrite}
      width={860}
      height={235}
      priority
      className={homeActionButtonClassName}
      imageClassName="manyang-button-glow"
      contentClassName={homeActionButtonContentClassName}
    >
      꿈 들려주기
    </AssetImageTextButton>
  );
}

function SecondaryForgotLink() {
  return (
    <Link
      href="/morning"
      className="mx-auto mt-0.5 block w-fit rounded-full px-3 py-1 text-[13px] font-semibold text-[var(--manyang-cat-link)] underline decoration-[var(--manyang-cat-link-decoration)] underline-offset-4 [text-shadow:var(--manyang-cat-home-text-shadow)] transition hover:text-[var(--manyang-cat-link-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--manyang-cat-focus)]"
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
      priority
      className={homeActionButtonClassName}
      imageClassName="manyang-button-glow"
      contentClassName={homeActionButtonContentClassName}
    >
      오늘의 타로 보기
    </AssetImageTextButton>
  );
}

export function TodayHomeActions({ currentDate: currentDateOverride }: { currentDate?: Date } = {}) {
  const accessState = useAccessPlan();
  const adminLabTime = useAdminLabTimeOverride(accessState.role);
  const checkIn = useSyncExternalStore(subscribeToNightCheckIn, getNightCheckInSnapshotFromBrowser, () => null);
  const currentDate = useCurrentAppDate();

  const currentHomeDate = currentDateOverride ?? adminLabTime.forcedDate ?? currentDate;
  const homeState = currentHomeDate ? getHomeState(currentHomeDate, checkIn) : null;
  const isNight = homeState?.mode === "night";

  return (
    <div
      data-home-action-stage="root"
      data-admin-lab-time-override={adminLabTime.override}
      className={homeActionRootClassName}
    >
      <div className="px-3 pb-1 text-center">
        <p
          className={cn(
            homeActionQuestionClassName,
            "text-[#fff3d7] [text-shadow:0_0_14px_rgba(0,0,0,0.82)]",
            "text-[var(--manyang-cat-home-text)] [text-shadow:var(--manyang-cat-home-text-shadow)]",
            homeState?.checkInBadge ? "max-w-[19rem] text-[14px] leading-5" : "text-[15px]",
          )}
        >
          {homeState?.question ?? "오늘의 기록 시간을 확인하고 있어요"}
        </p>
        {homeState?.checkInBadge ? (
          <p className="mx-auto mt-1.5 max-w-[18rem] rounded-full border border-[color:var(--manyang-cat-badge-border)] bg-[var(--manyang-cat-badge-bg)] px-3 py-1.5 text-[12px] font-semibold text-[var(--manyang-cat-badge-text)] backdrop-blur-md">
            {homeState.checkInBadge}
          </p>
        ) : null}
      </div>

      <div className={cn(isNight ? nightHomeActionGroupClassName : homeActionGroupClassName)}>
        <PrimaryDreamButton />
        <DailyTarotButton />
        {homeState && !isNight ? <SecondaryForgotLink /> : null}
      </div>
    </div>
  );
}
