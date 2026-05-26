import { describe, expect, it } from "vitest";

import { getHomeBackgroundEffectTargets, homeBackgroundEffectTargetsByReader } from "./home-background-effect-layout";

describe("home background effect layout", () => {
  it("defines distinct live effect targets for every cat home background", () => {
    expect(Object.keys(homeBackgroundEffectTargetsByReader)).toEqual([
      "black_cat",
      "white_cat",
      "cheese_cat",
      "gray_cat",
    ]);
    expect(getHomeBackgroundEffectTargets("black_cat").map((target) => target.name)).toEqual([
      "left-shelf-candle",
      "left-table-candle",
      "skull-candle",
      "right-shelf-candle1",
      "right-shelf-candle2",
      "right-lantern",
      "right-book-candle",
      "crystal-orb",
      "crystal-orb-core",
      "left-smoke-column",
      "orb-mist",
      "window-star",
      "hat-brim-sparkle",
      "right-hanging-star",
      "orb-inner-star",
      "right-crystal-sparkle",
    ]);
  });

  it("maps legacy orange and yellow readers to the cheese cat effect layout", () => {
    expect(getHomeBackgroundEffectTargets("orange_cat")).toBe(getHomeBackgroundEffectTargets("cheese_cat"));
    expect(getHomeBackgroundEffectTargets("yellow_cat")).toBe(getHomeBackgroundEffectTargets("cheese_cat"));
  });

  it("keeps the main glows inside the visible mobile frame", () => {
    for (const targets of Object.values(homeBackgroundEffectTargetsByReader)) {
      for (const target of targets) {
        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x).toBeLessThanOrEqual(100);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it("keeps black cat candle effects aligned with the current home asset", () => {
    const blackTargets = getHomeBackgroundEffectTargets("black_cat");
    const leftCandles = Object.fromEntries(blackTargets.slice(0, 3).map((target) => [target.name, target]));

    expect(leftCandles).toMatchObject({
      "left-shelf-candle": { x: 6.1, y: 31.2, size: 30 },
      "left-table-candle": { x: 6.2, y: 43.2, size: 68 },
      "skull-candle": { x: 4.7, y: 52.1, size: 60 },
    });
    expect(leftCandles["left-shelf-candle"]).not.toHaveProperty("strength");
  });

  it("places black cat right-side flames and foreground glows over their matching objects", () => {
    expect(Object.fromEntries(getHomeBackgroundEffectTargets("black_cat").map((target) => [target.name, target]))).toMatchObject({
      "right-shelf-candle2": { type: "flame", x: 95.7, y: 29.6, size: 32 },
      "right-lantern": { type: "flame", x: 89.9, y: 48.5, size: 76 },
      "right-book-candle": { type: "flame", x: 81.8, y: 51.8, size: 40 },
      "crystal-orb": { type: "orb", x: 49.9, y: 53.8, size: 150 },
      "orb-mist": { type: "smoke", x: 50.4, y: 50.8, size: 84 },
    });
  });

  it("anchors black cat twinkles to visible foreground decorations", () => {
    expect(Object.fromEntries(getHomeBackgroundEffectTargets("black_cat").map((target) => [target.name, target]))).toMatchObject({
      "window-star": { type: "twinkle", x: 8.1, y: 14.8, size: 14 },
      "hat-brim-sparkle": { type: "twinkle", x: 68.2, y: 30.9, size: 10, delay: "2.8s" },
      "right-hanging-star": { type: "twinkle", x: 83.5, y: 41.2, size: 16 },
      "orb-inner-star": { type: "twinkle", x: 50.1, y: 52, size: 12 },
      "right-crystal-sparkle": { type: "twinkle", x: 78.5, y: 61.7, size: 13 },
    });
  });

  it("uses softer rose-toned effects for white cat and gold-toned effects for cheese cat", () => {
    expect(getHomeBackgroundEffectTargets("white_cat").some((target) => target.tone === "rose")).toBe(true);
    expect(getHomeBackgroundEffectTargets("cheese_cat").some((target) => target.tone === "gold")).toBe(true);
    expect(getHomeBackgroundEffectTargets("gray_cat").some((target) => target.tone === "cool")).toBe(true);
  });
});
