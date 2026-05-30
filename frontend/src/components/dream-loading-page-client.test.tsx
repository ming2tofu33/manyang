import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamLoadingPageClient } from "./dream-loading-page-client";

describe("DreamLoadingPageClient", () => {
  it("uses the same dream reading ritual without a result preview shortcut", () => {
    const markup = renderToStaticMarkup(<DreamLoadingPageClient />);

    expect(markup).toContain("data-loading-scene=\"cat\"");
    expect(markup).toContain("고양이가 첫 장면을 살펴보고 있어요.");
    expect(markup).not.toContain("href=\"/result\"");
    expect(markup).not.toContain("결과 미리 보기");
  });
});
