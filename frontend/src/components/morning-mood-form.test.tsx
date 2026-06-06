import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { morningBodyFeelings, morningMoodOptions } from "@/lib/morning-mood-options";
import { MorningMoodForm } from "./morning-mood-form";
import { createMorningMoodRecordFromFormState } from "./morning-mood-form";

const morningDate = new Date("2026-06-01T01:00:00.000Z");

describe("MorningMoodForm", () => {
  test("creates an authenticated-save-ready morning record with a non-empty mood color", () => {
    const record = createMorningMoodRecordFromFormState({
      mood: morningMoodOptions[0].label,
      bodyFeeling: morningBodyFeelings[0].label,
      thought: "coffee",
      moodDate: "2026-06-03",
    });

    expect(record.moodColor.trim().length).toBeGreaterThan(0);
    expect(record.moodColor.length).toBeLessThanOrEqual(40);
  });

  test("shows local-save and backup CTA for guest pawprint persistence", () => {
    const markup = renderToStaticMarkup(<MorningMoodForm currentDate={morningDate} />);

    expect(markup).toContain('data-routine-login-cta="pawprint"');
    expect(markup).toContain("/auth?next=%2Fmorning");
    expect(markup).toContain("오늘의 발자국은 이 기기에 저장됐어요.");
    expect(markup).toContain("로그인하면 이 기록을 계정에 백업");
  });

  test("moves the page subtitle into an illustration speech bubble", () => {
    const markup = renderToStaticMarkup(<MorningMoodForm currentDate={morningDate} />);

    expect(markup).toContain('data-morning-pawprint-hero="true"');
    expect(markup).toContain('data-morning-pawprint-speech="true"');
    expect(markup).toContain("꿈은 흐릿해도 괜찮다냥.");
    expect(markup).toContain("아침에 남은 느낌만 적어보자냥.");
    expect(markup).toContain("absolute left-4 top-[0.85rem] max-w-[12.75rem]");
    expect(markup).toContain("border-l-[0.72rem]");
    expect(markup).toContain("-right-[0.62rem]");
  });

  test("blocks direct morning pawprint entry during night record hours", () => {
    const markup = renderToStaticMarkup(<MorningMoodForm currentDate={new Date("2026-06-01T11:00:00.000Z")} />);

    expect(markup).toContain('data-routine-record-unavailable="true"');
    expect(markup).toContain("지금은 밤의 기록 시간이에요");
    expect(markup).toContain("아침 5시부터");
    expect(markup).toContain('href="/night"');
    expect(markup).not.toContain('data-routine-login-cta="pawprint"');
  });
});
