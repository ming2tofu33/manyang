import { describe, expect, test } from "vitest";

import { getArchiveRecordEntryState } from "./record-entry-availability";

describe("archive record entry availability", () => {
  test("keeps dream recording always available", () => {
    expect(getArchiveRecordEntryState(new Date("2026-06-01T01:00:00.000Z")).dream.isAvailable).toBe(true);
    expect(getArchiveRecordEntryState(new Date("2026-06-01T12:00:00.000Z")).dream.isAvailable).toBe(true);
  });

  test("enables morning records from 05:00 until before 18:00 Korea time", () => {
    const morningState = getArchiveRecordEntryState(new Date("2026-05-31T23:00:00.000Z"));
    const lastMorningState = getArchiveRecordEntryState(new Date("2026-06-01T08:59:00.000Z"));
    const eveningState = getArchiveRecordEntryState(new Date("2026-06-01T09:00:00.000Z"));

    expect(morningState.morning.isAvailable).toBe(true);
    expect(morningState.night.isAvailable).toBe(false);
    expect(lastMorningState.morning.isAvailable).toBe(true);
    expect(lastMorningState.night.isAvailable).toBe(false);
    expect(eveningState.morning.isAvailable).toBe(false);
    expect(eveningState.night.isAvailable).toBe(true);
  });

  test("keeps night records open through 04:59 and closes them at 05:00 Korea time", () => {
    const lateNightState = getArchiveRecordEntryState(new Date("2026-06-01T19:59:00.000Z"));
    const morningBoundaryState = getArchiveRecordEntryState(new Date("2026-06-01T20:00:00.000Z"));

    expect(lateNightState.night.isAvailable).toBe(true);
    expect(lateNightState.morning.isAvailable).toBe(false);
    expect(morningBoundaryState.night.isAvailable).toBe(false);
    expect(morningBoundaryState.morning.isAvailable).toBe(true);
  });
});
