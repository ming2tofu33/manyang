import { describe, expect, test } from "vitest";

import { devAccessPlanKey, devBypassDailyLimitKey, type StorageLike } from "./access-policy";
import { resolveClientAccessState } from "./use-access-plan";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("client access plan resolution", () => {
  test("treats a missing session as guest access", () => {
    expect(resolveClientAccessState(null, null, "development")).toEqual({
      accessPlan: "guest",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    });
  });

  test("treats an authenticated session as free account access", () => {
    expect(resolveClientAccessState({ user: { id: "user-1" } }, null, "development")).toEqual({
      accessPlan: "free_account",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    });
  });

  test("uses dev override outside production for Moon Pass testing", () => {
    const storage = createMemoryStorage({
      [devAccessPlanKey]: "moon_pass",
      [devBypassDailyLimitKey]: "true",
    });

    expect(resolveClientAccessState({ user: { id: "user-1" } }, storage, "development")).toEqual({
      accessPlan: "moon_pass",
      role: "user",
      bypassDailyLimit: true,
      bypassAccessGate: false,
    });
  });

  test("uses server-trusted admin context for production UI gates", () => {
    expect(
      resolveClientAccessState({ user: { id: "user-1" } }, null, "production", {
        accessPlan: "moon_pass",
        role: "admin",
        bypassDailyLimit: true,
        bypassAccessGate: true,
      }),
    ).toEqual({
      accessPlan: "moon_pass",
      role: "admin",
      bypassDailyLimit: true,
      bypassAccessGate: true,
    });
  });
});
