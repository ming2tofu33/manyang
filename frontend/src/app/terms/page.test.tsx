import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TermsPage from "./page";

describe("TermsPage", () => {
  it("renders service terms with AI reading disclaimer", () => {
    const markup = renderToStaticMarkup(<TermsPage />);

    expect(markup).toContain("이용약관");
    expect(markup).toContain("오락과 자기 성찰");
    expect(markup).toContain("Moon Pass");
  });
});
