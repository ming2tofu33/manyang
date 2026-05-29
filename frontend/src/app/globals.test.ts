import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const globalsCss = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");

function getRuleBody(selector: string) {
  const selectorIndex = globalsCss.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const ruleStart = globalsCss.indexOf("{", selectorIndex);
  const ruleEnd = globalsCss.indexOf("}", ruleStart);
  expect(ruleStart).toBeGreaterThan(selectorIndex);
  expect(ruleEnd).toBeGreaterThan(ruleStart);

  return globalsCss.slice(ruleStart + 1, ruleEnd);
}

describe("global animation styles", () => {
  test("defines the home cat transition animation classes and reduced motion fallback", () => {
    expect(globalsCss).toContain(".home-cat-transition-current");
    expect(globalsCss).toContain(".home-cat-transition-previous");
    expect(globalsCss).toContain(".home-cat-transition-mist");
    expect(globalsCss).toContain(".home-cat-transition-glow");
    expect(globalsCss).toContain(".home-cat-card-glimmer");
    expect(globalsCss).toContain("@keyframes home-cat-current-reveal");
    expect(globalsCss).toContain("@keyframes home-cat-previous-fade");
    expect(globalsCss).toContain("@keyframes home-cat-mist-bloom");
    expect(globalsCss).toContain("@keyframes home-cat-glow-pulse");
    expect(globalsCss).toContain("@keyframes home-cat-card-glimmer");
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("uses slower background and mist timing so the cat change does not pop", () => {
    expect(globalsCss).toContain("home-cat-current-reveal 1180ms");
    expect(globalsCss).toContain("home-cat-previous-fade 1320ms");
    expect(globalsCss).toContain("home-cat-mist-bloom 1520ms");
    expect(globalsCss).toContain("home-cat-glow-pulse 1260ms");
    expect(globalsCss).toContain("52% {\n    opacity: 0.86;");
    expect(globalsCss).toContain("74% {\n    opacity: 0.36;");
  });

  test("keeps home animation layers from pre-promoting filter changes", () => {
    expect(getRuleBody(".home-live-effect")).toContain("will-change: transform, opacity;");
    expect(getRuleBody(".home-live-effect")).not.toContain("filter");

    expect(getRuleBody(".home-cat-transition-current")).toContain("will-change: transform, opacity;");
    expect(getRuleBody(".home-cat-transition-current")).not.toContain("filter");

    expect(getRuleBody(".home-cat-transition-previous")).toContain("will-change: opacity;");
    expect(getRuleBody(".home-cat-transition-previous")).not.toContain("filter");

    expect(getRuleBody(".home-cat-transition-mist,\n.home-cat-transition-glow")).toContain(
      "will-change: transform, opacity;",
    );
    expect(getRuleBody(".home-cat-transition-mist,\n.home-cat-transition-glow")).not.toContain("filter");
  });

  test("removes home animation filters and layer hints in reduced motion", () => {
    expect(globalsCss).toContain(
      [
        "  .home-cat-transition-current,",
        "  .home-cat-transition-previous,",
        "  .home-cat-transition-mist,",
        "  .home-cat-transition-glow,",
        "  .home-live-effect {",
        "    filter: none !important;",
        "    will-change: auto !important;",
        "  }",
      ].join("\n"),
    );
  });
});
