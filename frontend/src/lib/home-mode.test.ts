import { describe, expect, test } from "vitest";

import { getHomeState } from "./home-mode";
import type { NightCheckInRecord } from "./night-checkin";

function createNightCheckIn(checkInDate: string): NightCheckInRecord {
  return {
    moodId: "calm",
    moodLabel: "편안함",
    conditionId: "okay",
    conditionLabel: "괜찮음",
    note: "잠들기 전 마음이 차분했다",
    checkInDate,
    savedAt: "2026-05-31T12:00:00.000Z",
  };
}

describe("home mode", () => {
  test("uses night check-in copy and route during night time", () => {
    const state = getHomeState(new Date("2026-05-31T22:00:00"), null);

    expect(state.mode).toBe("night");
    expect(state.question).toBe("오늘 하루의 기분과 컨디션을 남겨볼까요?");
    expect(state.secondary).toEqual({ label: "밤의 기록 남기기", href: "/night" });
    expect(JSON.stringify(state)).not.toMatch(/씨앗|심기|seed/);
  });

  test("shows last night's check-in context in the morning", () => {
    const state = getHomeState(new Date("2026-05-31T08:00:00"), createNightCheckIn("2026-05-30"));

    expect(state.question).toBe("어젯밤의 기록이 있어요. 꿈에 어떤 장면이 남았나요?");
    expect(state.tertiary).toEqual({ label: "오늘 밤 기록 남기기", href: "/night" });
    expect(state.checkInBadge).toBe("밤 기록: 편안함 · 괜찮음");
  });
});
