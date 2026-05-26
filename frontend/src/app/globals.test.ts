import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const globalsCss = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");

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
});
