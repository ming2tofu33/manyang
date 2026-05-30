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
export const dreamSensationMaxSelection = 2;

export const dreamAtmosphereOptions: DreamEntryOption[] = [
  { id: "dark", label: "어두움", icon: "moon" },
  { id: "warm", label: "따뜻함", icon: "sparkles" },
  { id: "quiet", label: "조용함", icon: "feather" },
  { id: "fast", label: "두려움", icon: "lantern" },
  { id: "unfamiliar", label: "낯섦", icon: "crystalBall" },
  { id: "complex", label: "복잡함", icon: "crystals" },
  { id: "hazy", label: "흐릿함", icon: "cloud" },
  { id: "dreamlike", label: "몽환적", icon: "sparkles" },
];

export const dreamSensationOptions: DreamEntryOption[] = [
  { id: "vivid", label: "선명함", icon: "star" },
  { id: "hazy", label: "흐릿함", icon: "cloud" },
  { id: "heavy", label: "무거움", icon: "key" },
  { id: "light", label: "가벼움", icon: "feather" },
  { id: "cold", label: "차가움", icon: "crystals" },
  { id: "warm", label: "온기", icon: "sparkles" },
  { id: "sound", label: "소리", icon: "potion" },
  { id: "movement", label: "움직임", icon: "paw" },
];

export function createDreamMoodLabel(
  dreamAtmosphere: string | null | undefined,
  dreamSensations: string[],
): string | undefined {
  const parts = [
    dreamAtmosphere ? `분위기: ${dreamAtmosphere}` : "",
    dreamSensations.length > 0 ? `감각: ${dreamSensations.join(", ")}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : undefined;
}
