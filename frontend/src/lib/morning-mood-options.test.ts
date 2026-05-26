import { describe, expect, test } from "vitest";

import {
  morningBodyFeelings,
  morningMoodCopy,
  morningMoodOptions,
} from "./morning-mood-options";

describe("morning mood options", () => {
  test("uses the shortened footprint page title", () => {
    expect(morningMoodCopy.pageTitle).toBe("꿈의 발자국");
  });

  test("defines the reference morning mood options in display order", () => {
    expect(morningMoodOptions.map((option) => option.label)).toEqual([
      "차분함",
      "불안함",
      "찝찝함",
      "설렘",
      "그리움",
      "슬픔",
      "신기함",
      "멍함",
    ]);
  });

  test("uses question copy for the morning mood and body sections", () => {
    expect(morningMoodCopy.moodTitle).toBe("아침에 일어났을 때 기분은 어땠나요?");
    expect(morningMoodCopy.bodyTitle).toBe("몸은 어떤 느낌인가요?");
  });

  test("defines the reference body feelings", () => {
    expect(morningBodyFeelings.map((feeling) => feeling.label)).toEqual([
      "개운함",
      "졸림",
      "피곤함",
      "무거움",
      "긴장됨",
      "편안함",
    ]);
  });
});
