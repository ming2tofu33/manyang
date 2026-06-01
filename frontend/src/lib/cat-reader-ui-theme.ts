import type { CSSProperties } from "react";

import { defaultCatReaderId, type CatReaderId } from "./cat-readers";

type CatReaderThemeVariable =
  | "--manyang-cat-title"
  | "--manyang-cat-title-shadow"
  | "--manyang-cat-eyebrow"
  | "--manyang-cat-home-text"
  | "--manyang-cat-home-text-shadow"
  | "--manyang-cat-accent"
  | "--manyang-cat-link"
  | "--manyang-cat-link-hover"
  | "--manyang-cat-link-decoration"
  | "--manyang-cat-badge-text"
  | "--manyang-cat-badge-border"
  | "--manyang-cat-badge-bg"
  | "--manyang-cat-button-text"
  | "--manyang-cat-button-shadow"
  | "--manyang-cat-button-glow"
  | "--manyang-cat-focus";

export type CatReaderUiThemeStyle = CSSProperties & Record<CatReaderThemeVariable, string>;

export type CatReaderUiTheme = {
  id: CatReaderId;
  surfaceMode: "dark" | "light-title";
  cssVariables: CatReaderUiThemeStyle;
};

export const catReaderUiThemes: Record<CatReaderId, CatReaderUiTheme> = {
  black_cat: {
    id: "black_cat",
    surfaceMode: "dark",
    cssVariables: {
      "--manyang-cat-title": "#ffd98a",
      "--manyang-cat-title-shadow": "0 0 14px rgba(255,193,92,0.46), 0 0 38px rgba(153,83,255,0.32)",
      "--manyang-cat-eyebrow": "#f4b65f",
      "--manyang-cat-home-text": "#fff3d7",
      "--manyang-cat-home-text-shadow": "0 0 14px rgba(0,0,0,0.82)",
      "--manyang-cat-accent": "#d799ff",
      "--manyang-cat-link": "#f2c27d",
      "--manyang-cat-link-hover": "#ffd98a",
      "--manyang-cat-link-decoration": "rgba(242,194,125,0.45)",
      "--manyang-cat-badge-text": "rgba(244,182,95,0.9)",
      "--manyang-cat-badge-border": "rgba(185,130,85,0.45)",
      "--manyang-cat-badge-bg": "rgba(5,4,11,0.52)",
      "--manyang-cat-button-text": "#ffc978",
      "--manyang-cat-button-shadow": "0 2px 2px rgba(34,10,20,0.88), 0 0 14px rgba(255,198,104,0.26)",
      "--manyang-cat-button-glow": "rgba(156,82,210,0.22)",
      "--manyang-cat-focus": "#d799ff",
    },
  },
  white_cat: {
    id: "white_cat",
    surfaceMode: "light-title",
    cssVariables: {
      "--manyang-cat-title": "#21100f",
      "--manyang-cat-title-shadow": "0 1px 0 rgba(255,255,255,0.30), 0 0 12px rgba(255,255,255,0.34)",
      "--manyang-cat-eyebrow": "#2b1815",
      "--manyang-cat-home-text": "#fff4f7",
      "--manyang-cat-home-text-shadow": "0 0 14px rgba(34,10,20,0.82)",
      "--manyang-cat-accent": "#ff8fba",
      "--manyang-cat-link": "#ffc1d4",
      "--manyang-cat-link-hover": "#ffe4ec",
      "--manyang-cat-link-decoration": "rgba(255,193,212,0.48)",
      "--manyang-cat-badge-text": "rgba(255,210,224,0.92)",
      "--manyang-cat-badge-border": "rgba(232,139,166,0.48)",
      "--manyang-cat-badge-bg": "rgba(48,14,31,0.46)",
      "--manyang-cat-button-text": "#ffd5e3",
      "--manyang-cat-button-shadow": "0 2px 2px rgba(42,9,26,0.86), 0 0 14px rgba(255,143,186,0.32)",
      "--manyang-cat-button-glow": "rgba(255,143,186,0.24)",
      "--manyang-cat-focus": "#ff9bc5",
    },
  },
  cheese_cat: {
    id: "cheese_cat",
    surfaceMode: "dark",
    cssVariables: {
      "--manyang-cat-title": "#ffd27a",
      "--manyang-cat-title-shadow": "0 0 14px rgba(255,179,71,0.48), 0 0 34px rgba(255,119,24,0.28)",
      "--manyang-cat-eyebrow": "#ffb64e",
      "--manyang-cat-home-text": "#fff0cf",
      "--manyang-cat-home-text-shadow": "0 0 14px rgba(22,10,0,0.88)",
      "--manyang-cat-accent": "#ffb347",
      "--manyang-cat-link": "#ffc25c",
      "--manyang-cat-link-hover": "#ffe2a3",
      "--manyang-cat-link-decoration": "rgba(255,194,92,0.48)",
      "--manyang-cat-badge-text": "rgba(255,199,104,0.92)",
      "--manyang-cat-badge-border": "rgba(222,142,42,0.52)",
      "--manyang-cat-badge-bg": "rgba(22,9,0,0.54)",
      "--manyang-cat-button-text": "#ffd36e",
      "--manyang-cat-button-shadow": "0 2px 2px rgba(42,15,0,0.88), 0 0 14px rgba(255,169,49,0.28)",
      "--manyang-cat-button-glow": "rgba(255,169,49,0.24)",
      "--manyang-cat-focus": "#ffcb6b",
    },
  },
  gray_cat: {
    id: "gray_cat",
    surfaceMode: "dark",
    cssVariables: {
      "--manyang-cat-title": "#e7d0c1",
      "--manyang-cat-title-shadow": "0 0 14px rgba(214,176,156,0.36), 0 0 32px rgba(155,123,192,0.24)",
      "--manyang-cat-eyebrow": "#c9a892",
      "--manyang-cat-home-text": "#eee4dc",
      "--manyang-cat-home-text-shadow": "0 0 14px rgba(0,0,0,0.84)",
      "--manyang-cat-accent": "#c7a4d7",
      "--manyang-cat-link": "#d6b09c",
      "--manyang-cat-link-hover": "#f0d5c4",
      "--manyang-cat-link-decoration": "rgba(214,176,156,0.45)",
      "--manyang-cat-badge-text": "rgba(214,176,156,0.92)",
      "--manyang-cat-badge-border": "rgba(160,122,102,0.46)",
      "--manyang-cat-badge-bg": "rgba(8,9,15,0.58)",
      "--manyang-cat-button-text": "#e8c2ad",
      "--manyang-cat-button-shadow": "0 2px 2px rgba(11,8,14,0.88), 0 0 14px rgba(189,150,132,0.26)",
      "--manyang-cat-button-glow": "rgba(189,150,132,0.22)",
      "--manyang-cat-focus": "#c7a4d7",
    },
  },
};

export function getCatReaderUiTheme(readerId: string | null | undefined): CatReaderUiTheme {
  return catReaderUiThemes[readerId as CatReaderId] ?? catReaderUiThemes[defaultCatReaderId];
}
