import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, test } from "vitest";

import type { DreamEmbeddingProvider } from "../src/services/dream-embedding-provider";
import { buildDreamRagVectorIndexFile } from "../src/services/dream-rag-index-builder";
import { loadDreamVectorIndex } from "../src/services/dream-vector-index";

class FakeEmbeddingProvider implements DreamEmbeddingProvider {
  readonly model = "fake-embedding";

  async embedTexts(texts: string[]): Promise<number[][]> {
    return texts.map((text, index) => [index + 1, text.includes("병원") ? 1 : 0]);
  }
}

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("buildDreamRagVectorIndexFile", () => {
  test("builds and saves a localized dream RAG vector index file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "manyang-rag-builder-"));
    tempDirs.push(tempDir);
    const outputPath = join(tempDir, "dream-rag-ko.json");

    const result = await buildDreamRagVectorIndexFile({
      locale: "ko",
      outputPath,
      embeddingProvider: new FakeEmbeddingProvider(),
      createdAt: "2026-05-29T00:00:00.000Z",
    });
    const loaded = await loadDreamVectorIndex(outputPath);

    expect(result).toMatchObject({
      outputPath,
      locale: "ko",
      embeddingModel: "fake-embedding",
    });
    expect(result.chunkCount).toBeGreaterThan(30);
    expect(loaded.locale).toBe("ko");
    expect(loaded.embeddingModel).toBe("fake-embedding");
    expect(loaded.createdAt).toBe("2026-05-29T00:00:00.000Z");
    expect(loaded.items).toHaveLength(result.chunkCount);
  });
});
