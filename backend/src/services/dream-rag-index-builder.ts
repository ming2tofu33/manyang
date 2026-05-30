import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import type { DreamEmbeddingProvider } from "./dream-embedding-provider";
import { ingestDreamRagVectorIndex } from "./dream-rag-ingestion";
import { saveDreamVectorIndex } from "./dream-vector-index";

export type BuildDreamRagVectorIndexFileInput = {
  locale: SupportedLocale;
  outputPath: string;
  embeddingProvider: DreamEmbeddingProvider;
  createdAt?: string;
};

export type BuildDreamRagVectorIndexFileResult = {
  outputPath: string;
  locale: SupportedLocale;
  embeddingModel: string;
  chunkCount: number;
};

export async function buildDreamRagVectorIndexFile(
  input: BuildDreamRagVectorIndexFileInput,
): Promise<BuildDreamRagVectorIndexFileResult> {
  const index = await ingestDreamRagVectorIndex({
    locale: input.locale,
    embeddingProvider: input.embeddingProvider,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  });

  await saveDreamVectorIndex(index, input.outputPath);

  return {
    outputPath: input.outputPath,
    locale: index.locale,
    embeddingModel: index.embeddingModel,
    chunkCount: index.items.length,
  };
}
