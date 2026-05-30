import { describe, expect, test } from "vitest";

import { analyzeDreamSafetyPolicy } from "../src/services/dream-safety-policy";
import { retrieveDreamEvidence, retrieveDreamEvidenceSet } from "../src/services/dream-rag-retriever";
import { buildEvidenceGate } from "../src/services/evidence-gate";
import { analyzeDreamStructure } from "../src/services/structured-dream-analysis";
import { findRuntimeSymbolMatches } from "../src/services/symbol-matcher";

describe("buildEvidenceGate", () => {
  test("separates retrieved symbols from scene-only unverified elements", () => {
    const request = {
      dreamText: "꿈에서 병원에 있었고 몸에서 피가 나는 것 같았어. 혹시 큰 병이나 암을 예지하는 꿈일까?",
      locale: "ko" as const,
    };
    const structuredAnalysis = analyzeDreamStructure(request);
    const matches = findRuntimeSymbolMatches(request.dreamText, { locale: request.locale, limit: 5 });
    const safetyPolicy = analyzeDreamSafetyPolicy(request);

    const gate = buildEvidenceGate({
      structuredAnalysis,
      matches,
      safetyPolicy,
    });

    expect(gate.verifiedSymbols.map((symbol) => symbol.label)).toContain("병원");
    expect(gate.verifiedSymbols.map((symbol) => symbol.label)).toContain("피");
    expect(gate.evidenceRules.canInterpretSymbolically).toContain("병원");
    expect(gate.evidenceRules.canInterpretSymbolically).toContain("피");
    expect(gate.unverifiedSceneElements).toEqual(expect.arrayContaining(["암", "큰 병"]));
    expect(gate.evidenceRules.sceneOnly).toEqual(expect.arrayContaining(["암", "큰 병"]));
    expect(gate.evidenceRules.sceneOnly).not.toContain("병원");
    expect(gate.evidenceRules.sceneOnly).not.toContain("피");
  });

  test("keeps structured candidates scene-only when retrieval does not verify them", () => {
    const request = {
      dreamText: "I was searching for something blurry, but I could not tell what it was.",
      locale: "en" as const,
    };
    const structuredAnalysis = analyzeDreamStructure(request);
    const gate = buildEvidenceGate({
      structuredAnalysis,
      matches: [],
      safetyPolicy: analyzeDreamSafetyPolicy(request),
    });

    expect(gate.verifiedSymbols).toEqual([]);
    expect(gate.unverifiedSceneElements).toContain("searching");
    expect(gate.evidenceRules.canInterpretSymbolically).toEqual([]);
  });

  test("does not verify safety terms that only appear as broad semantic matched text", () => {
    const request = {
      dreamText: "I dreamed I was bleeding in a hospital. Does this mean I have cancer?",
      locale: "en" as const,
    };
    const structuredAnalysis = analyzeDreamStructure(request);
    const matches = retrieveDreamEvidence({
      dreamText: request.dreamText,
      locale: request.locale,
      structuredAnalysis,
      limit: 5,
    });
    const gate = buildEvidenceGate({
      structuredAnalysis,
      matches,
      safetyPolicy: analyzeDreamSafetyPolicy(request),
    });

    expect(gate.verifiedSymbols.map((symbol) => symbol.label)).toEqual(expect.arrayContaining(["Blood", "Hospital"]));
    expect(gate.verifiedSymbols.flatMap((symbol) => symbol.matchedText)).not.toContain("cancer");
    expect(gate.evidenceRules.sceneOnly).toContain("cancer");
    expect(gate.evidenceRules.sceneOnly).not.toContain("bleeding");
    expect(gate.evidenceRules.canInterpretSymbolically).toEqual(expect.arrayContaining(["Blood", "Hospital"]));
  });

  test("keeps candidate evidence out of symbolic interpretation rules", () => {
    const request = {
      dreamText: "돌봄과 취약함이 크게 느껴졌고 확인을 기다리는 장소에 있는 느낌이었어.",
      locale: "ko" as const,
    };
    const structuredAnalysis = analyzeDreamStructure(request);
    const retrieval = retrieveDreamEvidenceSet({
      dreamText: request.dreamText,
      locale: request.locale,
      structuredAnalysis,
      limit: 5,
    });
    const gate = buildEvidenceGate({
      structuredAnalysis,
      matches: retrieval.confirmedEvidence,
      candidateMatches: retrieval.candidateEvidence,
      safetyPolicy: analyzeDreamSafetyPolicy(request),
    });

    expect(gate.verifiedSymbols).toEqual([]);
    expect(gate.evidenceRules.canInterpretSymbolically).not.toContain("병원");
    expect(gate.evidenceRules.sceneOnly).toContain("병원");
  });
});
