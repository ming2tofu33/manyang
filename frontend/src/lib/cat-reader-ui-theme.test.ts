import { describe, expect, test } from "vitest";

import { catReaderUiThemes, getCatReaderUiTheme } from "./cat-reader-ui-theme";
import { catReaders } from "./cat-readers";

describe("cat reader UI theme tokens", () => {
  test("defines one UI theme for every cat reader", () => {
    expect(Object.keys(catReaderUiThemes).sort()).toEqual(catReaders.map((reader) => reader.id).sort());
  });

  test("keeps each cat visually distinct while exposing the same CSS variables", () => {
    const blackTheme = getCatReaderUiTheme("black_cat");
    const cheeseTheme = getCatReaderUiTheme("cheese_cat");
    const grayTheme = getCatReaderUiTheme("gray_cat");
    const whiteTheme = getCatReaderUiTheme("white_cat");

    expect(blackTheme.cssVariables["--manyang-cat-accent"]).toBe("#d799ff");
    expect(cheeseTheme.cssVariables["--manyang-cat-accent"]).toBe("#ffb347");
    expect(grayTheme.cssVariables["--manyang-cat-accent"]).toBe("#c7a4d7");
    expect(whiteTheme.cssVariables["--manyang-cat-title"]).toBe("#21100f");
    expect(whiteTheme.surfaceMode).toBe("light-title");
  });

  test("falls back to the black-cat theme for unknown reader ids", () => {
    expect(getCatReaderUiTheme("unknown")).toBe(catReaderUiThemes.black_cat);
  });
});
