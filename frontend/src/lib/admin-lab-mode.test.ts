import { describe, expect, test } from "vitest";

import {
  type AdminLabTimeOverride,
  getAdminLabDateForOverride,
  getAdminLabTimeOverride,
  normalizeAdminLabTimeOverride,
  resolveAdminLabDate,
  saveAdminLabTimeOverride,
  type StorageLike,
} from "./admin-lab-mode";
import { getHomeState } from "./home-mode";
import { getArchiveRecordEntryState } from "./record-entry-availability";

function createMemoryStorage(initialValue?: string): StorageLike {
  const values = new Map<string, string>();

  if (initialValue) {
    values.set("manyang:admin-lab-time-override", initialValue);
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("admin lab mode", () => {
  test("normalizes unknown values to automatic mode", () => {
    expect(normalizeAdminLabTimeOverride("night")).toBe("night");
    expect(normalizeAdminLabTimeOverride("invalid")).toBe("auto");
    expect(normalizeAdminLabTimeOverride(null)).toBe("auto");
  });

  test.each([
    ["day", "morning", false],
    ["record-evening", "morning", true],
    ["night", "night", true],
    ["late-night", "night", true],
    ["morning-boundary", "morning", false],
    ["home-night-boundary", "night", true],
  ] satisfies Array<[AdminLabTimeOverride, "morning" | "night", boolean]>)(
    "maps %s to the expected home and record state",
    (override, expectedHomeMode, expectedNightRecordAvailability) => {
      const date = getAdminLabDateForOverride(override);

      expect(date).toBeInstanceOf(Date);

      const homeState = getHomeState(date ?? new Date(), null);
      const recordState = getArchiveRecordEntryState(date ?? new Date());

      expect(homeState.mode).toBe(expectedHomeMode);
      expect(recordState.night.isAvailable).toBe(expectedNightRecordAvailability);
      expect(recordState.morning.isAvailable).toBe(!expectedNightRecordAvailability);
    },
  );

  test("applies forced dates only for admins", () => {
    const fallbackDate = new Date("2026-06-01T09:00:00.000+09:00");
    const forcedDate = getAdminLabDateForOverride("night");

    expect(resolveAdminLabDate(fallbackDate, "night", "admin")).toEqual(forcedDate);
    expect(resolveAdminLabDate(fallbackDate, "night", "user")).toEqual(fallbackDate);
  });

  test("persists and clears the selected override", () => {
    const storage = createMemoryStorage();

    saveAdminLabTimeOverride(storage, "night");
    expect(getAdminLabTimeOverride(storage)).toBe("night");

    saveAdminLabTimeOverride(storage, "auto");
    expect(getAdminLabTimeOverride(storage)).toBe("auto");
  });
});
