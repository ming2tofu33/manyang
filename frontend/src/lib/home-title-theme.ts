import type { CatReaderId } from "./cat-readers";

type HomeTitleTheme = {
  haloClassName: string;
  eyebrowClassName: string;
  titleClassName: string;
};

const defaultHomeTitleTheme: HomeTitleTheme = {
  haloClassName:
    "absolute inset-x-[-2rem] -top-5 bottom-[-0.5rem] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.54)_42%,rgba(0,0,0,0.17)_68%,transparent_82%)]",
  eyebrowClassName: "tracking-[0.16em] text-[var(--manyang-cat-eyebrow)]",
  titleClassName: "text-[var(--manyang-cat-title)] [text-shadow:var(--manyang-cat-title-shadow)]",
};

const whiteCatHomeTitleTheme: HomeTitleTheme = {
  haloClassName: "hidden",
  eyebrowClassName: "tracking-[0.16em] text-[var(--manyang-cat-eyebrow)] [text-shadow:0_1px_0_rgba(255,255,255,0.28)]",
  titleClassName: "text-[var(--manyang-cat-title)] [text-shadow:var(--manyang-cat-title-shadow)]",
};

export function getHomeTitleTheme(readerId: CatReaderId): HomeTitleTheme {
  return readerId === "white_cat" ? whiteCatHomeTitleTheme : defaultHomeTitleTheme;
}
