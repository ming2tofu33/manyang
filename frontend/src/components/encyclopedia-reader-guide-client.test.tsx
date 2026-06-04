import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  EncyclopediaBackgroundOverlay,
  getEncyclopediaBannerForCatReader,
} from "./encyclopedia-reader-guide-client";

describe("EncyclopediaBackgroundOverlay", () => {
  test("maps selected cat readers to cat-specific encyclopedia banners", () => {
    expect(getEncyclopediaBannerForCatReader("black_cat")).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-black-cat-v3.webp",
    );
    expect(getEncyclopediaBannerForCatReader("white_cat")).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-white-cat-v3.webp",
    );
    expect(getEncyclopediaBannerForCatReader("cheese_cat")).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-cheese-cat-v3.webp",
    );
    expect(getEncyclopediaBannerForCatReader("gray_cat")).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-gray-cat-v3.webp",
    );
  });

  test("pins the encyclopedia banner illustration to the top edge of the page", () => {
    const markup = renderToStaticMarkup(<EncyclopediaBackgroundOverlay />);

    expect(markup).toContain("encyclopedia-banner-black-cat-v3.webp");
    expect(markup).toContain("absolute inset-x-0 top-0");
    expect(markup).toContain("top-[13.5rem]");
    expect(markup).toContain('data-encyclopedia-speech-bubble="true"');
    expect(markup).toContain("left-[11.25rem]");
  });
});
