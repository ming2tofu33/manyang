import { isPaidAccessPlan, type AccessPlan } from "./access-policy";

const threeCardFreeEventFlag = process.env.NEXT_PUBLIC_TAROT_THREE_CARD_FREE_EVENT;

export const tarotThreeCardFreeEvent = {
  isActive: threeCardFreeEventFlag !== "0",
  label: "무료 이벤트",
  description: "이벤트 기간 동안 3장 리딩을 무료로 열어두고 있어요.",
} satisfies {
  isActive: boolean;
  label: string;
  description: string;
};

export function canUseTarotThreeCardReading(input: {
  accessPlan: AccessPlan;
  bypassAccessGate?: boolean;
  isAdmin?: boolean;
}): boolean {
  return (
    tarotThreeCardFreeEvent.isActive ||
    input.bypassAccessGate === true ||
    input.isAdmin === true ||
    isPaidAccessPlan(input.accessPlan)
  );
}
