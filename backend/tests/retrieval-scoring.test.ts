import { describe, expect, test } from "vitest";

import {
  classifyRetrievalMatch,
  scoreRetrievalCandidate,
} from "../src/services/retrieval-scoring";

describe("retrieval scoring", () => {
  test("ranks exact and alias matches above semantic matches for the same evidence", () => {
    const exact = scoreRetrievalCandidate({
      matchType: "exact",
      source: "explicit",
      importance: 5,
      hasEvidenceText: true,
      hasSceneModifier: false,
      localeMatches: true,
    });
    const alias = scoreRetrievalCandidate({
      matchType: "alias",
      source: "explicit",
      importance: 5,
      hasEvidenceText: true,
      hasSceneModifier: false,
      localeMatches: true,
    });
    const semantic = scoreRetrievalCandidate({
      matchType: "semantic",
      source: "explicit",
      importance: 5,
      hasEvidenceText: true,
      hasSceneModifier: false,
      localeMatches: true,
    });

    expect(exact).toBeGreaterThan(alias);
    expect(alias).toBeGreaterThan(semantic);
  });

  test("boosts direct evidence and matching scene modifiers into the primary range", () => {
    const confidence = scoreRetrievalCandidate({
      matchType: "alias",
      source: "explicit",
      importance: 5,
      hasEvidenceText: true,
      hasSceneModifier: true,
      localeMatches: true,
    });

    expect(confidence).toBe(1);
    expect(classifyRetrievalMatch({ confidence, matchType: "alias" })).toBe("primary");
  });

  test("penalizes inferred candidates without source evidence", () => {
    const withEvidence = scoreRetrievalCandidate({
      matchType: "semantic",
      source: "explicit",
      importance: 4,
      hasEvidenceText: true,
      hasSceneModifier: false,
      localeMatches: true,
    });
    const withoutEvidence = scoreRetrievalCandidate({
      matchType: "semantic",
      source: "inferred",
      importance: 4,
      hasEvidenceText: false,
      hasSceneModifier: false,
      localeMatches: true,
    });

    expect(withEvidence).toBeGreaterThan(withoutEvidence);
    expect(classifyRetrievalMatch({ confidence: withoutEvidence, matchType: "semantic" })).toBe("excluded");
  });

  test("never classifies fallback matches as primary", () => {
    const confidence = scoreRetrievalCandidate({
      matchType: "fallback",
      source: "explicit",
      importance: 5,
      hasEvidenceText: true,
      hasSceneModifier: true,
      localeMatches: true,
      selectedMoodMatches: true,
      repeatedSymbolBoost: 0.08,
    });

    expect(confidence).toBeGreaterThan(0.62);
    expect(classifyRetrievalMatch({ confidence, matchType: "fallback" })).toBe("excluded");
  });
});
