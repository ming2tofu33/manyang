import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { NightCheckInForm } from "./night-checkin-form";

describe("NightCheckInForm", () => {
  test("shows login CTA for guest night check-in persistence", () => {
    const markup = renderToStaticMarkup(<NightCheckInForm />);

    expect(markup).toContain('data-routine-login-cta="night-checkin"');
    expect(markup).toContain("/auth?next=%2Fnight");
    expect(markup).toContain("로그인하면 밤의 기록을 달력에 남길 수 있어요.");
    expect(markup).not.toContain("꿈 씨앗");
    expect(markup).not.toContain("씨앗");
  });
});
