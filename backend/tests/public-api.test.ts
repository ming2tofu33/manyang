import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  analyzeDreamStructure,
  findRuntimeSymbolMatches,
  getRuntimeSymbolEntries,
  scoreRetrievalCandidate,
  SUPPORTED_LOCALES,
} from "../src";

describe("backend public API", () => {
  it("re-exports shared dream transport contracts", () => {
    const source = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

    expect(source).toContain('from "@manyang/contracts/dream"');
  });

  it("exports runtime encyclopedia and retrieval helpers", () => {
    expect(SUPPORTED_LOCALES).toEqual(["ko", "en"]);
    expect(getRuntimeSymbolEntries("ko").length).toBeGreaterThanOrEqual(10);
    expect(findRuntimeSymbolMatches("큰 구렁이를 보는 꿈을 꿨어", { locale: "ko" })[0]?.entryId).toBe("snake");
    expect(
      scoreRetrievalCandidate({
        matchType: "exact",
        source: "explicit",
        importance: 5,
        hasEvidenceText: true,
        hasSceneModifier: false,
        localeMatches: true,
      }),
    ).toBeGreaterThanOrEqual(0.95);
  });

  it("exports the structured analysis stage", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "학교 복도에서 교실을 찾았어",
      locale: "ko",
    });

    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["school", "corridor", "searching"]),
    );
  });
});
