import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import type { DreamEmbeddingProvider } from "./dream-embedding-provider";
import { buildDreamRagChunks } from "./dream-rag-chunks";
import { createDreamVectorIndex, type DreamVectorIndex } from "./dream-vector-index";

export type IngestDreamRagVectorIndexInput = {
  locale: SupportedLocale;
  embeddingProvider: DreamEmbeddingProvider;
  createdAt?: string;
};

export async function ingestDreamRagVectorIndex(input: IngestDreamRagVectorIndexInput): Promise<DreamVectorIndex> {
  const chunks = buildDreamRagChunks(input.locale);
  const embeddings = await input.embeddingProvider.embedTexts(chunks.map((chunk) => chunk.text));

  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, received ${embeddings.length}`);
  }

  return createDreamVectorIndex({
    locale: input.locale,
    embeddingModel: input.embeddingProvider.model,
    items: chunks.map((chunk, index) => ({
      chunk,
      embedding: embeddings[index] ?? [],
    })),
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  });
}
