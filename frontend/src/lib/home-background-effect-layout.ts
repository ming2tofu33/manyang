import type { CatReaderId } from "./cat-readers";

export type HomeBackgroundEffectType = "flame" | "orb" | "smoke" | "twinkle";
export type HomeBackgroundEffectTone = "amber" | "violet" | "white" | "rose" | "gold" | "cool";

export type HomeBackgroundEffectTarget = {
  name: string;
  type: HomeBackgroundEffectType;
  x: number;
  y: number;
  size: number;
  delay?: string;
  tone?: HomeBackgroundEffectTone;
};

const blackCatTargets: HomeBackgroundEffectTarget[] = [
  // Existing candles (Coordinates remain EXACTLY as they are, with explicit amber tones)
  { name: "left-shelf-candle", type: "flame", x: 6.1, y: 31.2, size: 30, delay: "0.25s", tone: "amber" },
  { name: "left-table-candle", type: "flame", x: 6.2, y: 43.2, size: 68, tone: "amber" },
  { name: "skull-candle", type: "flame", x: 4.7, y: 52.1, size: 60, delay: "0.6s", tone: "amber" },
  { name: "right-shelf-candle1", type: "flame", x: 94.8, y: 20.9, size: 26, delay: "0.15s", tone: "amber" },
  { name: "right-shelf-candle2", type: "flame", x: 95.7, y: 29.6, size: 32, delay: "0.15s", tone: "amber" },
  { name: "right-lantern", type: "flame", x: 89.9, y: 48.5, size: 76, delay: "0.35s", tone: "amber" },
  { name: "right-book-candle", type: "flame", x: 81.8, y: 51.8, size: 40, delay: "0.9s", tone: "amber" },

  // Crystal Orb (Preserved outer orb, added white-core overlay at EXACT same coordinates for premium 3D depth)
  { name: "crystal-orb", type: "orb", x: 49.9, y: 53.8, size: 150, tone: "violet" },
  { name: "crystal-orb-core", type: "orb", x: 49.9, y: 53.8, size: 70, delay: "0.8s", tone: "white" },

  // Smokes (Preserved)
  { name: "left-smoke-column", type: "smoke", x: 17.4, y: 39.5, size: 118, delay: "0.3s", tone: "violet" },
  { name: "orb-mist", type: "smoke", x: 50.4, y: 50.8, size: 84, delay: "2.2s", tone: "white" },

  // Sparkles & Ornaments (Preserved)
  { name: "window-star", type: "twinkle", x: 8.1, y: 14.8, size: 14, delay: "0.2s", tone: "amber" },
  { name: "hat-brim-sparkle", type: "twinkle", x: 68.2, y: 30.9, size: 10, delay: "2.8s", tone: "amber" },
  { name: "right-hanging-star", type: "twinkle", x: 83.5, y: 41.2, size: 16, delay: "0.7s", tone: "white" },
  { name: "orb-inner-star", type: "twinkle", x: 50.1, y: 52, size: 12, delay: "1.8s", tone: "amber" },
  { name: "right-crystal-sparkle", type: "twinkle", x: 78.5, y: 61.7, size: 13, delay: "2.4s", tone: "white" }
];

const whiteCatTargets: HomeBackgroundEffectTarget[] = [
  // 1. Pink Crystal Orb
  { name: "white-orb-glow", type: "orb", x: 53.0, y: 54.0, size: 160, tone: "rose" },
  { name: "white-orb-glow-inner", type: "orb", x: 53.0, y: 54.0, size: 80, delay: "1.0s", tone: "white" },
  { name: "white-orb-smoke", type: "smoke", x: 50.0, y: 52.0, size: 100, delay: "1.2s", tone: "rose" },

  // 2. Warm Lantern Glow (left)
  { name: "white-left-lantern", type: "flame", x: 7.8, y: 50.2, size: 60, delay: "0.3s", tone: "gold" },
  { name: "white-left-candle-1", type: "flame", x: 18.0, y: 34.8, size: 36, delay: "0.8s", tone: "rose" },
  { name: "white-left-candle-2", type: "flame", x: 25.6, y: 28.8, size: 40, delay: "0.1s", tone: "gold" },

  // 3. Crystal Sparkles (Hat, ceiling, table)
  { name: "white-hat-sparkle-1", type: "twinkle", x: 88.0, y: 42.0, size: 15, delay: "0.2s", tone: "white" },
  { name: "white-hat-sparkle-2", type: "twinkle", x: 73.0, y: 25.0, size: 13, delay: "1.5s", tone: "rose" },
  { name: "white-hat-sparkle-3", type: "twinkle", x: 62.0, y: 23.0, size: 14, delay: "2.1s", tone: "white" },

  { name: "white-table-crystal-1", type: "twinkle", x: 79.4, y: 56.0, size: 16, delay: "0.8s", tone: "rose" },
  { name: "white-table-crystal-2", type: "twinkle", x: 87.0, y: 45.0, size: 12, delay: "1.9s", tone: "white" },

  { name: "white-ceiling-gem-1", type: "twinkle", x: 27.0, y: 13.0, size: 14, delay: "0.5s", tone: "white" },
  { name: "white-ceiling-gem-2", type: "twinkle", x: 60.0, y: 9.0, size: 15, delay: "2.4s", tone: "rose" },
];

