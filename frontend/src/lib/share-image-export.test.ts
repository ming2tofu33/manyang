import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

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

  test("exports receipt DOM without SVG foreignObject composition", () => {
    const source = readFileSync(new URL("./share-image-export.ts", import.meta.url), "utf8");

    expect(source).toContain("html2canvas");
    expect(source).not.toContain("foreignObject");
  });
});
