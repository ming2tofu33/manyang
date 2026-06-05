import { describe, expect, it, vi } from "vitest";

import { dailyTarotStorageKey } from "./daily-tarot";
import { dreamRecordsKey, latestAnalysisKey, type StorageLike } from "./dream-storage";
import { morningMoodRecordsKey } from "./morning-mood";
import { nightCheckInRecordsKey } from "./night-checkin";
import { pawprintRecordsKey } from "./pawprints";
import {
  createGuestProfileExport,
  createProfileExportFileName,
  exportAuthenticatedProfile,
} from "./profile-export";

function createStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

describe("profile export", () => {
  it("creates a stable dated JSON file name", () => {
    expect(createProfileExportFileName(new Date("2026-06-05T12:00:00.000Z"))).toBe(
      "manyang-records-2026-06-05.json",
    );
  });

  it("builds a guest export from local record storage", () => {
    const storage = createStorage({
      [latestAnalysisKey]: JSON.stringify({ status: "completed", dreamText: "latest", dreamDate: "2026-06-05" }),
      [dreamRecordsKey]: JSON.stringify([{ id: "dream-1", dreamText: "dream" }]),
      [pawprintRecordsKey]: JSON.stringify([{ id: "pawprint-1" }]),
      [morningMoodRecordsKey]: JSON.stringify([{ id: "morning-1" }]),
      [nightCheckInRecordsKey]: JSON.stringify([
        {
          checkInDate: "2026-06-05",
          moodId: "calm",
          moodLabel: "차분",
          conditionId: "good",
          conditionLabel: "좋음",
          note: "",
          savedAt: "2026-06-05T12:00:00.000Z",
        },
      ]),
      [dailyTarotStorageKey]: JSON.stringify([]),
    });

    const payload = createGuestProfileExport(storage, new Date("2026-06-05T12:00:00.000Z"));

    expect(payload).toMatchObject({
      exportedAt: "2026-06-05T12:00:00.000Z",
      identity: { type: "guest" },
      latestAnalysis: { dreamText: "latest" },
      dreams: [{ id: "dream-1", dreamText: "dream" }],
      pawprints: [{ id: "pawprint-1" }],
      morningCheckIns: [{ id: "morning-1" }],
      nightCheckIns: [{ checkInDate: "2026-06-05" }],
      tarotReadings: [],
    });
  });

  it("downloads authenticated export payloads from the server route", async () => {
    const download = vi.fn();
    const result = await exportAuthenticatedProfile(
      async () => Response.json({ exportedAt: "2026-06-05T00:00:00.000Z", identity: { type: "authenticated", userId: "user-1" } }),
      download,
      new Date("2026-06-05T12:00:00.000Z"),
    );

    expect(result.status).toBe("ok");
    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({ identity: { type: "authenticated", userId: "user-1" } }),
      "manyang-records-2026-06-05.json",
    );
  });
});
