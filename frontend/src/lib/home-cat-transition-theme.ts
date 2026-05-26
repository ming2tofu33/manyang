import type { CatReaderId } from "./cat-readers";

type HomeCatTransitionTheme = {
  mistClassName: string;
  glowClassName: string;
};

const transitionThemes: Record<CatReaderId, HomeCatTransitionTheme> = {
  black_cat: {
    mistClassName: "home-cat-transition-mist-black",
    glowClassName: "home-cat-transition-glow-black",
  },
  white_cat: {
    mistClassName: "home-cat-transition-mist-white",
    glowClassName: "home-cat-transition-glow-white",
  },
  cheese_cat: {
    mistClassName: "home-cat-transition-mist-cheese",
    glowClassName: "home-cat-transition-glow-cheese",
  },
  gray_cat: {
    mistClassName: "home-cat-transition-mist-gray",
    glowClassName: "home-cat-transition-glow-gray",
  },
};

export function getHomeCatTransitionTheme(readerId: CatReaderId): HomeCatTransitionTheme {
  return transitionThemes[readerId];
}
