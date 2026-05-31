import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import TarotPage from "./page";

describe("tarot page", () => {
  test("renders the daily tarot surface", () => {
    const markup = renderToStaticMarkup(<TarotPage />);

    expect(markup).toContain("오늘의 타로");
    expect(markup).toContain("data-daily-tarot-page");
  });
});
