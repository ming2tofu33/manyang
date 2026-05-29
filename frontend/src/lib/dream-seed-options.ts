export const dreamSeedRoute = "/seed";
export const dreamSeedBackground = "/manyang/backgrounds/dreamseed.webp";
export const dreamSeedNoteMaxLength = 100;
export const dreamSeedCustomIntentId = "custom";

export const dreamSeedCopy = {
  homeCta: "꿈 씨앗 심기",
  pageTitle: "꿈 씨앗 심기",
  pageSubtitle: "잠들기 전 내 마음에\n작은 꿈 씨앗을 심어보아요",
  heroKicker: "검은냥의 작은 주문",
  heroTitleLines: ["잠들기 전 내 마음에", "작은 꿈 씨앗을 심어보아요"],
  questionTitle: "오늘 밤 꿈에 남기고 싶은 건?",
  noteLabel: "꿈에게 남길 말",
  optionalLabel: "(선택)",
  notePlaceholder: "예: 요즘 내가 놓치고 있는 걸 보여줘...",
  noteHint: "질문, 보고 싶은 장면, 마음에 남은 바람을 짧게 남겨보세요.",
  atmosphereTitle: "원하는 꿈 분위기",
  savedTitle: "오늘 밤 씨앗을 심어두었어요.",
  submit: "꿈 씨앗 심기",
  submitAgain: "씨앗을 다시 심기",
  footer: "내일 아침, 꿈이 기억나면 이 씨앗과 함께 기록할 수 있어요.",
} as const;

export const dreamSeedIntents = [
  { id: "question", label: "지금 내 마음이 궁금해", acceptsNote: true },
  { id: "strange", label: "보고 싶은 장면이 있어", acceptsNote: true },
  { id: "project", label: "해결하고 싶은 일이 있어", acceptsNote: true },
  { id: "meet", label: "누군가를 다시 만나고 싶어", acceptsNote: true },
  { id: "comfort", label: "편안한 꿈을 꾸고 싶어", acceptsNote: true },
  { id: dreamSeedCustomIntentId, label: "그냥 꿈에게 맡길래", acceptsNote: true },
] as const;

export type DreamSeedIntentId = (typeof dreamSeedIntents)[number]["id"];

export const defaultDreamSeedIntent = dreamSeedIntents[0];

export const dreamSeedAtmospheres = ["편안한", "신비로운", "따뜻한", "이상한", "조용한"] as const;

export const defaultDreamSeedAtmosphere = dreamSeedAtmospheres[0];

export function getDreamSeedIntentById(intentId: string) {
  return dreamSeedIntents.find((intent) => intent.id === intentId);
}

export function doesDreamSeedIntentAcceptNote(intentId: string) {
  return getDreamSeedIntentById(intentId)?.acceptsNote ?? false;
}
