import type { EncyclopediaSearchMainCategory } from "@/lib/encyclopedia-search";
import { manyangAssets } from "@/lib/manyang-assets";

export const encyclopediaCategoryIconMap: Record<EncyclopediaSearchMainCategory, string> = {
  place: manyangAssets.semanticIcons.door,
  person: manyangAssets.actionIcons.profile,
  animal: manyangAssets.semanticIcons.paw,
  nature: manyangAssets.semanticIcons.moon,
  object: manyangAssets.semanticIcons.key,
  body: manyangAssets.actionIcons.profile,
  action: manyangAssets.semanticIcons.sparkles,
  event: manyangAssets.semanticIcons.star,
  food: manyangAssets.semanticIcons.sparkles,
  emotion: manyangAssets.semanticIcons.cloud,
  abstract: manyangAssets.semanticIcons.crystalBall,
};

export function getEncyclopediaCategoryIcon(category: EncyclopediaSearchMainCategory): string {
  return encyclopediaCategoryIconMap[category];
}
