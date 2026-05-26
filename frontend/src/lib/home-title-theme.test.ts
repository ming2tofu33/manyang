import { describe, expect, test } from "vitest";

import { getHomeTitleTheme } from "./home-title-theme";

describe("home title theme", () => {
  test("keeps the dark halo and gold title for the default black cat", () => {
    const theme = getHomeTitleTheme("black_cat");

    expect(theme.haloClassName).toContain("rgba(0,0,0,0.80)");
    expect(theme.eyebrowClassName).toContain("text-[#f4b65f]");
    expect(theme.titleClassName).toContain("text-[#ffd98a]");
  });

  test("uses dark text without the halo only for the pink white-cat home", () => {
    const theme = getHomeTitleTheme("white_cat");

    expect(theme.haloClassName).toBe("hidden");
    expect(theme.eyebrowClassName).toContain("text-[#2b1815]");
    expect(theme.titleClassName).toContain("text-[#21100f]");
    expect(theme.titleClassName).not.toContain("text-[#ffd98a]");
  });
});
