import { describe, expect, test } from "vitest";

import type { DreamEmbeddingProvider } from "../src/services/dream-embedding-provider";
import { buildDreamRagChunks } from "../src/services/dream-rag-chunks";
import {
  retrieveDreamEvidenceSet,
  retrieveDreamEvidenceSetWithVectorIndex,
  retrieveDreamEvidence,
  retrieveDreamEvidenceWithVectorIndex,
} from "../src/services/dream-rag-retriever";
import { createDreamVectorIndex } from "../src/services/dream-vector-index";

class FakeEmbeddingProvider implements DreamEmbeddingProvider {
  readonly model = "fake-embedding";

  async embedTexts(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 0]);
  }
}

describe("retrieveDreamEvidence", () => {
  test("ranks explicit alias matches before supporting chunk matches", () => {
    const matches = retrieveDreamEvidence({
      dreamText: "꿈에서 병원 대기실에 있었고 확인을 기다렸어.",
      locale: "ko",
      limit: 3,
    });

    expect(matches[0]).toMatchObject({
      entryId: "hospital",
      label: "병원",
      matchType: "exact",
    });
    expect(matches[0]?.usedFields).toEqual(expect.arrayContaining(["aliases", "sceneModifiers.waiting"]));
  });

  test("retrieves symbol evidence from curated chunks when the exact alias is absent", () => {
    const evidence = retrieveDreamEvidenceSet({
      dreamText: "돌봄과 취약함이 크게 느껴졌고 확인을 기다리는 장소에 있는 느낌이었어.",
      locale: "ko",
      limit: 3,
    });

    expect(evidence.confirmedEvidence).toEqual([]);
    expect(evidence.candidateEvidence[0]).toMatchObject({
      entryId: "hospital",
      label: "병원",
      matchType: "semantic",
    });
    expect(evidence.candidateEvidence[0]?.usedFields).toEqual(
      expect.arrayContaining(["chunks.searchText", "chunks.sceneModifier.waiting"]),
    );
    expect(evidence.candidateEvidence[0]?.rankReason).toContain("RAG chunk");
  });

  test("keeps legacy retrieval API restricted to confirmed evidence", () => {
    const matches = retrieveDreamEvidence({
      dreamText: "돌봄과 취약함이 크게 느껴졌고 확인을 기다리는 장소에 있는 느낌이었어.",
      locale: "ko",
      limit: 3,
    });

    expect(matches).toEqual([]);
  });

  test("does not confirm disambiguated Korean homonym false positives", () => {
    const speechEvidence = retrieveDreamEvidenceSet({
      dreamText: "꿈에서 돼지가 나와서 나한테 말을 거는 꿈을 꿨어.",
      locale: "ko",
      limit: 5,
    });
    expect(speechEvidence.confirmedEvidence.map((match) => match.entryId)).toContain("pig");
    expect(speechEvidence.confirmedEvidence.map((match) => match.entryId)).not.toContain("horse");

    const teaEvidence = retrieveDreamEvidenceSet({
      dreamText: "차를 마시는 꿈을 꿨어.",
      locale: "ko",
      limit: 5,
    });
    expect(teaEvidence.confirmedEvidence.map((match) => match.entryId)).not.toContain("car");

    const stomachEvidence = retrieveDreamEvidenceSet({
      dreamText: "배가 아픈 꿈을 꿨어.",
      locale: "ko",
      limit: 5,
    });
    expect(stomachEvidence.confirmedEvidence.map((match) => match.entryId)).not.toContain("boat");

    const eyeEvidence = retrieveDreamEvidenceSet({
      dreamText: "눈이 나를 바라보는 꿈을 꿨어.",
      locale: "ko",
      limit: 5,
    });
    expect(eyeEvidence.confirmedEvidence.map((match) => match.entryId)).toContain("eye");
    expect(eyeEvidence.confirmedEvidence.map((match) => match.entryId)).not.toContain("snow");
  });

  test("confirms the specific apple symbol when the dream text means fruit", () => {
    const evidence = retrieveDreamEvidenceSet({
      dreamText: "빨간 사과를 먹는 꿈을 꿨어.",
      locale: "ko",
      limit: 5,
    });

    expect(evidence.confirmedEvidence.map((match) => match.entryId)).toContain("apple");
    expect(evidence.confirmedEvidence.find((match) => match.entryId === "apple")?.matchedText).toEqual(
      expect.arrayContaining(["사과", "빨간 사과", "사과를 먹"]),
    );
  });

  test("does not introduce broad semantic chunk symbols when explicit symbols are already present", () => {
    const evidence = retrieveDreamEvidenceSet({
      dreamText:
        "오늘 새벽에 우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어. 무섭기도 했고 이상하게 압도되는 느낌이었어.",
      locale: "ko",
      limit: 5,
    });

    expect(evidence.confirmedEvidence.map((match) => match.entryId).sort()).toEqual(
      ["many", "snake", "dawn", "owned_land"].sort(),
    );
    expect(evidence.candidateEvidence.map((match) => match.entryId)).not.toContain("fish");
  });

  test("surfaces strong new semantic symbols as candidates even when explicit symbols exist", () => {
    const evidence = retrieveDreamEvidenceSet({
      dreamText: "I saw a snake, then I waited for care and recovery while feeling vulnerable.",
      locale: "en",
      limit: 5,
      semanticCandidateLimit: 3,
    });

    expect(evidence.confirmedEvidence.map((match) => match.entryId)).toContain("snake");
    expect(evidence.confirmedEvidence.map((match) => match.entryId)).not.toContain("hospital");
    expect(evidence.candidateEvidence[0]).toMatchObject({
      entryId: "hospital",
      label: "Hospital",
      matchType: "semantic",
    });
    expect(evidence.candidateEvidence[0]?.usedFields).toEqual(
      expect.arrayContaining(["chunks.searchText", "chunks.sceneModifier.waiting"]),
    );
  });

  test("keeps optional vector-only matches as candidate evidence without confirming them", () => {
    const hospitalChunk = buildDreamRagChunks("ko").find((chunk) => chunk.chunkId === "hospital:ko:searchText")!;
    const evidence = retrieveDreamEvidenceSet({
      dreamText: "말로 설명하기 어려운 장면만 남았어.",
      locale: "ko",
      limit: 3,
      vectorMatches: [
        {
          ...hospitalChunk,
          score: 0.93,
        },
      ],
    });

    expect(evidence.confirmedEvidence).toEqual([]);
    expect(evidence.candidateEvidence[0]).toMatchObject({
      entryId: "hospital",
      label: "병원",
      matchType: "semantic",
      confidence: 0.93,
    });
    expect(evidence.candidateEvidence[0]?.usedFields).toContain("vector.searchText");
    expect(evidence.candidateEvidence[0]?.rankReason).toContain("vector index");
  });

  test("promotes non-sensitive new symbols when semantic chunks and vector search agree", async () => {
    const trainChunk = buildDreamRagChunks("en").find((chunk) => chunk.chunkId === "train:en:searchText")!;
    const seaChunk = buildDreamRagChunks("en").find((chunk) => chunk.chunkId === "sea:en:searchText")!;
    const vectorIndex = createDreamVectorIndex({
      locale: "en",
      embeddingModel: "fake-embedding",
      items: [
        { chunk: trainChunk, embedding: [1, 0] },
        { chunk: seaChunk, embedding: [0, 1] },
      ],
    });

    const evidence = await retrieveDreamEvidenceSetWithVectorIndex({
      dreamText: "I was carried by momentum on a fixed path with a strict schedule and no way to change direction.",
      locale: "en",
      limit: 5,
      vectorIndex,
      embeddingProvider: new FakeEmbeddingProvider(),
      semanticCandidateLimit: 3,
    });

    const train = evidence.confirmedEvidence.find((match) => match.entryId === "train");

    expect(train).toMatchObject({
      entryId: "train",
      label: "Train",
      matchType: "semantic",
    });
    expect(train?.rankReason).toContain("promoted by semantic/vector agreement");
    expect(evidence.candidateEvidence.map((match) => match.entryId)).not.toContain("train");
    expect(evidence.retrievalPolicy.confirmedRule).toContain("semantic/vector agreement");
  });

  test("embeds the retrieval query and searches a vector index", async () => {
    const chunks = buildDreamRagChunks("ko").filter((chunk) =>
      ["hospital:ko:searchText", "snake:ko:searchText"].includes(chunk.chunkId),
    );
    const vectorIndex = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "fake-embedding",
      items: [
        { chunk: chunks.find((chunk) => chunk.symbolId === "hospital")!, embedding: [1, 0] },
        { chunk: chunks.find((chunk) => chunk.symbolId === "snake")!, embedding: [0, 1] },
      ],
    });

    const evidence = await retrieveDreamEvidenceSetWithVectorIndex({
      dreamText: "말로 설명하기 어려운 장면만 남았어.",
      locale: "ko",
      limit: 3,
      vectorIndex,
      embeddingProvider: new FakeEmbeddingProvider(),
    });

    expect(evidence.confirmedEvidence).toEqual([]);
    expect(evidence.candidateEvidence[0]).toMatchObject({
      entryId: "hospital",
      label: "병원",
      confidence: 0.95,
    });
  });

  test("does not introduce unrelated vector symbols when explicit symbols are present", async () => {
    const chunks = buildDreamRagChunks("ko").filter((chunk) =>
      ["hospital:ko:searchText", "sea:ko:searchText"].includes(chunk.chunkId),
    );
    const vectorIndex = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "fake-embedding",
      items: [
        { chunk: chunks.find((chunk) => chunk.symbolId === "hospital")!, embedding: [1, 0] },
        { chunk: chunks.find((chunk) => chunk.symbolId === "sea")!, embedding: [1, 0] },
      ],
    });

    const matches = await retrieveDreamEvidenceWithVectorIndex({
      dreamText: "꿈에서 병원에 있었고 몸이 걱정됐어.",
      locale: "ko",
      limit: 5,
      vectorIndex,
      embeddingProvider: new FakeEmbeddingProvider(),
    });

    expect(matches.map((match) => match.entryId)).toContain("hospital");
    expect(matches.map((match) => match.entryId)).not.toContain("sea");
  });

  test("keeps vector-only retrieval conservative when no explicit symbol is present", async () => {
    const chunks = buildDreamRagChunks("ko").filter((chunk) =>
      ["hospital:ko:searchText", "sea:ko:searchText"].includes(chunk.chunkId),
    );
    const vectorIndex = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "fake-embedding",
      items: [
        { chunk: chunks.find((chunk) => chunk.symbolId === "hospital")!, embedding: [1, 0] },
        { chunk: chunks.find((chunk) => chunk.symbolId === "sea")!, embedding: [1, 0] },
      ],
    });

    const evidence = await retrieveDreamEvidenceSetWithVectorIndex({
      dreamText: "말로 설명하기 어려운 장면만 남았어.",
      locale: "ko",
      limit: 5,
      vectorIndex,
      embeddingProvider: new FakeEmbeddingProvider(),
    });

    expect(evidence.confirmedEvidence).toEqual([]);
    expect(evidence.candidateEvidence.map((match) => match.entryId)).toEqual(["hospital"]);
  });

  test("drops vector-only candidates below the trust threshold", async () => {
    const hospitalChunk = buildDreamRagChunks("ko").find((chunk) => chunk.chunkId === "hospital:ko:searchText")!;
    const vectorIndex = createDreamVectorIndex({
      locale: "ko",
      embeddingModel: "fake-embedding",
      items: [{ chunk: hospitalChunk, embedding: [1, 0] }],
    });

    const evidence = await retrieveDreamEvidenceSetWithVectorIndex({
      dreamText: "말로 설명하기 어려운 장면만 남았어.",
      locale: "ko",
      limit: 5,
      vectorIndex,
      embeddingProvider: new FakeEmbeddingProvider(),
      vectorMinScore: 0.35,
      vectorCandidateMinScore: 0.96,
    });

    expect(evidence.confirmedEvidence).toEqual([]);
    expect(evidence.candidateEvidence).toEqual([]);
  });
});
