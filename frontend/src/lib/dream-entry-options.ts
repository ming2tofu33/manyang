import type { KeywordIconName } from "./manyang-assets";

export type DreamEntryOption = {
  id: string;
  label: string;
  icon: KeywordIconName;
};

export const dreamEntryMaxLength = 1000;
export const dreamAtmosphereMaxSelection = 2;
export const dreamSensationMaxSelection = 2;
export const dreamSensationOtherMaxLength = 20;

// 꿈 분위기: 3열 x 5줄 기준. 감정, 장면 결, 꿈 특유의 낯선 분위기가 겹치지 않게 섞는다.
export const dreamAtmosphereOptions: DreamEntryOption[] = [
  { id: "calm", label: "평온함", icon: "peaceful" },
  { id: "warm", label: "따뜻함", icon: "warm" },
  { id: "excited", label: "설렘", icon: "excited" },
  { id: "wistful", label: "그리움", icon: "wistful" },
  { id: "sad", label: "슬픔", icon: "sad" },
  { id: "lonely", label: "쓸쓸함", icon: "lonely" },
  { id: "anxious", label: "불안함", icon: "anxious" },
  { id: "fearful", label: "두려움", icon: "fearful" },
  { id: "stifling", label: "답답함", icon: "stifling" },
  { id: "unfamiliar", label: "낯섦", icon: "unfamiliar" },
  { id: "eerie", label: "묘함", icon: "eerie" },
  { id: "mystical", label: "신비함", icon: "mystical" },
  { id: "hazy", label: "흐릿함", icon: "hazy" },
  { id: "complex", label: "복잡함", icon: "complex" },
  { id: "unpleasant", label: "불쾌함", icon: "unpleasant" },
];

// 꿈 감각: 꿈속의 몸감각과 체험감. 나머지는 직접 입력으로 받는다.
export const dreamSensationOptions: DreamEntryOption[] = [
  { id: "vivid", label: "선명함", icon: "vivid" },
  { id: "hazy", label: "흐릿함", icon: "hazy" },
  { id: "heavy", label: "무거움", icon: "heavy" },
  { id: "stuck", label: "갇힘", icon: "stuck" },
  { id: "falling", label: "떨어짐", icon: "falling" },
  { id: "floating", label: "떠다님", icon: "floating" },
  { id: "chased", label: "쫓김", icon: "chased" },
  { id: "cold", label: "차가움", icon: "cold" },
  { id: "warmth", label: "따뜻함", icon: "warm" },
];

export function createDreamMoodLabel(
  dreamAtmospheres: string[],
  dreamSensations: string[],
): string | undefined {
  const parts = [
    dreamAtmospheres.length > 0 ? `분위기: ${dreamAtmospheres.join(", ")}` : "",
    dreamSensations.length > 0 ? `감각: ${dreamSensations.join(", ")}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : undefined;
}
