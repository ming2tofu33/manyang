import { symbolEntries } from "../data/symbol-encyclopedia";
import type {
  EmbeddingChunkType,
  SupportedLocale,
  SymbolCategory,
  SymbolEntry,
} from "../contracts/symbol-encyclopedia";

export type DreamRagChunk = {
  chunkId: string;
  symbolId: string;
  locale: SupportedLocale;
  chunkType: EmbeddingChunkType;
  label: string;
  aliases: string[];
  category: SymbolCategory;
  subcategory: string;
  text: string;
  metadata: {
    facets: string[];
    relatedIds: string[];
    safetyLevel: SymbolEntry["safetyLevel"];
    accessTier: SymbolEntry["accessTier"];
    modifierKey?: string;
  };
};

function compactTextParts(parts: string[]): string {
  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))].join(" ");
}

export function buildDreamRagChunks(locale: SupportedLocale): DreamRagChunk[] {
  return symbolEntries.flatMap((entry) => {
    const localized = entry.locales[locale];
    const base = {
      symbolId: entry.id,
      locale,
      label: localized.label,
      aliases: localized.aliases,
      category: entry.category,
      subcategory: entry.subcategory,
      metadata: {
        facets: entry.facets,
        relatedIds: entry.relatedIds,
        safetyLevel: entry.safetyLevel,
        accessTier: entry.accessTier,
      },
    };

    return [
      {
        ...base,
        chunkId: `${entry.id}:${locale}:searchText`,
        chunkType: "searchText" as const,
        text: compactTextParts([
          localized.label,
          ...localized.aliases,
          localized.searchText,
          ...localized.coreMeanings,
          ...localized.lightReadings,
          ...localized.shadowReadings,
        ]),
      },
      {
        ...base,
        chunkId: `${entry.id}:${locale}:safeReading`,
        chunkType: "safeReading" as const,
        text: compactTextParts([
          localized.label,
          localized.safeReading,
          ...localized.contextQuestions,
          ...localized.smallPrescriptions,
          ...localized.avoidExpressions,
        ]),
      },
      ...localized.metaphorHooks.map((hook, index) => ({
        ...base,
        chunkId: `${entry.id}:${locale}:metaphorHook:${index}`,
        chunkType: "metaphorHook" as const,
        text: compactTextParts([localized.label, hook, ...localized.coreMeanings]),
      })),
      ...Object.entries(localized.sceneModifiers).map(([modifierKey, modifier]) => ({
        ...base,
        chunkId: `${entry.id}:${locale}:sceneModifier:${modifierKey}`,
        chunkType: "sceneModifier" as const,
        text: compactTextParts([
          localized.label,
          modifier.reading,
          ...modifier.triggerTerms,
          ...localized.coreMeanings,
        ]),
        metadata: {
          ...base.metadata,
          modifierKey,
        },
      })),
    ];
  });
}
