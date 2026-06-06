import { describe, expect, test } from "vitest";

import {
  morningBodyFeelings,
  morningMoodCopy,
  morningMoodOptions,
} from "./morning-mood-options";

describe("morning mood options", () => {
  test("uses the shortened footprint page title", () => {
    expect(morningMoodCopy.pageTitle).toBe("꿈의 발자국");
    expect(morningMoodCopy.pageScrollSubtitle).toBe("사라진 꿈 대신, 아침에 남은 느낌을 남겨요.");
    expect(morningMoodCopy.pageSubtitle).toBe("꿈은 흐릿해도 괜찮다냥.\n아침에 남은 느낌만 적어보자냥.");
  });

  test("defines the reference morning mood options in display order", () => {
    expect(morningMoodOptions.map((option) => option.label)).toEqual([
      "차분함",
      "설렘",
      "신기함",
      "후련함",
      "그리움",
      "불안함",
      "무서움",
      "슬픔",
      "짜증남",
      "찝찝함",
      "허전함",
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
      "가뿐함",
      "편안함",
      "졸림",
      "피곤함",
      "무거움",
      "긴장됨",
      "두근거림",
      "뻐근함",
      "식은땀",
    ]);
  });
});
