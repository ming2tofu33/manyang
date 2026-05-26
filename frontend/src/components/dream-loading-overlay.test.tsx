import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamLoadingOverlay } from "./dream-loading-overlay";

describe("DreamLoadingOverlay", () => {
  it("uses the selected cat interpretation background while reading a dream", () => {
    const markup = renderToStaticMarkup(
      <DreamLoadingOverlay
        isActive
        background="/manyang/backgrounds/interpretation-white-cat.png"
      />,
    );

    expect(markup).toContain("%2Fmanyang%2Fbackgrounds%2Finterpretation-white-cat.png");
  });
});
