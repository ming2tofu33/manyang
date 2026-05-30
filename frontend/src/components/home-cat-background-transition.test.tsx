import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { HomeCatBackgroundTransition, homeCatTransitionDurationMs } from "./home-cat-background-transition";

describe("HomeCatBackgroundTransition", () => {
  test("keeps the previous background long enough for a visible transition", () => {
    expect(homeCatTransitionDurationMs).toBe(2400);
  });

  test("renders the current home background with transition hooks", () => {
    const markup = renderToStaticMarkup(
      <HomeCatBackgroundTransition
        background="/manyang/backgrounds/home-white-cat-ref.png"
        readerId="white_cat"
        backgroundClassName="object-cover"
      />,
    );

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('data-home-cat-transition="root"');
    expect(markup).toContain('data-home-cat-transition="current"');
    expect(markup).toContain("/manyang/backgrounds/home-white-cat-ref.png");
    expect(markup).toContain(
      "--home-cat-transition-left-image:url(/manyang/ui/transitions/cat-transition-magic-cloud-left.png)",
    );
    expect(markup).toContain(
      "--home-cat-transition-right-image:url(/manyang/ui/transitions/cat-transition-magic-cloud-right.png)",
    );
    expect(markup).toContain("home-cat-transition-current");
    expect(markup).toContain("home-cat-transition-mist-white");
    expect(markup).toContain("home-cat-transition-glow-white");
    expect(markup).not.toContain('data-home-cat-transition="previous"');
  });
});
