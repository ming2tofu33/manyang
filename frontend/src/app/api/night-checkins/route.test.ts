import { describe, expect, test } from "vitest";

import type { NightCheckInRecord } from "@/lib/night-checkin";
import { handleNightCheckInsRequest } from "./route";

function createNightCheckInRecord(): NightCheckInRecord {
  return {
    checkInDate: "2026-05-31",
    moodId: "calm",
    moodLabel: "편안함",
    conditionId: "okay",
    conditionLabel: "괜찮음",
    note: "잠들기 전 마음이 차분했다.",
    savedAt: "2026-05-31T00:00:00.000Z",
  };
}

describe("GET /api/night-checkins", () => {
  test("returns 401 when the user is not authenticated", async () => {
    const response = await handleNightCheckInsRequest(new Request("http://localhost/api/night-checkins"), {
      getAuthenticatedUserId: async () => null,
      listNightCheckInsForUser: async () => [],
      persistNightCheckInForUser: async () => createNightCheckInRecord(),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  test("returns authenticated user's night check-ins", async () => {
    const records = [createNightCheckInRecord()];
    const listedUserIds: string[] = [];

    const response = await handleNightCheckInsRequest(new Request("http://localhost/api/night-checkins"), {
      getAuthenticatedUserId: async () => "user-1",
      listNightCheckInsForUser: async (userId) => {
        listedUserIds.push(userId);
        return records;
      },
      persistNightCheckInForUser: async () => createNightCheckInRecord(),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ records });
    expect(listedUserIds).toEqual(["user-1"]);
  });
});

describe("POST /api/night-checkins", () => {
  test("saves a night check-in for an authenticated user", async () => {
    const persistedInputs: unknown[] = [];
    const record = createNightCheckInRecord();

    const response = await handleNightCheckInsRequest(
      new Request("http://localhost/api/night-checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkInDate: "2026-05-31",
          moodId: "calm",
          moodLabel: "편안함",
          conditionId: "okay",
          conditionLabel: "괜찮음",
          note: "잠들기 전 마음이 차분했다.",
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listNightCheckInsForUser: async () => [],
        persistNightCheckInForUser: async (input) => {
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
        checkInDate: "2026-05-31",
        moodId: "calm",
        moodLabel: "편안함",
        conditionId: "okay",
        conditionLabel: "괜찮음",
        note: "잠들기 전 마음이 차분했다.",
      },
    ]);
  });

  test("returns 400 for malformed night check-ins", async () => {
    const response = await handleNightCheckInsRequest(
      new Request("http://localhost/api/night-checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkInDate: "bad-date",
          moodId: "",
          moodLabel: "",
          conditionId: "",
          conditionLabel: "",
          note: "x".repeat(101),
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listNightCheckInsForUser: async () => [],
        persistNightCheckInForUser: async () => createNightCheckInRecord(),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "checkInDate must use YYYY-MM-DD" });
  });
});
