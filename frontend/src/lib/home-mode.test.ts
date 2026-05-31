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
  test("removes the night check-in CTA from night home state", () => {
    const state = getHomeState(new Date("2026-05-31T22:00:00"), null);

    expect(state.mode).toBe("night");
    expect(state.question).toBe("오늘 하루를 비춰줄 단서를 찾아볼까요?");
    expect(state.primary).toEqual({ label: "꿈 들려주기", href: "/write" });
    expect(state.secondary).toBeNull();
    expect(state.tertiary).toBeNull();
    expect(JSON.stringify(state)).not.toMatch(/씨앗|seed|밤의 기록 남기기|오늘 밤 기록 남기기/);
  });

  test("shows last night's check-in context in the morning without a night check-in shortcut", () => {
    const state = getHomeState(new Date("2026-05-31T08:00:00"), createNightCheckIn("2026-05-30"));

    expect(state.question).toBe("어젯밤의 기록이 있어요. 꿈에 어떤 장면이 남았나요?");
    expect(state.primary).toEqual({ label: "꿈 들려주기", href: "/write" });
    expect(state.secondary).toEqual({ label: "기억나지 않아요", href: "/morning" });
    expect(state.tertiary).toBeNull();
    expect(state.checkInBadge).toBe("밤 기록: 편안함 · 괜찮음");
  });
});
