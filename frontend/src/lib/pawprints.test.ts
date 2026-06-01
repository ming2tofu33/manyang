import { describe, expect, test } from "vitest";

import * as pawprints from "./pawprints";
import {
  canPersistPawprint,
  countMonthlyPawprints,
  createPawprintRecord,
  getCurrentPawprintStreak,
  getPawprintAppDate,
  getPawprintSnapshot,
  getPawprints,
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
  test("allows local pawprints for guests", () => {
    expect(canPersistPawprint({ isAuthenticated: false })).toBe(true);
  });

  test("allows pawprints for authenticated users", () => {
    expect(canPersistPawprint({ isAuthenticated: true })).toBe(true);
  });

  test("uses the previous app date before the midnight boundary", () => {
    expect(getPawprintAppDate(new Date("2026-05-24T23:59:00+09:00"))).toBe("2026-05-24");
  });

  test("uses the current app date from the midnight boundary", () => {
    expect(getPawprintAppDate(new Date("2026-05-25T00:00:00+09:00"))).toBe("2026-05-25");
  });

  test("keeps early morning activity on the current app date", () => {
    expect(getPawprintAppDate(new Date("2026-05-25T04:59:00+09:00"))).toBe("2026-05-25");
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

  test("preserves the first pawprint when the same source is saved again", () => {
    const storage = createMemoryStorage();
    const first = createPawprintRecord(
      createInput({ appDate: "2026-05-25", source: "receipt_saved", sourceId: "dream-1" }),
    );
    const duplicate = createPawprintRecord(
      createInput({ appDate: "2026-05-26", source: "receipt_saved", sourceId: "dream-1" }),
    );

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

  test("exposes only daily trace and streak helpers", () => {
    expect(Object.keys(pawprints).sort()).toEqual([
      "canPersistPawprint",
      "countMonthlyPawprints",
      "createPawprintRecord",
      "getCurrentPawprintStreak",
      "getEmptyPawprintSnapshot",
      "getPawprintAppDate",
      "getPawprintSnapshot",
      "getPawprintSnapshotFromBrowser",
      "getPawprints",
      "pawprintChangedEvent",
      "pawprintRecordsKey",
      "savePawprint",
      "savePawprintToBrowser",
      "subscribeToPawprints",
    ]);
  });
});
