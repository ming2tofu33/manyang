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
    expect(globalsCss).toContain(".home-cat-card-glimmer");
    expect(globalsCss).toContain("@keyframes home-cat-current-reveal");
    expect(globalsCss).toContain("@keyframes home-cat-previous-fade");
    expect(globalsCss).toContain("@keyframes home-cat-card-glimmer");
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("uses a short simple fade for home cat background changes", () => {
    expect(globalsCss).toContain("home-cat-current-reveal 900ms");
    expect(globalsCss).toContain("home-cat-previous-fade 900ms");
    expect(globalsCss).not.toContain("home-cat-mist-left-sweep");
    expect(globalsCss).not.toContain("home-cat-mist-right-sweep");
    expect(globalsCss).not.toContain("home-cat-glow-pulse");
  });

  test("does not render illustrated mist or cloud transition styles", () => {
    expect(globalsCss).not.toContain("home-cat-transition-mist");
    expect(globalsCss).not.toContain("home-cat-transition-glow");
    expect(globalsCss).not.toContain("--home-cat-transition-left-image");
    expect(globalsCss).not.toContain("--home-cat-transition-right-image");
  });

  test("keeps home animation layers from pre-promoting filter changes", () => {
    expect(getRuleBody(".home-live-effect")).toContain("will-change: transform, opacity;");
    expect(getRuleBody(".home-live-effect")).not.toContain("filter");

    expect(getRuleBody(".home-cat-transition-current")).toContain("will-change: transform, opacity;");
    expect(getRuleBody(".home-cat-transition-current")).not.toContain("filter");

    expect(getRuleBody(".home-cat-transition-previous")).toContain("will-change: opacity;");
    expect(getRuleBody(".home-cat-transition-previous")).not.toContain("filter");

    expect(globalsCss).not.toContain("home-cat-transition-mist");
    expect(globalsCss).not.toContain("home-cat-transition-glow");
  });

  test("removes home animation filters and layer hints in reduced motion", () => {
    expect(globalsCss).toContain(
      [
        "  .home-cat-transition-current,",
        "  .home-cat-transition-previous,",
        "  .home-live-effect {",
        "    filter: none !important;",
        "    will-change: auto !important;",
        "  }",
      ].join("\n"),
    );
  });

  test("defines receipt word streaming animation with reduced motion fallback", () => {
    expect(globalsCss).toContain(".receipt-stream-word");
    expect(globalsCss).toContain("@keyframes receipt-word-bloom");
    expect(globalsCss).toContain("animation: receipt-word-bloom 1300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;");
    expect(globalsCss).toContain("will-change: opacity, filter, transform;");
    expect(globalsCss).toContain(".animate-receipt-title-fade");
    expect(globalsCss).toContain("@keyframes receipt-title-fade");
    expect(globalsCss).toContain("animation: receipt-title-fade 2400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;");
    expect(globalsCss).toContain(".receipt-tag-pop");
    expect(globalsCss).toContain("@keyframes receipt-tag-pop");
    expect(globalsCss).toContain("  .receipt-stream-word {");
    expect(globalsCss).toContain("  .animate-receipt-title-fade,");
    expect(globalsCss).toContain("  .receipt-tag-pop {");
    expect(globalsCss).toContain("    animation: none !important;");
    expect(globalsCss).toContain("    opacity: 1 !important;");
  });

  test("keeps the sliced receipt paper slide animation free of filter seams", () => {
    const keyframeStart = globalsCss.indexOf("@keyframes receipt-slide-up");
    const nextRuleStart = globalsCss.indexOf(".animate-ink-fade", keyframeStart);
    expect(keyframeStart).toBeGreaterThanOrEqual(0);
    expect(nextRuleStart).toBeGreaterThan(keyframeStart);

    const slideAnimationBlock = globalsCss.slice(keyframeStart, nextRuleStart);

    expect(slideAnimationBlock).not.toContain("filter:");
  });

  test("turns off dream loading motion in reduced motion mode", () => {
    expect(globalsCss).toContain("  .orb-pulse,");
    expect(globalsCss).toContain("  .animate-bg-cinematic,");
    expect(globalsCss).toContain("  .animate-orb-glow-premium,");
    expect(globalsCss).toContain("  .animate-text-shimmer,");
    expect(globalsCss).toContain("  .animate-orb-1,");
    expect(globalsCss).toContain("  .animate-orb-2,");
    expect(globalsCss).toContain("  .animate-orb-3 {");
    expect(globalsCss).toContain("    animation: none !important;");
  });
});
