import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("renders privacy policy with stored record categories", () => {
    const markup = renderToStaticMarkup(<PrivacyPage />);

    expect(markup).toContain("개인정보처리방침");
    expect(markup).toContain("처리 목적");
    expect(markup).toContain("처리 항목");
    expect(markup).toContain("보유 및 이용 기간");
    expect(markup).toContain("Supabase");
    expect(markup).toContain("Google OAuth");
    expect(markup).toContain("OpenAI API");
    expect(markup).toContain("모델 학습 목적");
    expect(markup).toContain("localStorage");
    expect(markup).toContain("이용자의 권리");
    expect(markup).toContain("파기");
    expect(markup).toContain("개인정보 보호책임자");
    expect(markup).toContain("개인정보보호위원회");
  });
});
