import type { TarotCardContent } from "@manyang/contracts/tarot";

import { tarotMajorCardContent } from "./major";
import { tarotMinorCardContent } from "./minor";

export { tarotMinorCardContent };

export const tarotCardContent: readonly TarotCardContent[] = [
  ...tarotMajorCardContent,
  ...tarotMinorCardContent,
];

export function getTarotCardContentById(id: number): TarotCardContent | null {
  return tarotCardContent.find((card) => card.id === id) ?? null;
}

export function getTarotCardContentByKey(cardKey: string): TarotCardContent | null {
  return tarotCardContent.find((card) => card.cardKey === cardKey) ?? null;
}
