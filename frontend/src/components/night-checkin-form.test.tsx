import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { NightCheckInForm } from "./night-checkin-form";

const nightDate = new Date("2026-06-01T11:00:00.000Z");

describe("NightCheckInForm", () => {
  test("shows local-save and backup CTA for guest night check-in persistence", () => {
    const markup = renderToStaticMarkup(<NightCheckInForm currentDate={nightDate} />);

    expect(markup).toContain('data-routine-login-cta="night-checkin"');
    expect(markup).toContain("/auth?next=%2Fnight");
    expect(markup).toContain("밤의 기록은 이 기기에 저장됐어요.");
    expect(markup).toContain("로그인하면 이 기록을 계정에 백업");
    expect(markup).toContain("뿌듯함");
    expect(markup).toContain("외로움");
    expect(markup).toContain("무덤덤함");
    expect(markup).toContain("짧게 남기고 싶은 말");
    expect(markup).toContain("예: 오늘은 그냥 조금 피곤했어요.");
    expect(markup).not.toContain("꿈 씨앗");
    expect(markup).not.toContain("씨앗");
  });

  test("keeps the night check-in speech bubble closer to the cat illustration", () => {
    const markup = renderToStaticMarkup(<NightCheckInForm currentDate={nightDate} />);

    expect(markup).toContain("absolute right-7 top-[3.35rem]");
    expect(markup).not.toContain("top-[5.05rem]");
  });

  test("keeps the first question panel lower so the illustration stays visible", () => {
    const markup = renderToStaticMarkup(<NightCheckInForm currentDate={nightDate} />);

    expect(markup).toContain("relative -mt-7 h-[17.25rem]");
    expect(markup).toContain("relative z-10 -mt-2 rounded-[1.05rem]");
    expect(markup).not.toContain("relative -mt-7 h-[16rem]");
    expect(markup).not.toContain("relative z-10 -mt-8 rounded-[1.05rem]");
  });

  test("blocks direct night check-in entry outside night record hours", () => {
    const markup = renderToStaticMarkup(<NightCheckInForm currentDate={new Date("2026-06-01T01:00:00.000Z")} />);

    expect(markup).toContain('data-routine-record-unavailable="true"');
    expect(markup).toContain("지금은 꿈의 발자국 시간이에요");
    expect(markup).toContain("저녁 6시부터");
    expect(markup).toContain('href="/morning"');
    expect(markup).not.toContain('data-routine-login-cta="night-checkin"');
  });
});
