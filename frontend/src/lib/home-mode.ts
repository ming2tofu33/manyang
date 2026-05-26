import type { DreamSeedRecord } from "./dream-seed";

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
  seedBadge: string | null;
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

function getSeedBadge(seed: DreamSeedRecord | null): string | null {
  return seed ? `씨앗: ${seed.intentLabel}` : null;
}

function isMorningSeedVisible(date: Date, seed: DreamSeedRecord | null): boolean {
  if (!seed) {
    return false;
  }

  const today = formatLocalDate(date);
  const yesterday = getPreviousLocalDate(date);

  return seed.seedDate === today || seed.seedDate === yesterday;
}

function isTonightSeedVisible(date: Date, seed: DreamSeedRecord | null): boolean {
  if (!seed) {
    return false;
  }

  return seed.seedDate === formatLocalDate(date);
}

export function getHomeState(date: Date, seed: DreamSeedRecord | null): HomeState {
  if (isNightHomeTime(date)) {
    const hasTonightSeed = isTonightSeedVisible(date, seed);

    return {
      mode: "night",
      question: hasTonightSeed ? "오늘 밤 씨앗을 심어두었어요" : "오늘 밤 꿈에게 무엇을 물어볼까요?",
      primary: { label: "꿈 씨앗 심기", href: "/seed" },
      secondary: { label: "오늘 기록 보기", href: "/archive" },
      tertiary: { label: "어젯밤 꿈 들려주기", href: "/write" },
      seedBadge: hasTonightSeed ? getSeedBadge(seed) : null,
    };
  }

  const hasRecentSeed = isMorningSeedVisible(date, seed);

  return {
    mode: "morning",
    question: hasRecentSeed
      ? "어젯밤 심은 꿈 씨앗이 있어요. 꿈에 어떤 장면이 남았나요?"
      : "어젯밤 꿈을 기억하나요?",
    primary: { label: "꿈 들려주기", href: "/write" },
    secondary: { label: "기억나지 않아요", href: "/morning" },
    tertiary: { label: "오늘 밤 꿈 씨앗 심기", href: "/seed" },
    seedBadge: hasRecentSeed ? getSeedBadge(seed) : null,
  };
}
