import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { CatThemeFrameBackground, getCatThemeFrameForCatReader } from "./cat-theme-frame-background";

describe("CatThemeFrameBackground", () => {
  test("maps selected cat readers to cat-specific theme frames", () => {
    expect(getCatThemeFrameForCatReader("black_cat")).toBe("/manyang/backgrounds/theme-background-black-cat-v4.png");
    expect(getCatThemeFrameForCatReader("white_cat")).toBe("/manyang/backgrounds/theme-background-white-cat-v4.png");
    expect(getCatThemeFrameForCatReader("cheese_cat")).toBe("/manyang/backgrounds/theme-background-cheese-cat-v4.png");
    expect(getCatThemeFrameForCatReader("gray_cat")).toBe("/manyang/backgrounds/theme-background-gray-cat-v4.png");
  });

  test("server render falls back to the default black cat frame", () => {
    const markup = renderToStaticMarkup(<CatThemeFrameBackground />);

    expect(markup).toContain("theme-background-black-cat-v4.png");
    expect(markup).toContain("object-cover object-top opacity-90");
    expect(markup).toContain('data-cat-theme-frame="current"');
    expect(markup).toContain('data-cat-theme-frame-reader="black_cat"');
  });
});
