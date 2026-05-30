import { describe, expect, test } from "vitest";

import { buildDreamRagChunks } from "../src/services/dream-rag-chunks";

describe("buildDreamRagChunks", () => {
  test("builds vector-ready chunks from localized symbol evidence", () => {
    const chunks = buildDreamRagChunks("ko");
    const hospitalChunks = chunks.filter((chunk) => chunk.symbolId === "hospital");

    expect(hospitalChunks.map((chunk) => chunk.chunkType)).toEqual(
      expect.arrayContaining(["searchText", "sceneModifier", "safeReading", "metaphorHook"]),
    );
    expect(hospitalChunks.find((chunk) => chunk.chunkType === "searchText")?.text).toContain("병원");
    expect(hospitalChunks.find((chunk) => chunk.chunkType === "safeReading")?.text).toContain("돌봄");
    expect(hospitalChunks.every((chunk) => chunk.locale === "ko")).toBe(true);
    expect(hospitalChunks.every((chunk) => chunk.label === "병원")).toBe(true);
  });

  test("keeps chunk ids stable and unique", () => {
    const chunks = buildDreamRagChunks("en");
    const chunkIds = chunks.map((chunk) => chunk.chunkId);

    expect(new Set(chunkIds).size).toBe(chunkIds.length);
    expect(chunkIds).toContain("hospital:en:searchText");
    expect(chunkIds.some((chunkId) => chunkId.startsWith("hospital:en:sceneModifier:"))).toBe(true);
  });
});
