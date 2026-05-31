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

  test("defines the final dream atmosphere options in a 3 by 5 display order", () => {
    expect(dreamAtmosphereOptions.map((option) => option.label)).toEqual([
      "평온함",
      "따뜻함",
      "설렘",
      "그리움",
      "슬픔",
      "쓸쓸함",
      "불안함",
      "두려움",
      "답답함",
      "낯섦",
      "묘함",
      "신비함",
      "흐릿함",
      "복잡함",
      "불쾌함",
    ]);
    expect(dreamAtmosphereOptions).toHaveLength(15);
    expect(dreamAtmosphereOptions.map((option) => option.label)).not.toContain("혼란스러움");
  });

  test("defines compact dream sensation options in a 3 by 3 display order", () => {
    expect(dreamSensationOptions.map((option) => option.label)).toEqual([
      "선명함",
      "흐릿함",
      "무거움",
      "갇힘",
      "떨어짐",
      "떠다님",
      "쫓김",
      "차가움",
      "따뜻함",
    ]);
    expect(dreamSensationOptions).toHaveLength(9);
    expect(dreamSensationOptions.map((option) => option.label).some((label) => label.includes("느낌"))).toBe(false);
  });

  test("limits dream atmospheres and sensations to two choices each", () => {
    expect(dreamAtmosphereMaxSelection).toBe(2);
    expect(dreamSensationMaxSelection).toBe(2);
  });

  test("combines optional dream atmosphere and sensations into the existing wakeMood field", () => {
    expect(createDreamMoodLabel(["슬픔", "쓸쓸함"], ["선명함", "갇힘"])).toBe(
      "분위기: 슬픔, 쓸쓸함 / 감각: 선명함, 갇힘",
    );
    expect(createDreamMoodLabel([], [])).toBeUndefined();
  });
});
