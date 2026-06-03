import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  getNightCheckInBackgroundForCatReader,
  NightCheckInBackgroundOverlay,
} from "./night-checkin-background-overlay";

describe("NightCheckInBackgroundOverlay", () => {
  test("maps selected cat readers to cat-specific dreamseed backgrounds", () => {
    expect(getNightCheckInBackgroundForCatReader("black_cat")).toBe(
      "/manyang/backgrounds/dreamseed-background-black-cat-v2.webp",
    );
    expect(getNightCheckInBackgroundForCatReader("white_cat")).toBe(
      "/manyang/backgrounds/dreamseed-background-white-cat-v2.webp",
    );
    expect(getNightCheckInBackgroundForCatReader("cheese_cat")).toBe(
      "/manyang/backgrounds/dreamseed-background-cheese-cat-v3.webp",
    );
    expect(getNightCheckInBackgroundForCatReader("gray_cat")).toBe(
      "/manyang/backgrounds/dreamseed-background-gray-cat-v2.webp",
    );
  });

  test("server render falls back to the default black cat background", () => {
    const markup = renderToStaticMarkup(<NightCheckInBackgroundOverlay />);

    expect(markup).toContain("dreamseed-background-black-cat-v2.webp");
  });

  test("pins the dreamseed illustration to the top edge of the night page", () => {
    const markup = renderToStaticMarkup(<NightCheckInBackgroundOverlay />);

    expect(markup).toContain("absolute inset-x-0 top-0 h-[25.4rem] overflow-hidden");
    expect(markup).not.toContain("top-8 h-[25.4rem]");
  });
});
