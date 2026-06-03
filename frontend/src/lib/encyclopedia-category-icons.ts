import type { EncyclopediaSearchMainCategory } from "@/lib/encyclopedia-search";
import { manyangAssets } from "@/lib/manyang-assets";

export const encyclopediaCategoryIconMap: Record<EncyclopediaSearchMainCategory, string> = {
  place: manyangAssets.encyclopediaIcons.place,
  person: manyangAssets.encyclopediaIcons.person,
  animal: manyangAssets.encyclopediaIcons.animal,
  nature: manyangAssets.encyclopediaIcons.nature,
  object: manyangAssets.encyclopediaIcons.object,
  body: manyangAssets.encyclopediaIcons.body,
  action: manyangAssets.encyclopediaIcons.action,
  event: manyangAssets.encyclopediaIcons.event,
  food: manyangAssets.encyclopediaIcons.food,
  emotion: manyangAssets.encyclopediaIcons.emotion,
  abstract: manyangAssets.encyclopediaIcons.abstract,
};

export function getEncyclopediaCategoryIcon(category: EncyclopediaSearchMainCategory): string {
  return encyclopediaCategoryIconMap[category];
}
