import { describe, expect, it } from "vitest";

import { handleProfileRecordsRequest } from "./route";

describe("DELETE /api/profile/records", () => {
  it("returns 401 for guests", async () => {
    const response = await handleProfileRecordsRequest(
      new Request("http://localhost/api/profile/records", { method: "DELETE" }),
      {
        getAuthenticatedUserId: async () => null,
        deleteAllProductRecordsForUser: async () => undefined,
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  it("deletes authenticated product records", async () => {
    const deletedUserIds: string[] = [];
    const response = await handleProfileRecordsRequest(
      new Request("http://localhost/api/profile/records", { method: "DELETE" }),
      {
        getAuthenticatedUserId: async () => "user-1",
        deleteAllProductRecordsForUser: async (userId) => {
          deletedUserIds.push(userId);
        },
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(deletedUserIds).toEqual(["user-1"]);
  });
});
