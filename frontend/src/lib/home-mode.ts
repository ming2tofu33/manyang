import type { NightCheckInRecord } from "./night-checkin";
import { getManyangAppDate, getManyangAppHour, shiftManyangAppDate } from "./app-date";

export type HomeMode = "morning" | "night";

export type HomeAction = {
  label: string;
  href: string;
};

export type HomeState = {
  mode: HomeMode;
  question: string;
  primary: HomeAction;
  secondary: HomeAction | null;
  tertiary: HomeAction | null;
  checkInBadge: string | null;
};

function formatLocalDate(date: Date): string {
  return getManyangAppDate(date);
}

function getPreviousLocalDate(date: Date): string {
  return shiftManyangAppDate(formatLocalDate(date), -1);
}

export function isNightHomeTime(date: Date): boolean {
  const hour = getManyangAppHour(date);

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
      question: hasTonightCheckIn ? "오늘 밤의 기록을 남겨두었어요" : "오늘 하루를 비춰줄 단서를 찾아볼까요?",
      primary: { label: "꿈 들려주기", href: "/write" },
      secondary: null,
      tertiary: null,
      checkInBadge: hasTonightCheckIn ? getCheckInBadge(checkIn) : null,
    };
  }

  const hasRecentCheckIn = isMorningCheckInVisible(date, checkIn);

  return {
    mode: "morning",
    question: hasRecentCheckIn
      ? "어젯밤의 기록이 있어요. 꿈에 어떤 장면이 남았나요?"
      : "어젯밤 꿈을 기억하나요?",
    primary: { label: "꿈 들려주기", href: "/write" },
    secondary: { label: "기억나지 않아요", href: "/morning" },
    tertiary: null,
    checkInBadge: hasRecentCheckIn ? getCheckInBadge(checkIn) : null,
  };
}
