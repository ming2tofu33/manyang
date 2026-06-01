// 해몽 엔진의 런타임 심볼(72개, ko/en)을 백과 브라우즈/SEO가 쓰는 EncyclopediaEntry 형태로
// 변환한다. 이걸로 레거시 hand-written encyclopedia(36개)를 대체해 단일 데이터셋으로 모은다.
import type { EncyclopediaEntry } from "../contracts/dream";
import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import { symbolEntries } from "../data/symbol-encyclopedia";

/**
 * 런타임 심볼을 locale별 EncyclopediaEntry 목록으로 변환한다.
 * slug=id, body=safeReading, 좋게/조심해서 = light/shadowReadings, relatedSymbols=관련 심볼 라벨.
 */
export function getEncyclopediaEntriesForLocale(locale: SupportedLocale = "ko"): EncyclopediaEntry[] {
  const labelById = new Map(symbolEntries.map((entry) => [entry.id, entry.locales[locale].label]));

  return symbolEntries
    .filter((entry) => entry.status === "active")
    .map((entry): EncyclopediaEntry => {
      const localized = entry.locales[locale];

      return {
        symbol: localized.label,
        slug: entry.id,
        category: entry.category,
        aliases: localized.aliases,
        coreMeanings: localized.coreMeanings,
        positiveReadings: localized.lightReadings,
        negativeReadings: localized.shadowReadings,
        contextQuestions: localized.contextQuestions,
        relatedSymbols: entry.relatedIds
          .map((id) => labelById.get(id))
          .filter((label): label is string => Boolean(label)),
        catInterpretationHint: localized.metaphorHooks[0] ?? localized.safeReading,
        body: localized.safeReading,
      };
    });
}
