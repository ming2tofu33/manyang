import type { KeywordIconName } from "./manyang-assets";

type MorningMoodOption = {
  id: string;
  label: string;
  icon: KeywordIconName;
};

export const morningMoodCopy = {
  pageTitle: "꿈의 발자국",
  pageSubtitle: "꿈은 흐릿해도 괜찮다냥.\n아침에 남은 느낌만 적어보자냥.",
  moodTitle: "아침에 일어났을 때 기분은 어땠나요?",
  bodyTitle: "몸은 어떤 느낌인가요?",
  thoughtTitle: "지금 떠오르는 단어 하나",
  thoughtPlaceholder: "예: 안개, 커피, 기다림, 조용함...",
  submit: "발자국 남기기",
  submitAgain: "발자국 다시 남기기",
  savedTitle: "오늘 아침의 발자국을 남겼어요.",
  savedDescription: "꿈이 사라져도 기분은 남아 있어요. 오늘의 발자국을 잠시 보관해두었습니다.",
  footer: "기록은 꿈 달력에 저장돼요.",
} as const;

// 아침 기분: 깨어난 후 '지금 내 정서'(꿈 분위기와 역할이 다름). 긍정→양가→부정→중립 순.
export const morningMoodOptions = [
  { id: "calm", label: "차분함", icon: "composed" },
  { id: "excited", label: "설렘", icon: "excited" },
  { id: "curious", label: "신기함", icon: "curious" },
  { id: "relieved", label: "후련함", icon: "relieved" },
  { id: "wistful", label: "그리움", icon: "wistful" },
  { id: "anxious", label: "불안함", icon: "anxious" },
  { id: "scared", label: "무서움", icon: "scared" },
  { id: "sad", label: "슬픔", icon: "sad" },
  { id: "irritated", label: "짜증남", icon: "irritated" },
  { id: "unsettled", label: "찝찝함", icon: "uneasy" },
  { id: "empty", label: "허전함", icon: "empty" },
  { id: "dazed", label: "멍함", icon: "dazed" },
] as const satisfies readonly MorningMoodOption[];

// 몸의 감각: 기상 직후 신체 상태. 활력/이완/무게/각성 + 뻐근함·식은땀(고신호).
// 두근거림·식은땀은 악몽·불안 꿈의 신체 마커로, 꿈 감각의 갇힘·쫓김과 연결된다.
export const morningBodyFeelings = [
  { id: "refreshed", label: "개운함", icon: "refreshed" },
  { id: "light", label: "가뿐함", icon: "lightEasy" },
  { id: "relaxed", label: "편안함", icon: "relaxed" },
  { id: "drowsy", label: "졸림", icon: "drowsy" },
  { id: "tired", label: "피곤함", icon: "tired" },
  { id: "heavy", label: "무거움", icon: "heavy" },
  { id: "tense", label: "긴장됨", icon: "tense" },
  { id: "racing", label: "두근거림", icon: "racing" },
  { id: "stiff", label: "뻐근함", icon: "stiff" },
  { id: "coldSweat", label: "식은땀", icon: "coldSweat" },
] as const satisfies readonly MorningMoodOption[];
