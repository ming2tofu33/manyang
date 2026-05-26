import { describe, expect, test } from "vitest";

import {
  canRequestReading,
  devAccessPlanKey,
  devBypassDailyLimitKey,
  getDefaultAccessPlan,
  getDevAccessOverride,
  getEffectiveAccessPlan,
  isPaidAccessPlan,
  type StorageLike,
} from "./access-policy";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("access policy", () => {
  test("defaults prototype users to guest access", () => {
    expect(getDefaultAccessPlan()).toBe("guest");
  });

  test("treats only Moon Pass as paid access", () => {
    expect(isPaidAccessPlan("guest")).toBe(false);
    expect(isPaidAccessPlan("free_account")).toBe(false);
    expect(isPaidAccessPlan("moon_pass")).toBe(true);
  });

  test("allows a guest basic reading before the daily reading is used", () => {
    expect(
      canRequestReading({
        accessPlan: "guest",
        readingKind: "basic",
        hasUsedBasicReadingToday: false,
      }),
    ).toEqual({
      allowed: true,
      reason: "allowed",
      ctaLabel: null,
      message: null,
    });
  });

  test("blocks a guest second basic reading with a login CTA", () => {
    expect(
      canRequestReading({
        accessPlan: "guest",
        readingKind: "basic",
        hasUsedBasicReadingToday: true,
      }),
    ).toEqual({
      allowed: false,
      reason: "guest_daily_limit",
      ctaLabel: "로그인하고 매일 기록하기",
      message: "오늘의 무료 꿈 영수증은 이미 받았어요. 로그인하면 매일 꿈 기록을 이어갈 수 있어요.",
    });
  });

  test("blocks a free account second basic reading without asking for payment", () => {
    expect(
      canRequestReading({
        accessPlan: "free_account",
        readingKind: "basic",
        hasUsedBasicReadingToday: true,
      }),
    ).toEqual({
      allowed: false,
      reason: "free_daily_limit",
      ctaLabel: null,
      message: "오늘의 기본 꿈 해몽은 이미 받았어요. 내일 다시 새로운 꿈 영수증을 받아볼 수 있어요.",
    });
  });

  test("allows Moon Pass detailed readings", () => {
    expect(
      canRequestReading({
        accessPlan: "moon_pass",
        readingKind: "detailed",
        hasUsedBasicReadingToday: true,
      }),
    ).toMatchObject({
      allowed: true,
      reason: "allowed",
    });
  });

  test("blocks detailed readings for guest and free account users", () => {
    expect(
      canRequestReading({
        accessPlan: "guest",
        readingKind: "detailed",
        hasUsedBasicReadingToday: false,
      }),
    ).toEqual({
      allowed: false,
      reason: "detailed_locked",
      ctaLabel: "Moon Pass로 상세 해몽 열기",
      message: "상징별 세부 해석, 감정 흐름, 잿빛냥 꿈+타로 리딩은 Moon Pass에서 열려요.",
    });

    expect(
      canRequestReading({
        accessPlan: "free_account",
        readingKind: "detailed",
        hasUsedBasicReadingToday: false,
      }),
    ).toMatchObject({
      allowed: false,
      reason: "detailed_locked",
    });
  });

  test("uses dev access override to simulate a valid product plan outside production", () => {
    const storage = createMemoryStorage({
      [devAccessPlanKey]: "moon_pass",
      [devBypassDailyLimitKey]: "true",
    });

    expect(getDevAccessOverride(storage, "development")).toEqual({
      enabled: true,
      simulatedPlan: "moon_pass",
      bypassDailyLimit: true,
    });
    expect(getEffectiveAccessPlan(storage, "guest", "development")).toBe("moon_pass");
  });

  test("ignores invalid dev plans so admin never becomes a product plan", () => {
    const storage = createMemoryStorage({
      [devAccessPlanKey]: "admin",
      [devBypassDailyLimitKey]: "true",
    });

    expect(getDevAccessOverride(storage, "development")).toEqual({
      enabled: false,
      simulatedPlan: "guest",
      bypassDailyLimit: false,
    });
    expect(getEffectiveAccessPlan(storage, "free_account", "development")).toBe("free_account");
  });

  test("ignores local dev override in production", () => {
    const storage = createMemoryStorage({
      [devAccessPlanKey]: "moon_pass",
      [devBypassDailyLimitKey]: "true",
    });

    expect(getDevAccessOverride(storage, "production")).toEqual({
      enabled: false,
      simulatedPlan: "guest",
      bypassDailyLimit: false,
    });
    expect(getEffectiveAccessPlan(storage, "guest", "production")).toBe("guest");
  });

  test("can bypass only the basic-reading daily limit for dev testing", () => {
    expect(
      canRequestReading({
        accessPlan: "guest",
        readingKind: "basic",
        hasUsedBasicReadingToday: true,
        bypassDailyLimit: true,
      }),
    ).toMatchObject({
      allowed: true,
      reason: "allowed",
    });

    expect(
      canRequestReading({
        accessPlan: "guest",
        readingKind: "detailed",
        hasUsedBasicReadingToday: true,
        bypassDailyLimit: true,
      }),
    ).toMatchObject({
      allowed: false,
      reason: "detailed_locked",
    });
  });
});
