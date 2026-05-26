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
  { name: "left-shelf-candle", type: "flame", x: 6.1, y: 31.2, size: 30, delay: "0.25s" },
  { name: "left-table-candle", type: "flame", x: 6.2, y: 43.2, size: 68 },
  { name: "skull-candle", type: "flame", x: 4.7, y: 52.1, size: 60, delay: "0.6s" },
  { name: "right-shelf-candle1", type: "flame", x: 94.8, y: 20.9, size: 26, delay: "0.15s" },
  { name: "right-shelf-candle2", type: "flame", x: 95.7, y: 29.6, size: 32, delay: "0.15s" },
  { name: "right-lantern", type: "flame", x: 89.9, y: 48.5, size: 76, delay: "0.35s" },
  { name: "right-book-candle", type: "flame", x: 81.8, y: 51.8, size: 40, delay: "0.9s" },
  { name: "crystal-orb", type: "orb", x: 49.9, y: 53.8, size: 150, tone: "violet" },
  { name: "left-smoke-column", type: "smoke", x: 17.4, y: 39.5, size: 118, delay: "0.3s", tone: "violet" },
  { name: "orb-mist", type: "smoke", x: 50.4, y: 50.8, size: 84, delay: "2.2s", tone: "white" },
  { name: "window-star", type: "twinkle", x: 8.1, y: 14.8, size: 14, delay: "0.2s", tone: "amber" },
  { name: "hat-brim-sparkle", type: "twinkle", x: 68.2, y: 30.9, size: 10, delay: "2.8s", tone: "amber" },
  { name: "right-hanging-star", type: "twinkle", x: 83.5, y: 41.2, size: 16, delay: "0.7s", tone: "white" },
  { name: "orb-inner-star", type: "twinkle", x: 50.1, y: 52, size: 12, delay: "1.8s", tone: "amber" },
  { name: "right-crystal-sparkle", type: "twinkle", x: 78.5, y: 61.7, size: 13, delay: "2.4s", tone: "white" },
];

const whiteCatTargets: HomeBackgroundEffectTarget[] = [
  { name: "white-left-candle", type: "flame", x: 7.6, y: 49.1, size: 62, delay: "0.2s", tone: "rose" },
  { name: "white-right-candle", type: "flame", x: 90.5, y: 50.2, size: 46, delay: "0.8s", tone: "rose" },
  { name: "white-orb-glow", type: "orb", x: 51.4, y: 58.6, size: 170, tone: "rose" },
  { name: "white-window-moon", type: "orb", x: 18.2, y: 20.2, size: 92, delay: "0.4s", tone: "white" },
  { name: "white-orb-mist", type: "smoke", x: 51.5, y: 58.2, size: 92, delay: "1.4s", tone: "rose" },
  { name: "white-left-bow-sparkle", type: "twinkle", x: 9.7, y: 62.4, size: 15, delay: "0.3s", tone: "rose" },
  { name: "white-hat-star", type: "twinkle", x: 57.4, y: 23.8, size: 13, delay: "1.6s", tone: "white" },
  { name: "white-right-globe", type: "twinkle", x: 89.1, y: 58.9, size: 14, delay: "2.2s", tone: "rose" },
  { name: "white-card-sparkle", type: "twinkle", x: 44.7, y: 89.1, size: 12, delay: "2.7s", tone: "white" },
];

const cheeseCatTargets: HomeBackgroundEffectTarget[] = [
  { name: "cheese-left-incense", type: "flame", x: 21.6, y: 47.8, size: 24, delay: "0.3s", tone: "gold" },
  { name: "cheese-right-candle", type: "flame", x: 91.2, y: 45.6, size: 40, delay: "0.7s", tone: "gold" },
  { name: "cheese-orb-glow", type: "orb", x: 48.4, y: 53.2, size: 160, tone: "gold" },
  { name: "cheese-wand-smoke", type: "smoke", x: 13.2, y: 44.6, size: 112, delay: "0.5s", tone: "gold" },
  { name: "cheese-hat-sun", type: "twinkle", x: 62.3, y: 24.4, size: 14, delay: "0.8s", tone: "gold" },
  { name: "cheese-window-star", type: "twinkle", x: 82.6, y: 13.8, size: 18, delay: "1.7s", tone: "gold" },
  { name: "cheese-orb-star", type: "twinkle", x: 50.4, y: 64.0, size: 16, delay: "2.1s", tone: "white" },
  { name: "cheese-table-crystal", type: "twinkle", x: 66.8, y: 88.1, size: 12, delay: "2.8s", tone: "gold" },
];

const grayCatTargets: HomeBackgroundEffectTarget[] = [
  { name: "gray-black-candle", type: "flame", x: 8.8, y: 48.5, size: 72, delay: "0.25s", tone: "cool" },
  { name: "gray-lantern", type: "flame", x: 85.4, y: 72.2, size: 50, delay: "0.9s", tone: "cool" },
  { name: "gray-orb-glow", type: "orb", x: 47.8, y: 52.6, size: 174, tone: "cool" },
  { name: "gray-window-moon", type: "orb", x: 13.4, y: 18.6, size: 96, delay: "0.5s", tone: "white" },
  { name: "gray-left-smoke", type: "smoke", x: 9.4, y: 38.3, size: 124, delay: "0.4s", tone: "cool" },
  { name: "gray-orb-mist", type: "smoke", x: 50.4, y: 65.2, size: 98, delay: "1.9s", tone: "white" },
  { name: "gray-hat-crystal", type: "twinkle", x: 64.4, y: 25.3, size: 13, delay: "1.3s", tone: "cool" },
  { name: "gray-window-star", type: "twinkle", x: 23.7, y: 14.9, size: 16, delay: "0.6s", tone: "white" },
  { name: "gray-card-star", type: "twinkle", x: 50.9, y: 90.4, size: 13, delay: "2.5s", tone: "cool" },
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
