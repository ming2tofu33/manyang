import { describe, expect, it } from "vitest";

import { createProfileExportForUser } from "./profile-export";

describe("server profile export", () => {
  it("collects all authenticated product records", async () => {
    const payload = await createProfileExportForUser("user-1", {
      now: () => new Date("2026-06-05T00:00:00.000Z"),
      listDreamRecordsForUser: async () => [{ id: "dream-1" }] as never,
      listPawprintsForUser: async () => [{ id: "pawprint-1" }] as never,
      listMorningCheckInsForUser: async () => [{ id: "morning-1" }] as never,
      listNightCheckInsForUser: async () => [{ checkInDate: "2026-06-05" }] as never,
      listTarotReadingsForUser: async () => [{ id: "tarot-1" }] as never,
    });

    expect(payload).toEqual({
      exportedAt: "2026-06-05T00:00:00.000Z",
      identity: { type: "authenticated", userId: "user-1" },
      dreams: [{ id: "dream-1" }],
      pawprints: [{ id: "pawprint-1" }],
      morningCheckIns: [{ id: "morning-1" }],
      nightCheckIns: [{ checkInDate: "2026-06-05" }],
      tarotReadings: [{ id: "tarot-1" }],
    });
  });
});
