import { describe, expect, test } from "vitest";

import { getHomeTitleTheme } from "./home-title-theme";

describe("home title theme", () => {
  test("keeps the dark halo and gold title for the default black cat", () => {
    const theme = getHomeTitleTheme("black_cat");

    expect(theme.haloClassName).toContain("rgba(0,0,0,0.80)");
    expect(theme.eyebrowClassName).toContain("text-[var(--manyang-cat-eyebrow)]");
    expect(theme.eyebrowClassName).toContain("tracking-[0.16em]");
    expect(theme.titleClassName).toContain("text-[var(--manyang-cat-title)]");
    expect(theme.titleClassName).toContain("[text-shadow:var(--manyang-cat-title-shadow)]");
  });

  test("uses dark text without the halo only for the pink white-cat home", () => {
    const theme = getHomeTitleTheme("white_cat");

    expect(theme.haloClassName).toBe("hidden");
    expect(theme.eyebrowClassName).toContain("text-[var(--manyang-cat-eyebrow)]");
    expect(theme.eyebrowClassName).toContain("tracking-[0.16em]");
    expect(theme.titleClassName).toContain("text-[var(--manyang-cat-title)]");
    expect(theme.titleClassName).not.toContain("text-[#ffd98a]");
  });
});
