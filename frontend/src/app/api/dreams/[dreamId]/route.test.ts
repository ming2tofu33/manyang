import { describe, expect, test } from "vitest";

import { handleDeleteDreamRecordRequest } from "./route";

function createDeleteRequest(): Request {
  return new Request("http://localhost/api/dreams/00000000-0000-4000-8000-000000000101", {
    method: "DELETE",
  });
}

describe("DELETE /api/dreams/[dreamId]", () => {
  test("returns 401 when the user is not authenticated", async () => {
    const response = await handleDeleteDreamRecordRequest(
      createDeleteRequest(),
      { params: Promise.resolve({ dreamId: "00000000-0000-4000-8000-000000000101" }) },
      {
        getAuthenticatedUserId: async () => null,
        deleteDreamRecordForUser: async () => true,
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  test("deletes an authenticated user's dream record by id", async () => {
    const deletedCalls: Array<{ userId: string; dreamId: string }> = [];

    const response = await handleDeleteDreamRecordRequest(
      createDeleteRequest(),
      { params: Promise.resolve({ dreamId: "00000000-0000-4000-8000-000000000101" }) },
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        deleteDreamRecordForUser: async (userId, dreamId) => {
          deletedCalls.push({ userId, dreamId });
          return true;
        },
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(deletedCalls).toEqual([
      {
        userId: "00000000-0000-4000-8000-000000000001",
        dreamId: "00000000-0000-4000-8000-000000000101",
      },
    ]);
  });

  test("returns 404 when the record does not belong to the user or does not exist", async () => {
    const response = await handleDeleteDreamRecordRequest(
      createDeleteRequest(),
      { params: Promise.resolve({ dreamId: "00000000-0000-4000-8000-000000000404" }) },
      {
        getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
        deleteDreamRecordForUser: async () => false,
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "dream record not found" });
  });
});
