import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HomeBackgroundEffects } from "./home-background-effects";

function getRenderedEffect(name: string) {
  const markup = renderToStaticMarkup(<HomeBackgroundEffects />);
  const attributeStart = markup.indexOf(`data-home-effect="${name}"`);
  expect(attributeStart).toBeGreaterThanOrEqual(0);

  const start = markup.lastIndexOf("<span", attributeStart);
  const effectMarkup = markup.slice(start, markup.indexOf("</span></span>", start) + "</span></span>".length);
  const [wrapperOpenTag, innerOpenTag] = effectMarkup.match(/<span[^>]*>/g) ?? [];

  return { wrapperOpenTag, innerOpenTag };
}

describe("HomeBackgroundEffects", () => {
  it("marks the effect layer with the 390x844 home stage contract", () => {
    const markup = renderToStaticMarkup(<HomeBackgroundEffects />);

    expect(markup).toContain('data-home-effect-stage="390x844"');
    expect(markup).toContain("home-effect-stage");
    expect(markup).toContain("home-effect-target");
  });

  it("puts animation delays on the animated element instead of the position wrapper", () => {
    const { wrapperOpenTag, innerOpenTag } = getRenderedEffect("hat-brim-sparkle");

    expect(wrapperOpenTag).not.toContain("animation-delay");
    expect(innerOpenTag).toContain("animation-delay:2.8s");
  });

  it("renders the upper-left shelf candle as a normal flame", () => {
    const { innerOpenTag } = getRenderedEffect("left-shelf-candle");

    expect(innerOpenTag).toContain("home-live-flame");
    expect(innerOpenTag).not.toContain("home-live-soft");
  });

  it("renders reader-specific effect sets", () => {
    const cheeseMarkup = renderToStaticMarkup(<HomeBackgroundEffects readerId="cheese_cat" />);
    const whiteMarkup = renderToStaticMarkup(<HomeBackgroundEffects readerId="white_cat" />);

    expect(cheeseMarkup).toContain('data-home-effect="cheese-orb-glow"');
    expect(cheeseMarkup).toContain("home-live-gold");
    expect(whiteMarkup).toContain('data-home-effect="white-orb-glow"');
    expect(whiteMarkup).toContain("home-live-rose");
  });

  it("keeps orb and flame visual centers aligned with their position boxes", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).not.toContain("circle at 58% 52%");
    expect(css).not.toContain("ellipse at 50% 58%");
    expect(css).toContain("circle at 50% 48%");
    expect(css).toContain("ellipse at 50% 50%");
  });
});
