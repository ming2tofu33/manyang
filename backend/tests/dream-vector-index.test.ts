import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, test } from "vitest";

import { buildDreamRagChunks } from "../src/services/dream-rag-chunks";
import {
  clearDreamVectorIndexCacheForTests,
  createDreamVectorIndex,
  loadCachedDreamVectorIndex,
  loadDreamVectorIndex,
  saveDreamVectorIndex,
  searchDreamVectorIndex,
} from "../src/services/dream-vector-index";

let tempDirs: string[] = [];

afterEach(async () => {
  clearDreamVectorIndexCacheForTests();
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("dream vector index", () => {
  test("searches chunks by cosine similarity", () => {
    const chunks = buildDreamRagChunks("ko").filter((chunk) =>
      ["hospital:ko:searchText", "snake:ko:searchText"].includes(chunk.chunkId),
    );
    const index = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "test-embedding",
      items: [
        { chunk: chunks.find((chunk) => chunk.symbolId === "hospital")!, embedding: [1, 0, 0] },
        { chunk: chunks.find((chunk) => chunk.symbolId === "snake")!, embedding: [0, 1, 0] },
      ],
    });

    const results = searchDreamVectorIndex(index, [0.9, 0.1, 0], { limit: 2 });

    expect(results[0]).toMatchObject({
      symbolId: "hospital",
      label: "병원",
    });
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  test("persists and reloads an index as JSON", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "manyang-vector-index-"));
    tempDirs.push(tempDir);
    const indexPath = join(tempDir, "dream-rag-ko.json");
    const chunk = buildDreamRagChunks("ko").find((candidate) => candidate.chunkId === "hospital:ko:searchText")!;
    const index = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "test-embedding",
      items: [{ chunk, embedding: [1, 0, 0] }],
    });

    await saveDreamVectorIndex(index, indexPath);
    const loaded = await loadDreamVectorIndex(indexPath);

    expect(loaded).toEqual(index);
  });

  test("caches loaded vector indexes by normalized file path", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "manyang-vector-index-"));
    tempDirs.push(tempDir);
    const indexPath = join(tempDir, "dream-rag-ko.json");
    const chunk = buildDreamRagChunks("ko").find((candidate) => candidate.chunkId === "hospital:ko:searchText")!;
    const index = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "test-embedding",
      items: [{ chunk, embedding: [1, 0, 0] }],
    });
    let loadCount = 0;

    const first = await loadCachedDreamVectorIndex(indexPath, {
      loader: async () => {
        loadCount += 1;
        return index;
      },
    });
    const second = await loadCachedDreamVectorIndex(indexPath, {
      loader: async () => {
        loadCount += 1;
        return createDreamVectorIndex({
          locale: "ko",
          embeddingModel: "should-not-load",
          items: [],
        });
      },
    });

    expect(first).toBe(index);
    expect(second).toBe(index);
    expect(loadCount).toBe(1);
  });
});