const cheeseCatTargets: HomeBackgroundEffectTarget[] = [
  // 1. Solar Crystal Glow
  { name: "cheese-orb-glow", type: "orb", x: 48.4, y: 50.2, size: 160, tone: "gold" },
  { name: "cheese-orb-glow-core", type: "orb", x: 48.4, y: 50.2, size: 80, delay: "0.8s", tone: "amber" },

  // 2. Incense Smoke Drift
  { name: "cheese-incense-smoke", type: "smoke", x: 18.0, y: 42.0, size: 110, delay: "0.5s", tone: "gold" },

  // 3. Antique Candle & Potion Flicker
  { name: "cheese-right-candle1", type: "flame", x: 91.2, y: 43.6, size: 50, delay: "0.2s", tone: "gold" },
  { name: "cheese-right-candle2", type: "flame", x: 91.1, y: 25.6, size: 30, tone: "gold" },
  { name: "cheese-left-incense", type: "flame", x: 21.6, y: 44.6, size: 16, delay: "0.5s",tone: "gold" },
  { name: "right-shelf-candle", type: "flame", x: 90.9, y: 19.2, size: 20, delay: "0.4s", tone: "gold" },
  { name: "cheese-potion-glow", type: "orb", x: 67.0, y: 54.0, size: 40, delay: "1.2s", tone: "amber" },

  // 4. Sun & Moon Charm Sparkles & Table Crystals
  { name: "cheese-hat-sun", type: "twinkle", x: 62.3, y: 24.4, size: 16, delay: "0.4s", tone: "gold" },
  { name: "cheese-hat-moon", type: "twinkle", x: 77.0, y: 39.0, size: 14, delay: "1.5s", tone: "amber" },
  { name: "cheese-hat-star-1", type: "twinkle", x: 82.5, y: 31.0, size: 12, delay: "2.1s", tone: "white" },
  { name: "cheese-hat-star-2", type: "twinkle", x: 82.5, y: 22.0, size: 13, delay: "0.9s", tone: "gold" },

  { name: "cheese-window-moon", type: "orb", x: 10.5, y: 12.3, size: 70, delay: "0.1s", tone: "gold" },

  { name: "cheese-table-crystal-left", type: "twinkle", x: 11.0, y: 51.0, size: 15, delay: "2.7s", tone: "gold" },
  { name: "cheese-table-crystal-right", type: "twinkle", x: 82.8, y: 61.1, size: 12, delay: "1.8s", tone: "amber" }
];

const grayCatTargets: HomeBackgroundEffectTarget[] = [
  // 1. Lunar Crystal Orb
  { name: "gray-orb-glow", type: "orb", x: 48.4, y: 51.2, size: 160, tone: "cool" },
  { name: "gray-orb-glow-core", type: "orb", x: 48.4, y: 51.2, size: 80, delay: "0.8s", tone: "white" },
  { name: "gray-orb-mist", type: "smoke", x: 48.4, y: 48.0, size: 100, delay: "1.5s", tone: "cool" },

  // 2. Contrast Lanterns & Candles (Warm Amber & Cool Contrast)
  { name: "gray-left-candle", type: "flame", x: 8.8, y: 34.0, size: 70, delay: "0.2s", tone: "amber" },
  { name: "gray-right-lantern", type: "flame", x: 90.4, y: 43.0, size: 48, delay: "0.4s", tone: "amber" },
  { name: "gray-table-lantern", type: "flame", x: 69.8, y: 54.6, size: 45, delay: "0.7s", tone: "cool" },

  // 3. Crescent Moon & Left Smoke
  { name: "gray-window-moon", type: "orb", x: 15.0, y: 17.3, size: 90, delay: "0.1s", tone: "white" },
  { name: "gray-left-smoke", type: "smoke", x: 8.8, y: 32.0, size: 110, delay: "0.5s", tone: "cool" },

  // 4. Silver Twinkles (Ornaments & Crystals)
  { name: "gray-hat-star", type: "twinkle", x: 67.4, y: 26.0, size: 12, delay: "0.6s", tone: "white" },
  { name: "gray-hat-moon", type: "twinkle", x: 82.0, y: 22.0, size: 14, delay: "1.2s", tone: "cool" },
  { name: "gray-hat-pendant", type: "twinkle", x: 57.6, y: 22.0, size: 15, delay: "2.0s", tone: "cool" },
  { name: "gray-hanging-star", type: "twinkle", x: 35.0, y: 15.0, size: 15, delay: "2.9s", tone: "white" },
  { name: "gray-hourglass-sparkle", type: "twinkle", x: 22.0, y: 46.0, size: 12, delay: "0.8s", tone: "white" },
  { name: "gray-table-crystal-left", type: "twinkle", x: 13.0, y: 59.0, size: 13, delay: "2.4s", tone: "cool" },
  { name: "gray-table-crystal-right", type: "twinkle", x: 79.0, y: 58.0, size: 14, delay: "1.7s", tone: "white" }
];

export const homeBackgroundEffectTargetsByReader: Record<CatReaderId, HomeBackgroundEffectTarget[]> = {
  black_cat: blackCatTargets,
  white_cat: whiteCatTargets,
  cheese_cat: cheeseCatTargets,
  gray_cat: grayCatTargets,
} as const;

export const homeBackgroundEffectTargets = homeBackgroundEffectTargetsByReader.black_cat;

export function getHomeBackgroundEffectTargets(readerId: string | undefined | null): HomeBackgroundEffectTarget[] {
  if (readerId === "white_cat") {
    return homeBackgroundEffectTargetsByReader.white_cat;
  }

  if (readerId === "cheese_cat" || readerId === "orange_cat" || readerId === "yellow_cat") {
    return homeBackgroundEffectTargetsByReader.cheese_cat;
  }

  if (readerId === "gray_cat") {
    return homeBackgroundEffectTargetsByReader.gray_cat;
  }

  return homeBackgroundEffectTargetsByReader.black_cat;
}
