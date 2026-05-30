import { describe, expect, test } from "vitest";

import type { DreamEmbeddingProvider } from "../src/services/dream-embedding-provider";
import { buildDreamRagChunks } from "../src/services/dream-rag-chunks";
import { ingestDreamRagVectorIndex } from "../src/services/dream-rag-ingestion";

class FakeEmbeddingProvider implements DreamEmbeddingProvider {
  readonly model = "fake-embedding";
  readonly calls: string[][] = [];

  async embedTexts(texts: string[]): Promise<number[][]> {
    this.calls.push(texts);
    return texts.map((text) => [text.length, text.includes("병원") ? 1 : 0, text.includes("뱀") ? 1 : 0]);
  }
}

describe("ingestDreamRagVectorIndex", () => {
  test("embeds localized RAG chunks into a vector index", async () => {
    const provider = new FakeEmbeddingProvider();
    const index = await ingestDreamRagVectorIndex({
      locale: "ko",
      embeddingProvider: provider,
    });
    const chunks = buildDreamRagChunks("ko");

    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]).toHaveLength(chunks.length);
    expect(index.locale).toBe("ko");
    expect(index.embeddingModel).toBe("fake-embedding");
    expect(index.items).toHaveLength(chunks.length);
    expect(index.items.find((item) => item.chunk.chunkId === "hospital:ko:searchText")?.embedding).toEqual(
      expect.arrayContaining([expect.any(Number), 1]),
    );
  });
});
