import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  HomeCatBackgroundTransition,
  homeCatTransitionDurationMs,
} from "./home-cat-background-transition";

describe("HomeCatBackgroundTransition", () => {
  test("keeps the previous background briefly for a simple fade transition", () => {
    expect(homeCatTransitionDurationMs).toBe(900);
  });

  test("renders the current home background with transition hooks", () => {
    const markup = renderToStaticMarkup(
      <HomeCatBackgroundTransition
        background="/manyang/backgrounds/home-white-cat-ref.png"
        backgroundClassName="object-cover"
      />,
    );

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('data-home-cat-transition="root"');
    expect(markup).toContain('data-home-cat-transition="current"');
    expect(markup).toContain("/manyang/backgrounds/home-white-cat-ref.png");
    expect(markup).toContain("home-cat-transition-current");
    expect(markup).not.toContain("home-cat-transition-mist");
    expect(markup).not.toContain("home-cat-transition-glow");
    expect(markup).not.toContain("cat-transition-magic-cloud");
    expect(markup).not.toContain('data-home-cat-transition="previous"');
  });
});
