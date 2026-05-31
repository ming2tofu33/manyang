import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { MorningMoodForm } from "./morning-mood-form";

describe("MorningMoodForm", () => {
  test("shows login CTA for guest pawprint persistence", () => {
    const markup = renderToStaticMarkup(<MorningMoodForm />);

    expect(markup).toContain('data-routine-login-cta="pawprint"');
    expect(markup).toContain("/auth?next=%2Fmorning");
    expect(markup).toContain("로그인하면 오늘의 발자국이 기록장에 남아요.");
  });
});
