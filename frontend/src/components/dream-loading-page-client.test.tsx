import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamLoadingPageClient } from "./dream-loading-page-client";

describe("DreamLoadingPageClient", () => {
  it("uses the same dream reading ritual without a result preview shortcut", () => {
    const markup = renderToStaticMarkup(<DreamLoadingPageClient />);

    expect(markup).toContain("data-loading-scene=\"reader\"");
    expect(markup).toContain("%2Fmanyang%2Freferences%2Floading-black-cat.webp");
    expect(markup).toContain("%2Fmanyang%2Forbs%2Fcat-with-stand%2Fblackcat-orb-with-stand.webp");
    expect(markup).toContain("오늘의 꿈을 읽을 고양이가 자리를 잡았어요.");
    expect(markup).not.toContain("href=\"/result\"");
    expect(markup).not.toContain("결과 미리 보기");
  });
});
