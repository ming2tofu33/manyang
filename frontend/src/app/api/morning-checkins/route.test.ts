import { describe, expect, test } from "vitest";

import type { MorningMoodRecord } from "@/lib/morning-mood";
import { handleMorningCheckInsRequest } from "./route";

function createMorningMoodRecord(): MorningMoodRecord {
  return {
    id: "morning-2026-06-01",
    moodDate: "2026-06-01",
    mood: "calm",
    moodColor: "#c7b7ff",
    bodyFeeling: "light",
    thought: "new day",
    savedAt: "2026-06-01T00:00:00.000Z",
  };
}

describe("GET /api/morning-checkins", () => {
  test("returns 401 when the user is not authenticated", async () => {
    const response = await handleMorningCheckInsRequest(new Request("http://localhost/api/morning-checkins"), {
      getAuthenticatedUserId: async () => null,
      listMorningCheckInsForUser: async () => [],
      persistMorningCheckInForUser: async () => createMorningMoodRecord(),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  test("returns authenticated user's morning check-ins", async () => {
    const records = [createMorningMoodRecord()];
    const listedUserIds: string[] = [];

    const response = await handleMorningCheckInsRequest(new Request("http://localhost/api/morning-checkins"), {
      getAuthenticatedUserId: async () => "user-1",
      listMorningCheckInsForUser: async (userId) => {
        listedUserIds.push(userId);
        return records;
      },
      persistMorningCheckInForUser: async () => createMorningMoodRecord(),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ records });
    expect(listedUserIds).toEqual(["user-1"]);
  });
});

describe("POST /api/morning-checkins", () => {
  test("saves a morning check-in for an authenticated user", async () => {
    const persistedInputs: unknown[] = [];
    const record = createMorningMoodRecord();

    const response = await handleMorningCheckInsRequest(
      new Request("http://localhost/api/morning-checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodDate: "2026-06-01",
          mood: "calm",
          moodColor: "#c7b7ff",
          bodyFeeling: "light",
          thought: "new day",
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listMorningCheckInsForUser: async () => [],
        persistMorningCheckInForUser: async (input) => {
          persistedInputs.push(input);
          return record;
        },
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ record });
    expect(persistedInputs).toEqual([
      {
        userId: "user-1",
        id: "morning-2026-06-01",
        moodDate: "2026-06-01",
        mood: "calm",
        moodColor: "#c7b7ff",
        bodyFeeling: "light",
        thought: "new day",
        savedAt: expect.any(String),
      },
    ]);
  });

  test("returns 400 for malformed morning check-ins", async () => {
    const response = await handleMorningCheckInsRequest(
      new Request("http://localhost/api/morning-checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodDate: "bad-date",
          mood: "",
          moodColor: "",
          bodyFeeling: "",
          thought: "x".repeat(81),
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listMorningCheckInsForUser: async () => [],
        persistMorningCheckInForUser: async () => createMorningMoodRecord(),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "moodDate must use YYYY-MM-DD" });
  });
});
