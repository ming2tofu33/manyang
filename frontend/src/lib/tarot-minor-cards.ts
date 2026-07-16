import {
  getTarotMinorCardContentById,
  tarotMinorCardContent,
} from "@manyang/content/tarot";
import type {
  TarotMinorCardContent,
  TarotMinorCardSnapshot,
} from "@manyang/contracts/tarot";

import { resolveTarotWebImage } from "./tarot-web-assets";

export type { TarotMinorRank, TarotMinorSuit } from "@manyang/contracts/tarot";

export type TarotMinorCard = TarotMinorCardSnapshot;

type ResolvedTarotMinorCard = TarotMinorCardContent & {
  image: string;
};

export const tarotMinorCards: readonly ResolvedTarotMinorCard[] =
  tarotMinorCardContent.map((card) => ({
    ...card,
    image: resolveTarotWebImage(card.imageKey),
  })) satisfies readonly ResolvedTarotMinorCard[];

export function getTarotMinorCardById(id: number): TarotMinorCard | null {
  const sharedCard = getTarotMinorCardContentById(id);

  if (!sharedCard) {
    return null;
  }

  return tarotMinorCards.find((card) => card.id === sharedCard.id) ?? null;
}
