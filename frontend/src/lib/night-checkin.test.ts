import { describe, expect, test } from "vitest";

import { defaultNightCheckInCondition, defaultNightCheckInMood, nightCheckInNoteMaxLength } from "./night-checkin-options";
import {
  canPersistNightCheckIn,
  countMonthlyNightCheckIns,
  createNightCheckInRecord,
  getNightCheckIn,
  getNightCheckInRecords,
  getNightCheckInAppDate,
  isNightCheckInRelatedToDreamDate,
  nightCheckInKey,
  nightCheckInRecordsKey,
  saveNightCheckIn,
  type StorageLike,
} from "./night-checkin";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("night check-in records", () => {
  test("creates a grounded nightly record with normalized note text", () => {
    const record = createNightCheckInRecord({
      moodId: defaultNightCheckInMood.id,
      moodLabel: defaultNightCheckInMood.label,
      conditionId: defaultNightCheckInCondition.id,
      conditionLabel: defaultNightCheckInCondition.label,
      note: `  ${"오늘의 감정 ".repeat(20)}  `,
      checkInDate: "2026-05-31",
    });

    expect(record.moodLabel).toBe("편안함");
    expect(record.conditionLabel).toBe("괜찮음");
    expect(record.note).toHaveLength(nightCheckInNoteMaxLength);
    expect(record.note.startsWith("오늘의 감정")).toBe(true);
    expect(Number.isNaN(Date.parse(record.savedAt))).toBe(false);
  });

  test("persists the latest record and replaces the same check-in date", () => {
    const storage = new MemoryStorage();
    const first = createNightCheckInRecord({
      moodId: "calm",
      moodLabel: "편안함",
      conditionId: "okay",
      conditionLabel: "괜찮음",
      note: "첫 기록",
      checkInDate: "2026-05-31",
    });
    const second = createNightCheckInRecord({
      moodId: "tired",
      moodLabel: "지침",
      conditionId: "heavy",
      conditionLabel: "무거움",
      note: "수정한 기록",
      checkInDate: "2026-05-31",
    });

    saveNightCheckIn(storage, first);
    saveNightCheckIn(storage, second);

    expect(storage.getItem(nightCheckInKey)).toBe(JSON.stringify(second));
    expect(JSON.parse(storage.getItem(nightCheckInRecordsKey) ?? "[]")).toHaveLength(1);
    expect(getNightCheckIn(storage)?.note).toBe("수정한 기록");
    expect(getNightCheckInRecords(storage)[0]?.moodLabel).toBe("지침");
  });

  test("counts distinct night check-ins for a calendar month", () => {
    const records = [
      createNightCheckInRecord({
        moodId: "calm",
        moodLabel: "편안함",
        conditionId: "okay",
        conditionLabel: "괜찮음",
        note: "",
        checkInDate: "2026-05-01",
      }),
      createNightCheckInRecord({
        moodId: "mixed",
        moodLabel: "복잡함",
        conditionId: "tense",
        conditionLabel: "긴장됨",
        note: "",
        checkInDate: "2026-05-31",
      }),
      createNightCheckInRecord({
        moodId: "low",
        moodLabel: "가라앉음",
        conditionId: "heavy",
        conditionLabel: "무거움",
        note: "",
        checkInDate: "2026-06-01",
      }),
    ];

    expect(countMonthlyNightCheckIns(records, 2026, 5)).toBe(2);
  });

  test("relates last night's check-in to today's dream date", () => {
    const record = createNightCheckInRecord({
      moodId: "anxious",
      moodLabel: "불안함",
      conditionId: "sensitive",
      conditionLabel: "예민함",
      note: "잠들기 전 생각이 많았다",
      checkInDate: "2026-05-30",
    });

    expect(isNightCheckInRelatedToDreamDate(record, "2026-05-31")).toBe(true);
    expect(isNightCheckInRelatedToDreamDate(record, "2026-06-02")).toBe(false);
  });

  test("stores after-midnight night check-ins on the previous night's date", () => {
    expect(getNightCheckInAppDate(new Date("2026-06-01T09:30:00.000Z"))).toBe("2026-06-01");
    expect(getNightCheckInAppDate(new Date("2026-06-01T16:20:00.000Z"))).toBe("2026-06-01");
    expect(getNightCheckInAppDate(new Date("2026-06-01T20:00:00.000Z"))).toBe("2026-06-02");
  });

  test("allows local persistence for guests and authenticated users", () => {
    expect(canPersistNightCheckIn({ isAuthenticated: false })).toBe(true);
    expect(canPersistNightCheckIn({ isAuthenticated: true })).toBe(true);
  });
});
