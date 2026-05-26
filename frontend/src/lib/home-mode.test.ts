import { describe, expect, test } from "vitest";

import { getHomeState, isNightHomeTime } from "./home-mode";
import type { DreamSeedRecord } from "./dream-seed";

function createSeed(seedDate: string): DreamSeedRecord {
  return {
    intentId: "question",
    intentLabel: "지금 내 마음이 궁금해",
    atmosphere: "편안한",
    note: "",
    seedDate,
    savedAt: `${seedDate}T13:00:00.000Z`,
  };
}

describe("home mode", () => {
  test("treats 05:00 through 18:59 as morning mode", () => {
    expect(isNightHomeTime(new Date("2026-05-24T05:00:00"))).toBe(false);
    expect(isNightHomeTime(new Date("2026-05-24T18:59:00"))).toBe(false);
  });

  test("treats 19:00 through 04:59 as night mode", () => {
    expect(isNightHomeTime(new Date("2026-05-24T19:00:00"))).toBe(true);
    expect(isNightHomeTime(new Date("2026-05-24T04:59:00"))).toBe(true);
  });

  test("uses dream writing as the morning primary action", () => {
    expect(getHomeState(new Date("2026-05-24T08:00:00"), null)).toMatchObject({
      mode: "morning",
      question: "어젯밤 꿈을 기억하나요?",
      primary: { label: "꿈 들려주기", href: "/write" },
      secondary: { label: "기억나지 않아요", href: "/morning" },
      tertiary: { label: "오늘 밤 꿈 씨앗 심기", href: "/seed" },
    });
  });

  test("uses dream seed as the night primary action", () => {
    expect(getHomeState(new Date("2026-05-24T22:00:00"), null)).toMatchObject({
      mode: "night",
      question: "오늘 밤 꿈에게 무엇을 물어볼까요?",
      primary: { label: "꿈 씨앗 심기", href: "/seed" },
      secondary: { label: "오늘 기록 보기", href: "/archive" },
      tertiary: { label: "어젯밤 꿈 들려주기", href: "/write" },
    });
  });

  test("connects a same-day early-morning seed to the morning home", () => {
    expect(getHomeState(new Date("2026-05-24T08:00:00"), createSeed("2026-05-24"))).toMatchObject({
      mode: "morning",
      question: "어젯밤 심은 꿈 씨앗이 있어요. 꿈에 어떤 장면이 남았나요?",
      seedBadge: "씨앗: 지금 내 마음이 궁금해",
    });
  });

  test("connects a previous-day seed to the next morning home", () => {
    expect(getHomeState(new Date("2026-05-25T08:00:00"), createSeed("2026-05-24"))).toMatchObject({
      mode: "morning",
      seedBadge: "씨앗: 지금 내 마음이 궁금해",
    });
  });

  test("shows saved seed state at night when tonight already has a seed", () => {
    expect(getHomeState(new Date("2026-05-24T22:00:00"), createSeed("2026-05-24"))).toMatchObject({
      mode: "night",
      question: "오늘 밤 씨앗을 심어두었어요",
      seedBadge: "씨앗: 지금 내 마음이 궁금해",
    });
  });
});
