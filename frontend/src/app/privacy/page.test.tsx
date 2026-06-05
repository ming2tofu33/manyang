import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("renders privacy policy with stored record categories", () => {
    const markup = renderToStaticMarkup(<PrivacyPage />);

    expect(markup).toContain("개인정보처리방침");
    expect(markup).toContain("꿈 기록");
    expect(markup).toContain("Supabase");
    expect(markup).toContain("내보내기");
    expect(markup).toContain("삭제");
  });
});
