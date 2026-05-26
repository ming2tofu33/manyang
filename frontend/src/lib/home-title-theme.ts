import type { CatReaderId } from "./cat-readers";
import { ui } from "./styles";

type HomeTitleTheme = {
  haloClassName: string;
  eyebrowClassName: string;
  titleClassName: string;
};

const defaultHomeTitleTheme: HomeTitleTheme = {
  haloClassName:
    "absolute inset-x-[-2rem] -top-5 bottom-[-0.5rem] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.54)_42%,rgba(0,0,0,0.17)_68%,transparent_82%)]",
  eyebrowClassName: "text-[#f4b65f]",
  titleClassName: `text-[#ffd98a] ${ui.textGlow}`,
};

const whiteCatHomeTitleTheme: HomeTitleTheme = {
  haloClassName: "hidden",
  eyebrowClassName: "text-[#2b1815] [text-shadow:0_1px_0_rgba(255,255,255,0.28)]",
  titleClassName: "text-[#21100f] [text-shadow:0_1px_0_rgba(255,255,255,0.30),0_0_12px_rgba(255,255,255,0.34)]",
};

export function getHomeTitleTheme(readerId: CatReaderId): HomeTitleTheme {
  return readerId === "white_cat" ? whiteCatHomeTitleTheme : defaultHomeTitleTheme;
}
