import { describe, expect, test } from "vitest";

import {
  createDreamMoodLabel,
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
      "어두움",
      "따뜻함",
      "조용함",
      "두려움",
      "낯섦",
      "복잡함",
      "흐릿함",
      "몽환적",
    ]);
  });

  test("defines the final dream sensation options in display order", () => {
    expect(dreamSensationOptions.map((option) => option.label)).toEqual([
      "선명함",
      "흐릿함",
      "무거움",
      "가벼움",
      "차가움",
      "온기",
      "소리",
      "움직임",
    ]);
  });

  test("limits dream sensations to two choices", () => {
    expect(dreamSensationMaxSelection).toBe(2);
  });

  test("combines optional dream atmosphere and sensations into the existing wakeMood field", () => {
    expect(createDreamMoodLabel("어두움", ["선명함", "움직임"])).toBe(
      "분위기: 어두움 / 감각: 선명함, 움직임",
    );
    expect(createDreamMoodLabel(null, [])).toBeUndefined();
  });
});
