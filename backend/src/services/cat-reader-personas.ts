import type { CatReaderAccess, CatReaderType } from "../contracts/dream";

export type CatReaderPersona = {
  id: CatReaderType;
  displayName: string;
  access: CatReaderAccess;
  role: string;
  interpretationPriority: string[];
  toneDirectives: string[];
  outputBias: string[];
  avoidDirectives: string[];
  smallPrescriptionStyle: string;
  fortuneStyle: string;
};

export const commonCatReaderPersona: CatReaderPersona = {
  id: "black_cat",
  displayName: "Manyang",
  access: "free",
  role: "common dream reading engine",
  interpretationPriority: [
    "symbol evidence",
    "scene specificity",
    "selected feelings",
    "safe reflection",
  ],
  toneDirectives: [
    "calm",
    "warm",
    "specific",
    "non-alarming",
  ],
  outputBias: [
    "anchor the reading in retrieved symbols and concrete dream scenes",
    "connect the dream scene to a present emotional or situational flow without prediction",
    "keep the same interpretation policy regardless of selected cat theme",
  ],
  avoidDirectives: [
    "do not change interpretation priority by cat theme",
    "do not imply one cat gives deeper or more accurate readings",
    "do not make the reading sound like deterministic fortune-telling",
  ],
  smallPrescriptionStyle: "one compact, gentle, usable sentence tied to the dream details and selected feelings",
  fortuneStyle:
    "When playful fortune is allowed, deliver it as one light entertainment reading grounded in symbol evidence, never as a guarantee or instruction.",
};

export const catReaderPersonas: Record<CatReaderType, CatReaderPersona> = {
  black_cat: commonCatReaderPersona,
  white_cat: { ...commonCatReaderPersona, id: "white_cat" },
  cheese_cat: { ...commonCatReaderPersona, id: "cheese_cat" },
  gray_cat: { ...commonCatReaderPersona, id: "gray_cat", access: "annual_premium" },
};

export function normalizeCatReaderPersonaId(value: string | undefined | null): CatReaderType {
  if (value === "orange_cat" || value === "yellow_cat") {
    return "cheese_cat";
  }

  if (value === "black_cat" || value === "white_cat" || value === "cheese_cat" || value === "gray_cat") {
    return value;
  }

  return "black_cat";
}

export function getCatReaderPersona(value: string | undefined | null): CatReaderPersona {
  return catReaderPersonas[normalizeCatReaderPersonaId(value)];
}
