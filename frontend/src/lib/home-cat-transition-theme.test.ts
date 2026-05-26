import { describe, expect, test } from "vitest";

import { getHomeCatTransitionTheme } from "./home-cat-transition-theme";

describe("home cat transition theme", () => {
  test("maps each cat reader to a transition mist and glow theme", () => {
    expect(getHomeCatTransitionTheme("black_cat")).toEqual({
      mistClassName: "home-cat-transition-mist-black",
      glowClassName: "home-cat-transition-glow-black",
    });
    expect(getHomeCatTransitionTheme("white_cat")).toEqual({
      mistClassName: "home-cat-transition-mist-white",
      glowClassName: "home-cat-transition-glow-white",
    });
    expect(getHomeCatTransitionTheme("cheese_cat")).toEqual({
      mistClassName: "home-cat-transition-mist-cheese",
      glowClassName: "home-cat-transition-glow-cheese",
    });
    expect(getHomeCatTransitionTheme("gray_cat")).toEqual({
      mistClassName: "home-cat-transition-mist-gray",
      glowClassName: "home-cat-transition-glow-gray",
    });
  });
});
