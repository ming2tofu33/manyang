import { describe, expect, test } from "vitest";

import {
  countMonthlyPawprints,
  createPawprintRecord,
  getCurrentPawprintStreak,
  getPawprintAppDate,
  getPawprintSnapshot,
  getPawprints,
  isPawprintStampUnlocked,
  pawprintRecordsKey,
  savePawprint,
  type PawprintInput,
  type PawprintRecord,
  type StorageLike,
} from "./pawprints";

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function createInput(input: Partial<PawprintInput> = {}): PawprintInput {
  return {
    appDate: "2026-05-25",
    source: "morning_record",
    sourceId: "morning-2026-05-25",
    ...input,
  };
}

function createRecords(appDates: string[]): PawprintRecord[] {
  return appDates.map((appDate) => createPawprintRecord(createInput({ appDate, sourceId: `source-${appDate}` })));
}

describe("pawprint storage", () => {
  test("uses the previous app date before the 05:00 boundary", () => {
    expect(getPawprintAppDate(new Date("2026-05-25T04:59:00+09:00"))).toBe("2026-05-24");
  });

  test("uses the current app date from the 05:00 boundary", () => {
    expect(getPawprintAppDate(new Date("2026-05-25T05:00:00+09:00"))).toBe("2026-05-25");
  });

  test("creates a pawprint record", () => {
    const input = createInput();

    expect(createPawprintRecord(input)).toMatchObject({
      id: "pawprint-2026-05-25",
      appDate: "2026-05-25",
      source: "morning_record",
      sourceId: "morning-2026-05-25",
    });
  });

  test("saves the first pawprint for an app date", () => {
    const storage = createMemoryStorage();
    const record = createPawprintRecord(createInput());

    const result = savePawprint(storage, record);

    expect(result).toMatchObject({ created: true, record });
    expect(getPawprints(storage)).toEqual([record]);
  });

  test("preserves the first pawprint when the same app date is saved again", () => {
    const storage = createMemoryStorage();
    const first = createPawprintRecord(createInput({ source: "morning_record", sourceId: "morning-2026-05-25" }));
    const duplicate = createPawprintRecord(createInput({ source: "receipt_saved", sourceId: "dream-1" }));

    savePawprint(storage, first);
    const result = savePawprint(storage, duplicate);

    expect(result).toMatchObject({ created: false, record: first });
    expect(getPawprints(storage)).toEqual([first]);
  });

  test("returns an empty list when stored JSON is corrupted", () => {
    const storage = createMemoryStorage({ [pawprintRecordsKey]: "{not-json" });

    expect(getPawprints(storage)).toEqual([]);
  });

  test("returns stable pawprint snapshot references while storage is unchanged", () => {
    const storage = createMemoryStorage();
    const record = createPawprintRecord(createInput());

    savePawprint(storage, record);

    expect(getPawprintSnapshot(storage)).toBe(getPawprintSnapshot(storage));
  });

  test("counts unique monthly pawprint app dates", () => {
    const mayRecord = createPawprintRecord(createInput({ appDate: "2026-05-01", sourceId: "may-1" }));
    const mayDuplicate = createPawprintRecord(createInput({ appDate: "2026-05-01", sourceId: "may-duplicate" }));
    const nextMayRecord = createPawprintRecord(createInput({ appDate: "2026-05-31", sourceId: "may-31" }));
    const juneRecord = createPawprintRecord(createInput({ appDate: "2026-06-01", sourceId: "june-1" }));

    expect(countMonthlyPawprints([mayRecord, mayDuplicate, nextMayRecord, juneRecord], 2026, 5)).toBe(2);
  });

  test("counts the current streak ending today", () => {
    const records = createRecords(["2026-05-23", "2026-05-24", "2026-05-25"]);

    expect(getCurrentPawprintStreak(records, "2026-05-25")).toBe(3);
  });

  test("counts the current streak through yesterday when today has no pawprint", () => {
    const records = createRecords(["2026-05-23", "2026-05-24"]);

    expect(getCurrentPawprintStreak(records, "2026-05-25")).toBe(2);
  });

  test("stops the current streak at date gaps", () => {
    const records = createRecords(["2026-05-21", "2026-05-23", "2026-05-24"]);

    expect(getCurrentPawprintStreak(records, "2026-05-25")).toBe(2);
  });

  test("unlocks the first stamp after seven unique pawprint days", () => {
    expect(isPawprintStampUnlocked(createRecords(["2026-05-01", "2026-05-02", "2026-05-03"]))).toBe(false);
    expect(
      isPawprintStampUnlocked(
        createRecords([
          "2026-05-01",
          "2026-05-02",
          "2026-05-03",
          "2026-05-04",
          "2026-05-05",
          "2026-05-06",
          "2026-05-07",
        ]),
      ),
    ).toBe(true);
  });
});
