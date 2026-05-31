import { describe, expect, test } from "vitest";

import type { PawprintRecord } from "@/lib/pawprints";
import { handlePawprintsRequest } from "./route";

function createPawprintRecord(id = "pawprint-db-id"): PawprintRecord {
  return {
    id,
    appDate: "2026-05-31",
    source: "morning_record",
    sourceId: "morning-2026-05-31",
    createdAt: "2026-05-31T00:00:00.000Z",
  };
}

describe("GET /api/pawprints", () => {
  test("returns 401 when the user is not authenticated", async () => {
    const response = await handlePawprintsRequest(new Request("http://localhost/api/pawprints"), {
      getAuthenticatedUserId: async () => null,
      listPawprintsForUser: async () => [],
      persistPawprintForUser: async () => ({ created: true, record: createPawprintRecord() }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "authentication required" });
  });

  test("returns authenticated user's pawprints", async () => {
    const records = [createPawprintRecord()];
    const listedUserIds: string[] = [];

    const response = await handlePawprintsRequest(new Request("http://localhost/api/pawprints"), {
      getAuthenticatedUserId: async () => "user-1",
      listPawprintsForUser: async (userId) => {
        listedUserIds.push(userId);
        return records;
      },
      persistPawprintForUser: async () => ({ created: true, record: createPawprintRecord() }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ records });
    expect(listedUserIds).toEqual(["user-1"]);
  });
});

describe("POST /api/pawprints", () => {
  test("saves a pawprint for an authenticated user", async () => {
    const persistedInputs: unknown[] = [];
    const record = createPawprintRecord();

    const response = await handlePawprintsRequest(
      new Request("http://localhost/api/pawprints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          appDate: "2026-05-31",
          source: "morning_record",
          sourceId: "morning-2026-05-31",
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listPawprintsForUser: async () => [],
        persistPawprintForUser: async (input) => {
          persistedInputs.push(input);
          return { created: true, record };
        },
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ created: true, record });
    expect(persistedInputs).toEqual([
      {
        userId: "user-1",
        appDate: "2026-05-31",
        source: "morning_record",
        sourceId: "morning-2026-05-31",
      },
    ]);
  });

  test("returns 400 for malformed pawprints", async () => {
    const response = await handlePawprintsRequest(
      new Request("http://localhost/api/pawprints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          appDate: "bad-date",
          source: "invalid",
          sourceId: "",
        }),
      }),
      {
        getAuthenticatedUserId: async () => "user-1",
        listPawprintsForUser: async () => [],
        persistPawprintForUser: async () => ({ created: true, record: createPawprintRecord() }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "appDate must use YYYY-MM-DD" });
  });
});
