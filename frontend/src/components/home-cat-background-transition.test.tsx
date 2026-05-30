import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  HomeCatBackgroundTransition,
  homeCatTransitionCloudAssets,
  homeCatTransitionDurationMs,
} from "./home-cat-background-transition";

describe("HomeCatBackgroundTransition", () => {
  test("keeps the previous background long enough for a visible transition", () => {
    expect(homeCatTransitionDurationMs).toBe(2400);
  });

  test("preloads optimized magic cloud assets before a cat change starts", () => {
    expect(homeCatTransitionCloudAssets).toEqual([
      "/manyang/ui/transitions/cat-transition-magic-cloud-left.webp",
      "/manyang/ui/transitions/cat-transition-magic-cloud-right.webp",
    ]);
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
      "--home-cat-transition-left-image:url(/manyang/ui/transitions/cat-transition-magic-cloud-left.webp)",
    );
    expect(markup).toContain(
      "--home-cat-transition-right-image:url(/manyang/ui/transitions/cat-transition-magic-cloud-right.webp)",
    );
    expect(markup).toContain('data-home-cat-transition="preload-left"');
    expect(markup).toContain('data-home-cat-transition="preload-right"');
    expect(markup).toContain('<link rel="preload" as="image" href="/manyang/ui/transitions/cat-transition-magic-cloud-left.webp"');
    expect(markup).toContain('<link rel="preload" as="image" href="/manyang/ui/transitions/cat-transition-magic-cloud-right.webp"');
    expect(markup).toContain('decoding="async"');
    expect(markup).toContain("home-cat-transition-current");
    expect(markup).toContain("home-cat-transition-mist-white");
    expect(markup).toContain("home-cat-transition-glow-white");
    expect(markup).not.toContain('data-home-cat-transition="previous"');
  });
});
