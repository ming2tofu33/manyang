import { describe, expect, test } from "vitest";

import {
  createDreamMoodLabel,
  dreamAtmosphereMaxSelection,
  dreamAtmosphereOptions,
  dreamEntryMaxLength,
  dreamSensationMaxSelection,
  dreamSensationOptions,
} from "./dream-entry-options";

describe("dream entry options", () => {
  test("keeps dream entry text length aligned with the reference screen", () => {
    expect(dreamEntryMaxLength).toBe(1000);
  });

  test("defines the final dream atmosphere options in display order", () => {
    expect(dreamAtmosphereOptions.map((option) => option.label)).toEqual([
      "평온함",
      "따뜻함",
      "설렘",
      "그리움",
      "불안함",
      "두려움",
      "슬픔",
      "분노",
      "부끄러움",
      "답답함",
      "혼란스러움",
      "묘함",
    ]);
  });

  test("defines the final dream sensation options in display order", () => {
    expect(dreamSensationOptions.map((option) => option.label)).toEqual([
      "선명함",
      "흐릿함",
      "무거움",
      "갇힌 느낌",
      "떨어지는 느낌",
      "떠다니는 느낌",
      "쫓기는 느낌",
      "차가움",
      "온기",
    ]);
  });

  test("limits dream atmospheres and sensations to two choices each", () => {
    expect(dreamAtmosphereMaxSelection).toBe(2);
    expect(dreamSensationMaxSelection).toBe(2);
  });

  test("combines optional dream atmosphere and sensations into the existing wakeMood field", () => {
    expect(createDreamMoodLabel(["슬픔", "평온함"], ["선명함", "갇힌 느낌"])).toBe(
      "분위기: 슬픔, 평온함 / 감각: 선명함, 갇힌 느낌",
    );
    expect(createDreamMoodLabel([], [])).toBeUndefined();
  });
});
