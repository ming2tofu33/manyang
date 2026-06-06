import type { KeywordIconName } from "./manyang-assets";

type NightCheckInOption = {
  id: string;
  label: string;
  icon: KeywordIconName;
};

export const nightCheckInRoute = "/night";
export const legacyDreamSeedRoute = "/seed";
export const nightCheckInBackground = "/manyang/backgrounds/dreamseed-background-black-cat-v2.webp";
export const nightCheckInNoteMaxLength = 100;

export const nightCheckInCopy = {
  homeCta: "밤의 기록 남기기",
  pageTitle: "밤의 기록",
  pageSubtitle: "잠들기 전의 마음과 몸 상태를 짧게 남겨요.",
  heroKicker: "하루의 마지막 체크인",
  heroTitleLines: ["오늘의 기분이", "내일 꿈 해몽의 단서가 돼요"],
  helper: "오늘의 기분이 내일 꿈 해몽의 작은 단서가 돼요.",
  moodTitle: "오늘 하루의 기분은 어땠나요?",
  conditionTitle: "지금 몸 컨디션은 어떤가요?",
  noteLabel: "짧게 남기고 싶은 말",
  optionalLabel: "(선택)",
  notePlaceholder: "예: 오늘은 그냥 조금 피곤했어요.",
  noteHint: "내일 꿈을 읽을 때 참고할 하루의 가벼운 메모예요.",
  savedTitle: "오늘 밤의 기록을 남겼어요.",
  submit: "밤의 기록 남기기",
  submitAgain: "밤의 기록 다시 남기기",
  footer: "아침에 꿈이 떠오르면, 이 기록과 함께 꿈 영수증을 풀어볼 수 있어요.",
} as const;

export const nightCheckInMoods = [
  { id: "calm", label: "편안함", icon: "relaxed" },
  { id: "tired", label: "지침", icon: "wornOut" },
  { id: "anxious", label: "불안함", icon: "anxious" },
  { id: "excited", label: "설렘", icon: "excited" },
  { id: "low", label: "가라앉음", icon: "low" },
  { id: "mixed", label: "복잡함", icon: "complex" },
  { id: "proud", label: "뿌듯함", icon: "relieved" },
  { id: "lonely", label: "외로움", icon: "lonely" },
  { id: "neutral", label: "무덤덤함", icon: "empty" },
] as const satisfies readonly NightCheckInOption[];

export const nightCheckInConditions = [
  { id: "light", label: "가벼움", icon: "lightBody" },
  { id: "heavy", label: "무거움", icon: "heavy" },
  { id: "tense", label: "긴장됨", icon: "tense" },
  { id: "sleepy", label: "졸림", icon: "drowsy" },
  { id: "sensitive", label: "예민함", icon: "sensitive" },
  { id: "okay", label: "괜찮음", icon: "okay" },
] as const satisfies readonly NightCheckInOption[];

export type NightCheckInMoodId = (typeof nightCheckInMoods)[number]["id"];
export type NightCheckInConditionId = (typeof nightCheckInConditions)[number]["id"];

export const defaultNightCheckInMood = nightCheckInMoods[0];
export const defaultNightCheckInCondition = nightCheckInConditions[5];

export function getNightCheckInMoodById(moodId: string) {
  return nightCheckInMoods.find((mood) => mood.id === moodId);
}

export function getNightCheckInConditionById(conditionId: string) {
  return nightCheckInConditions.find((condition) => condition.id === conditionId);
}
