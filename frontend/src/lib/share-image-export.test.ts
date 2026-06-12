import { describe, expect, test } from "vitest";

import { getSvgImageSize } from "./share-image-export";

describe("share image export", () => {
  test("reads SVG image dimensions for PNG export", () => {
    expect(getSvgImageSize('<svg width="1080" height="1600" viewBox="0 0 1080 1600"></svg>')).toEqual({
      width: 1080,
      height: 1600,
    });
  });

  test("falls back to the shared result image size when SVG dimensions are missing", () => {
    expect(getSvgImageSize("<svg></svg>")).toEqual({ width: 900, height: 1300 });
  });
});
