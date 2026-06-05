import { describe, expect, it } from "vitest";

import { handleProfileExportRequest } from "./route";

describe("GET /api/profile/export", () => {
  it("returns 401 for guests", async () => {
    const response = await handleProfileExportRequest(new Request("http://localhost/api/profile/export"), {
      getAuthenticatedUserId: async () => null,
      createProfileExportForUser: async () => ({}) as never,
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  it("returns authenticated export payloads", async () => {
    const response = await handleProfileExportRequest(new Request("http://localhost/api/profile/export"), {
      getAuthenticatedUserId: async () => "user-1",
      createProfileExportForUser: async (userId) => ({
        exportedAt: "2026-06-05T00:00:00.000Z",
        identity: { type: "authenticated", userId },
        dreams: [],
        pawprints: [],
        morningCheckIns: [],
        nightCheckIns: [],
        tarotReadings: [],
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      exportedAt: "2026-06-05T00:00:00.000Z",
      identity: { type: "authenticated", userId: "user-1" },
      dreams: [],
      pawprints: [],
      morningCheckIns: [],
      nightCheckIns: [],
      tarotReadings: [],
    });
  });
});
