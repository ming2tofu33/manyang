import {
  getTarotCardContentById,
  getTarotCardContentByKey,
} from "@manyang/content/tarot";
import type {
  TarotCard as TarotCardSnapshot,
  TarotCardContent,
} from "@manyang/contracts/tarot";

import { tarotMajorCards } from "./tarot-major-cards";
import { tarotMinorCards } from "./tarot-minor-cards";

export type TarotCard = TarotCardSnapshot;

type ResolvedTarotCard = TarotCardContent & {
  image: string;
};

export { tarotMinorCards };

export const tarotCards: readonly ResolvedTarotCard[] = [
  ...tarotMajorCards,
  ...tarotMinorCards,
] satisfies readonly ResolvedTarotCard[];

export function getTarotCardById(id: number): TarotCard | null {
  const sharedCard = getTarotCardContentById(id);

  if (!sharedCard) {
    return null;
  }

  return tarotCards.find((card) => card.id === sharedCard.id) ?? null;
}

export function getTarotCardByKey(cardKey: string): TarotCard | null {
  const sharedCard = getTarotCardContentByKey(cardKey);

  if (!sharedCard) {
    return null;
  }

  return tarotCards.find((card) => card.cardKey === sharedCard.cardKey) ?? null;
}
