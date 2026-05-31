import { describe, expect, test } from "vitest";

import type { NightCheckInRecord } from "./night-checkin";
import type { PawprintRecord } from "./pawprints";
import {
  fetchNightCheckInsFromApi,
  fetchPawprintsFromApi,
  saveNightCheckInToApi,
  savePawprintToApi,
} from "./routine-record-api";

function createPawprintRecord(id = "pawprint-1"): PawprintRecord {
  return {
    id,
    appDate: "2026-05-30",
    source: "morning_record",
    sourceId: "morning-2026-05-30",
    createdAt: "2026-05-30T00:00:00.000Z",
  };
}

function createNightCheckInRecord(): NightCheckInRecord {
  return {
    checkInDate: "2026-05-30",
    moodId: "calm",
    moodLabel: "편안함",
    conditionId: "okay",
    conditionLabel: "괜찮음",
    note: "small note",
    savedAt: "2026-05-30T00:00:00.000Z",
  };
}

describe("routine record API client", () => {
  test("loads authenticated pawprints from the server API", async () => {
    const records = [createPawprintRecord()];
    const requestedUrls: string[] = [];

    const result = await fetchPawprintsFromApi(async (url) => {
      requestedUrls.push(String(url));
      return Response.json({ records });
    });

    expect(result).toEqual({ status: "ok", records });
    expect(requestedUrls).toEqual(["/api/pawprints"]);
  });

  test("loads authenticated night check-ins from the server API", async () => {
    const records = [createNightCheckInRecord()];
    const requestedUrls: string[] = [];

    const result = await fetchNightCheckInsFromApi(async (url) => {
      requestedUrls.push(String(url));
      return Response.json({ records });
    });

    expect(result).toEqual({ status: "ok", records });
    expect(requestedUrls).toEqual(["/api/night-checkins"]);
  });

  test("saves pawprints through the server API", async () => {
    const calls: Array<{ url: string; method?: string; body?: unknown }> = [];
    const record = createPawprintRecord("db-pawprint");

    const result = await savePawprintToApi(
      {
        appDate: "2026-05-30",
        source: "receipt_saved",
        sourceId: "dream-1",
      },
      async (url, init) => {
        calls.push({
          url: String(url),
          method: init?.method,
          body: JSON.parse(String(init?.body)),
        });

        return Response.json({ created: true, record }, { status: 201 });
      },
    );

    expect(result).toEqual({ status: "saved", created: true, record });
    expect(calls).toEqual([
      {
        url: "/api/pawprints",
        method: "POST",
        body: {
          appDate: "2026-05-30",
          source: "receipt_saved",
          sourceId: "dream-1",
        },
      },
    ]);
  });

  test("saves night check-ins through the server API", async () => {
    const calls: Array<{ url: string; method?: string; body?: unknown }> = [];
    const record = createNightCheckInRecord();

    const result = await saveNightCheckInToApi(record, async (url, init) => {
      calls.push({
        url: String(url),
        method: init?.method,
        body: JSON.parse(String(init?.body)),
      });

      return Response.json({ record }, { status: 201 });
    });

    expect(result).toEqual({ status: "saved", record });
    expect(calls).toEqual([
      {
        url: "/api/night-checkins",
        method: "POST",
        body: {
          checkInDate: "2026-05-30",
          moodId: "calm",
          moodLabel: "편안함",
          conditionId: "okay",
          conditionLabel: "괜찮음",
          note: "small note",
        },
      },
    ]);
  });

  test("treats unauthenticated routine requests as guest state", async () => {
    const pawprints = await fetchPawprintsFromApi(async () =>
      Response.json({ error: "authentication required" }, { status: 401 }),
    );
    const nightCheckIn = await saveNightCheckInToApi(createNightCheckInRecord(), async () =>
      Response.json({ error: "authentication required" }, { status: 401 }),
    );

    expect(pawprints).toEqual({ status: "unauthenticated", records: [] });
    expect(nightCheckIn).toEqual({ status: "unauthenticated" });
  });
});
