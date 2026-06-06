import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TermsPage from "./page";

describe("TermsPage", () => {
  it("renders service terms with AI reading disclaimer", () => {
    const markup = renderToStaticMarkup(<TermsPage />);

    expect(markup).toContain("이용약관");
    expect(markup).toContain("AI 리딩은 전문 상담이나 진단을 대체하지 않습니다");
    expect(markup).toContain("기록 내보내기");
    expect(markup).toContain("사용자 책임과 금지행위");
    expect(markup).toContain("Moon Pass");
    expect(markup).toContain("청약철회");
    expect(markup).toContain("고의 또는 중대한 과실");
  });
});
