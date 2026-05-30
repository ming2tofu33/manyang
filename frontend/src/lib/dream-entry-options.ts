export type DreamEntryOption = {
  id: string;
  label: string;
  icon:
    | "cloud"
    | "crystalBall"
    | "crystals"
    | "feather"
    | "key"
    | "lantern"
    | "moon"
    | "paw"
    | "potion"
    | "sparkles"
    | "star";
};

export const dreamEntryMaxLength = 1000;
export const dreamAtmosphereMaxSelection = 2;
export const dreamSensationMaxSelection = 2;
export const dreamSensationOtherMaxLength = 20;

// 꿈 분위기: 꿈 자체의 정서 톤(감정 축). 긍정→양가→부정→기묘 순, 최대 2개 선택.
export const dreamAtmosphereOptions: DreamEntryOption[] = [
  { id: "calm", label: "평온함", icon: "feather" },
  { id: "warm", label: "따뜻함", icon: "sparkles" },
  { id: "excited", label: "설렘", icon: "star" },
  { id: "wistful", label: "그리움", icon: "moon" },
  { id: "anxious", label: "불안함", icon: "crystals" },
  { id: "fearful", label: "두려움", icon: "lantern" },
  { id: "sad", label: "슬픔", icon: "potion" },
  { id: "angry", label: "분노", icon: "key" },
  { id: "ashamed", label: "부끄러움", icon: "paw" },
  { id: "stifling", label: "답답함", icon: "cloud" },
  { id: "confused", label: "혼란스러움", icon: "crystalBall" },
  { id: "eerie", label: "묘함", icon: "crystalBall" },
];

// 꿈 감각: 꿈에서의 몸·지각 체험. 선명도/압박/운동/체온 + 쫓김(고신호).
// falling·floating·chased는 백과사전의 falling·flying·being_chased 심볼과 직결된다.
// 나머지 롱테일은 '그 외(직접 입력)'로 받는다.
export const dreamSensationOptions: DreamEntryOption[] = [
  { id: "vivid", label: "선명함", icon: "star" },
  { id: "hazy", label: "흐릿함", icon: "cloud" },
  { id: "heavy", label: "무거움", icon: "key" },
  { id: "stuck", label: "갇힌 느낌", icon: "crystals" },
  { id: "falling", label: "떨어지는 느낌", icon: "potion" },
  { id: "floating", label: "떠다니는 느낌", icon: "feather" },
  { id: "chased", label: "쫓기는 느낌", icon: "lantern" },
  { id: "cold", label: "차가움", icon: "crystalBall" },
  { id: "warmth", label: "온기", icon: "sparkles" },
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
