import { describe, expect, test } from "vitest";

import type { NightCheckInRecord } from "./night-checkin";
import type { PawprintRecord } from "./pawprints";
import { resolveRoutineRecordState, type RemoteRoutineRecordsSnapshot } from "./use-routine-records";

function createPawprint(id: string): PawprintRecord {
  return {
    id,
    appDate: "2026-05-30",
    source: "morning_record",
    sourceId: id,
    createdAt: "2026-05-30T00:00:00.000Z",
  };
}

function createNightCheckIn(checkInDate = "2026-05-30"): NightCheckInRecord {
  return {
    checkInDate,
    moodId: "calm",
    moodLabel: "편안함",
    conditionId: "okay",
    conditionLabel: "괜찮음",
    note: "",
    savedAt: `${checkInDate}T00:00:00.000Z`,
  };
}

describe("routine record source resolution", () => {
  test("uses server pawprints and night check-ins for authenticated archives", () => {
    const remote: RemoteRoutineRecordsSnapshot = {
      status: "server",
      pawprints: [createPawprint("server-pawprint")],
      nightCheckInRecords: [createNightCheckIn("2026-05-29")],
    };

    expect(resolveRoutineRecordState([createPawprint("local-pawprint")], [createNightCheckIn()], remote)).toEqual({
      source: "server",
      pawprints: remote.pawprints,
      nightCheckInRecords: remote.nightCheckInRecords,
      isLoadingRoutineRecords: false,
      canViewRoutines: true,
    });
  });

  test("does not expose local pawprints and night check-ins to guest archives", () => {
    const remote: RemoteRoutineRecordsSnapshot = {
      status: "guest",
      pawprints: [],
      nightCheckInRecords: [],
    };

    expect(resolveRoutineRecordState([createPawprint("local-pawprint")], [createNightCheckIn()], remote)).toEqual({
      source: "guest",
      pawprints: [],
      nightCheckInRecords: [],
      isLoadingRoutineRecords: false,
      canViewRoutines: false,
    });
  });

  test("keeps routine markers empty while authenticated data is loading", () => {
    const remote: RemoteRoutineRecordsSnapshot = {
      status: "loading",
      pawprints: [],
      nightCheckInRecords: [],
    };

    expect(resolveRoutineRecordState([createPawprint("local-pawprint")], [createNightCheckIn()], remote)).toMatchObject({
      source: "guest",
      pawprints: [],
      nightCheckInRecords: [],
      isLoadingRoutineRecords: true,
    });
  });
});
