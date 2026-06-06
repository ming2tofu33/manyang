import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  getMorningIllustrationForCatReader,
  MorningIllustrationOverlay,
} from "./morning-illustration-overlay";

describe("MorningIllustrationOverlay", () => {
  test("maps selected cat readers to cat-specific morning illustrations", () => {
    expect(getMorningIllustrationForCatReader("black_cat")).toBe(
      "/manyang/backgrounds/morning-record-black-cat-v3.webp",
    );
    expect(getMorningIllustrationForCatReader("white_cat")).toBe(
      "/manyang/backgrounds/morning-record-white-cat-v1.webp",
    );
    expect(getMorningIllustrationForCatReader("cheese_cat")).toBe(
      "/manyang/backgrounds/morning-record-cheese-cat-v1.webp",
    );
    expect(getMorningIllustrationForCatReader("gray_cat")).toBe(
      "/manyang/backgrounds/morning-record-gray-cat-v3.webp",
    );
  });

  test("server render falls back to the default black cat illustration", () => {
    const markup = renderToStaticMarkup(<MorningIllustrationOverlay />);

    expect(markup).toContain("morning-record-black-cat-v3.webp");
  });

  test("uses the morning page top illustration layout", () => {
    const markup = renderToStaticMarkup(<MorningIllustrationOverlay />);

    expect(markup).toContain("absolute inset-x-0 top-0 h-[26rem] overflow-hidden");
    expect(markup).toContain("top-[18.35rem] h-[9rem]");
  });
});
