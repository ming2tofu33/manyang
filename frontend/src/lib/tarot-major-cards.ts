import {
  getTarotMajorCardContentById,
  tarotMajorCardContent,
} from "@manyang/content/tarot";
import type {
  TarotCardMeaning,
  TarotMajorCardContent,
  TarotMajorCardSnapshot,
} from "@manyang/contracts/tarot";

import { resolveTarotWebImage } from "./tarot-web-assets";

export type { TarotCardSymbolMeaning } from "@manyang/contracts/tarot";

export type TarotMajorCardMeaning = TarotCardMeaning;

export type TarotMajorCard = TarotMajorCardSnapshot;

type ResolvedTarotMajorCard = TarotMajorCardContent & {
  image: string;
};

export const tarotMajorCards: readonly ResolvedTarotMajorCard[] =
  tarotMajorCardContent.map((card) => ({
    ...card,
    image: resolveTarotWebImage(card.imageKey),
  })) satisfies readonly ResolvedTarotMajorCard[];

export function getTarotMajorCardById(id: number): TarotMajorCard | null {
  const sharedCard = getTarotMajorCardContentById(id);

  if (!sharedCard) {
    return null;
  }

  return tarotMajorCards.find((card) => card.id === sharedCard.id) ?? null;
}
