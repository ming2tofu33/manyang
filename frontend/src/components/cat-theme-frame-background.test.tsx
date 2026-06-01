import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { CatThemeFrameBackground, getCatThemeFrameForCatReader } from "./cat-theme-frame-background";

describe("CatThemeFrameBackground", () => {
  test("maps selected cat readers to cat-specific theme frames", () => {
    expect(getCatThemeFrameForCatReader("black_cat")).toBe("/manyang/backgrounds/theme-frame-black-cat-v3.png");
    expect(getCatThemeFrameForCatReader("white_cat")).toBe("/manyang/backgrounds/theme-frame-white-cat-v3.png");
    expect(getCatThemeFrameForCatReader("cheese_cat")).toBe("/manyang/backgrounds/theme-frame-cheese-cat-v3.png");
    expect(getCatThemeFrameForCatReader("gray_cat")).toBe("/manyang/backgrounds/theme-frame-gray-cat-v3.png");
  });

  test("server render falls back to the default black cat frame", () => {
    const markup = renderToStaticMarkup(<CatThemeFrameBackground />);

    expect(markup).toContain("theme-frame-black-cat-v3.png");
    expect(markup).toContain("object-contain object-top opacity-90");
    expect(markup).toContain('data-cat-theme-frame="current"');
    expect(markup).toContain('data-cat-theme-frame-reader="black_cat"');
  });
});
