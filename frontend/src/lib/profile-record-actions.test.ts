import { describe, expect, it, vi } from "vitest";

import { dailyTarotStorageKey } from "./daily-tarot";
import { dreamDraftKey, dreamRecordsKey, latestAnalysisKey, type StorageLike } from "./dream-storage";
import { morningMoodRecordsKey } from "./morning-mood";
import { nightCheckInKey, nightCheckInRecordsKey } from "./night-checkin";
import { pawprintRecordsKey } from "./pawprints";
import { deleteAuthenticatedProfileRecords, deleteGuestProfileRecords } from "./profile-record-actions";

function createStorage(initialEntries: Record<string, string> = {}): StorageLike & { has(key: string): boolean } {
  const map = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key),
  };
}

describe("profile record actions", () => {
  it("deletes authenticated records through the server route", async () => {
    const calls: Array<{ url: string; method?: string }> = [];
    const result = await deleteAuthenticatedProfileRecords(async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      return Response.json({ deleted: true });
    });

    expect(result).toEqual({ status: "ok" });
    expect(calls).toEqual([{ url: "/api/profile/records", method: "DELETE" }]);
  });

  it("clears only local product record keys for guests", () => {
    const storage = createStorage({
      [latestAnalysisKey]: "latest",
      [dreamRecordsKey]: "dreams",
      [dreamDraftKey]: "draft",
      [pawprintRecordsKey]: "pawprints",
      [morningMoodRecordsKey]: "morning",
      [nightCheckInKey]: "night-latest",
      [nightCheckInRecordsKey]: "night-records",
      [dailyTarotStorageKey]: "tarot",
      "manyang:keep": "keep",
    });

    deleteGuestProfileRecords(storage);

    [
      latestAnalysisKey,
      dreamRecordsKey,
      dreamDraftKey,
      pawprintRecordsKey,
      morningMoodRecordsKey,
      nightCheckInKey,
      nightCheckInRecordsKey,
      dailyTarotStorageKey,
    ].forEach((key) => {
      expect(storage.has(key)).toBe(false);
    });
    expect(storage.getItem("manyang:keep")).toBe("keep");
  });

  it("returns an error when authenticated deletion fails", async () => {
    const result = await deleteAuthenticatedProfileRecords(vi.fn(async () => Response.json({ error: "no" }, { status: 500 })));

    expect(result).toEqual({ status: "error" });
  });
});
