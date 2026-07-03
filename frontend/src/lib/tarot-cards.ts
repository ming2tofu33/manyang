import {
  getTarotMajorCardById,
  tarotMajorCards,
  type TarotMajorCard,
} from "./tarot-major-cards";
import {
  getTarotMinorCardById,
  tarotMinorCards,
  type TarotMinorCard,
} from "./tarot-minor-cards";

export type TarotCard = (TarotMajorCard & { arcana?: "major"; cardKey?: string }) | TarotMinorCard;

const tarotMajorDeckCards = tarotMajorCards.map((card) => ({
  ...card,
  arcana: "major" as const,
  cardKey: `major:${String(card.id).padStart(2, "0")}`,
}));

export { tarotMinorCards };

export const tarotCards = [...tarotMajorDeckCards, ...tarotMinorCards] as const satisfies readonly TarotCard[];

export function getTarotCardById(id: number): TarotCard | null {
  return tarotCards.find((card) => card.id === id) ?? getTarotMajorCardById(id) ?? getTarotMinorCardById(id);
}

export function getTarotCardByKey(cardKey: string): TarotCard | null {
  return tarotCards.find((card) => card.cardKey === cardKey) ?? null;
}
