import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamLoadingPageClient } from "./dream-loading-page-client";

describe("DreamLoadingPageClient", () => {
  it("uses the same dream reading ritual without a result preview shortcut", () => {
    const markup = renderToStaticMarkup(<DreamLoadingPageClient />);

    expect(markup).toContain("data-loading-scene=\"reader\"");
    expect(markup).toContain("%2Fmanyang%2Freferences%2Floading-black-cat.webp");
    expect(markup).toContain("오늘 꿈을 읽을 고양이가 도착했어요.");
    expect(markup).not.toContain("href=\"/result\"");
    expect(markup).not.toContain("결과 미리 보기");
  });
});
