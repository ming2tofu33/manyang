import type { NightCheckInRecord } from "./night-checkin";
import { nightCheckInRoute } from "./night-checkin-options";

export type HomeMode = "morning" | "night";

export type HomeAction = {
  label: string;
  href: string;
};

export type HomeState = {
  mode: HomeMode;
  question: string;
  primary: HomeAction;
  secondary: HomeAction;
  tertiary: HomeAction;
  checkInBadge: string | null;
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPreviousLocalDate(date: Date): string {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);

  return formatLocalDate(previousDate);
}

export function isNightHomeTime(date: Date): boolean {
  const hour = date.getHours();

  return hour >= 19 || hour < 5;
}

function getCheckInBadge(checkIn: NightCheckInRecord | null): string | null {
  return checkIn ? `밤 기록: ${checkIn.moodLabel} · ${checkIn.conditionLabel}` : null;
}

function isMorningCheckInVisible(date: Date, checkIn: NightCheckInRecord | null): boolean {
  if (!checkIn) {
    return false;
  }

  const today = formatLocalDate(date);
  const yesterday = getPreviousLocalDate(date);

  return checkIn.checkInDate === today || checkIn.checkInDate === yesterday;
}

function isTonightCheckInVisible(date: Date, checkIn: NightCheckInRecord | null): boolean {
  if (!checkIn) {
    return false;
  }

  return checkIn.checkInDate === formatLocalDate(date);
}

export function getHomeState(date: Date, checkIn: NightCheckInRecord | null): HomeState {
  if (isNightHomeTime(date)) {
    const hasTonightCheckIn = isTonightCheckInVisible(date, checkIn);

    return {
      mode: "night",
      question: hasTonightCheckIn ? "오늘 밤의 기록을 남겨두었어요" : "오늘 하루의 기분과 컨디션을 남겨볼까요?",
      primary: { label: "꿈 해몽하기", href: "/write" },
      secondary: { label: "밤의 기록 남기기", href: nightCheckInRoute },
      tertiary: { label: "오늘 기록 보기", href: "/archive" },
      checkInBadge: hasTonightCheckIn ? getCheckInBadge(checkIn) : null,
    };
  }

  const hasRecentCheckIn = isMorningCheckInVisible(date, checkIn);

  return {
    mode: "morning",
    question: hasRecentCheckIn
      ? "어젯밤의 기록이 있어요. 꿈에 어떤 장면이 남았나요?"
      : "어젯밤 꿈을 기억하나요?",
    primary: { label: "꿈 해몽하기", href: "/write" },
    secondary: { label: "기억나지 않아요", href: "/morning" },
    tertiary: { label: "오늘 밤 기록 남기기", href: nightCheckInRoute },
    checkInBadge: hasRecentCheckIn ? getCheckInBadge(checkIn) : null,
  };
}
