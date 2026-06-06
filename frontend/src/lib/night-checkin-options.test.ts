import { describe, expect, test } from "vitest";

import {
  defaultNightCheckInCondition,
  defaultNightCheckInMood,
  getNightCheckInConditionById,
  getNightCheckInMoodById,
  nightCheckInConditions,
  nightCheckInCopy,
  nightCheckInMoods,
  nightCheckInNoteMaxLength,
  nightCheckInRoute,
} from "./night-checkin-options";

describe("night check-in options", () => {
  test("uses the new night check-in route and safe copy", () => {
    expect(nightCheckInRoute).toBe("/night");
    expect(nightCheckInCopy.pageTitle).toBe("밤의 기록");
    expect(nightCheckInCopy.submit).toBe("밤의 기록 남기기");
    expect(nightCheckInCopy.helper).toContain("내일 꿈 해몽의 작은 단서");
    expect(JSON.stringify(nightCheckInCopy)).not.toMatch(/씨앗|심기|원하는 꿈|정확해져요/);
  });

  test("provides mood and condition options", () => {
    expect(nightCheckInMoods.map((option) => option.label)).toEqual([
      "편안함",
      "지침",
      "불안함",
      "설렘",
      "가라앉음",
      "복잡함",
      "뿌듯함",
      "외로움",
      "무덤덤함",
    ]);
    expect(nightCheckInConditions.map((option) => option.label)).toEqual([
      "가벼움",
      "무거움",
      "긴장됨",
      "졸림",
      "예민함",
      "괜찮음",
    ]);
    expect(defaultNightCheckInMood).toBe(nightCheckInMoods[0]);
    expect(defaultNightCheckInCondition).toBe(nightCheckInConditions[5]);
  });

  test("looks up options by id", () => {
    expect(getNightCheckInMoodById("anxious")?.label).toBe("불안함");
    expect(getNightCheckInMoodById("proud")?.label).toBe("뿌듯함");
    expect(getNightCheckInConditionById("tense")?.label).toBe("긴장됨");
    expect(getNightCheckInMoodById("missing")).toBeUndefined();
    expect(getNightCheckInConditionById("missing")).toBeUndefined();
  });

  test("keeps the note short", () => {
    expect(nightCheckInNoteMaxLength).toBe(100);
    expect(nightCheckInCopy.noteLabel).toBe("짧게 남기고 싶은 말");
    expect(nightCheckInCopy.notePlaceholder).toBe("예: 오늘은 그냥 조금 피곤했어요.");
  });
});
