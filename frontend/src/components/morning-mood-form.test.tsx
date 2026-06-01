import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { MorningMoodForm } from "./morning-mood-form";

describe("MorningMoodForm", () => {
  test("shows local-save and backup CTA for guest pawprint persistence", () => {
    const markup = renderToStaticMarkup(<MorningMoodForm />);

    expect(markup).toContain('data-routine-login-cta="pawprint"');
    expect(markup).toContain("/auth?next=%2Fmorning");
    expect(markup).toContain("오늘의 발자국은 이 기기에 저장됐어요.");
    expect(markup).toContain("로그인하면 이 기록을 계정에 백업");
  });
});
