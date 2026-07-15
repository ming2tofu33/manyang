import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  analyzeDreamStructure,
  findRuntimeSymbolMatches,
  getRuntimeSymbolEntries,
  scoreRetrievalCandidate,
  SUPPORTED_LOCALES,
} from "../src";

const DREAM_TRANSPORT_TYPE_NAMES = [
  "CatReaderAccess",
  "CatReaderResponse",
  "CatReaderType",
  "DreamAnalysisRequest",
  "DreamAnalysisResponse",
  "DreamCardResponse",
  "DreamLocale",
  "DreamNightContext",
  "DreamSymbolCategory",
  "EncyclopediaEntry",
] as const;

describe("backend public API", () => {
  it("re-exports shared dream transport contracts", () => {
    const publicIndexSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
    const compatibilityShimSource = readFileSync(
      new URL("../src/contracts/dream.ts", import.meta.url),
      "utf8",
    );
    const directTypeExports = publicIndexSource.match(
      /export\s+type\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/dream";/,
    )?.[1];
    const shimTypeExports = compatibilityShimSource.match(
      /export\s+type\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/dream";/,
    )?.[1];
    const shimRuntimeExports = compatibilityShimSource.match(
      /export\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/dream";/,
    )?.[1];

    expect(directTypeExports).toBeDefined();
    expect(shimTypeExports).toBeDefined();
    for (const typeName of DREAM_TRANSPORT_TYPE_NAMES) {
      expect(directTypeExports).toMatch(new RegExp(`\\b${typeName}\\b`));
      expect(shimTypeExports).toMatch(new RegExp(`\\b${typeName}\\b`));
    }

    expect(publicIndexSource).not.toMatch(
      /export\s+type\s*\{[^}]*\}\s*from\s*"\.\/contracts\/dream";/,
    );
    expect(shimRuntimeExports).toMatch(/\bCAT_READER_TYPES\b/);
    expect(shimRuntimeExports).toMatch(/\bDREAM_LOCALES\b/);
    expect(compatibilityShimSource).not.toMatch(
      /^\s*(?:export\s+(?:default\s+)?)?(?:declare\s+)?(?:type|interface|const|(?:async\s+)?function|class)\s+\w/m,
    );
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
