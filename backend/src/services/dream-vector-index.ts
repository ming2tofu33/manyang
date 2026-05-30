import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { SupportedLocale } from "../contracts/symbol-encyclopedia";
import type { DreamRagChunk } from "./dream-rag-chunks";

export type DreamVectorIndexItem = {
  chunk: DreamRagChunk;
  embedding: number[];
};

export type DreamVectorIndex = {
  version: 1;
  locale: SupportedLocale;
  embeddingModel: string;
  createdAt: string;
  items: DreamVectorIndexItem[];
};

export type CreateDreamVectorIndexInput = {
  locale: SupportedLocale;
  embeddingModel: string;
  items: DreamVectorIndexItem[];
  createdAt?: string;
};

export type DreamVectorSearchResult = DreamRagChunk & {
  score: number;
};

export type DreamVectorSearchOptions = {
  limit?: number;
  minScore?: number;
};

type DreamVectorIndexLoader = (filePath: string) => Promise<DreamVectorIndex>;

export type LoadCachedDreamVectorIndexOptions = {
  loader?: DreamVectorIndexLoader;
};

const dreamVectorIndexCache = new Map<string, Promise<DreamVectorIndex>>();

function dotProduct(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
}

function magnitude(values: number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const denominator = magnitude(left) * magnitude(right);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct(left, right) / denominator;
}

export function createDreamVectorIndex(input: CreateDreamVectorIndexInput): DreamVectorIndex {
  return {
    version: 1,
    locale: input.locale,
    embeddingModel: input.embeddingModel,
    createdAt: input.createdAt ?? new Date().toISOString(),
    items: input.items,
  };
}

export function searchDreamVectorIndex(
  index: DreamVectorIndex,
  queryEmbedding: number[],
  options: DreamVectorSearchOptions = {},
): DreamVectorSearchResult[] {
  const limit = options.limit ?? 5;
  const minScore = options.minScore ?? -1;

  return index.items
    .map((item) => ({
      ...item.chunk,
      score: Number(cosineSimilarity(queryEmbedding, item.embedding).toFixed(6)),
    }))
    .filter((result) => result.score >= minScore)
    .sort((left, right) => right.score - left.score || left.chunkId.localeCompare(right.chunkId))
    .slice(0, limit);
}

export async function saveDreamVectorIndex(index: DreamVectorIndex, filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

export async function loadDreamVectorIndex(filePath: string): Promise<DreamVectorIndex> {
  return JSON.parse(await readFile(filePath, "utf8")) as DreamVectorIndex;
}

export async function loadCachedDreamVectorIndex(
  filePath: string,
  options: LoadCachedDreamVectorIndexOptions = {},
): Promise<DreamVectorIndex> {
  const normalizedPath = resolve(filePath);
  const cached = dreamVectorIndexCache.get(normalizedPath);

  if (cached) {
    return cached;
  }

  const loader = options.loader ?? loadDreamVectorIndex;
  const loadPromise = loader(normalizedPath).catch((error: unknown) => {
    dreamVectorIndexCache.delete(normalizedPath);
    throw error;
  });
  dreamVectorIndexCache.set(normalizedPath, loadPromise);

  return loadPromise;
}

export function clearDreamVectorIndexCacheForTests(): void {
  dreamVectorIndexCache.clear();
}
