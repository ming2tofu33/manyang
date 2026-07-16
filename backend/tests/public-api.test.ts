import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as backendPublicApi from "../src";
import {
  analyzeDreamStructure,
  buildTarotReadingPrompt,
  findRuntimeSymbolMatches,
  generateTarotReadingForUser,
  getRuntimeSymbolEntries,
  scoreRetrievalCandidate,
  SUPPORTED_LOCALES,
} from "../src";
import {
  TAROT_ARCANAS as SHARED_TAROT_ARCANAS,
  TAROT_MINOR_RANKS as SHARED_TAROT_MINOR_RANKS,
  TAROT_MINOR_SUITS as SHARED_TAROT_MINOR_SUITS,
  TAROT_ORIENTATIONS as SHARED_TAROT_ORIENTATIONS,
  TAROT_POSITIONS as SHARED_TAROT_POSITIONS,
  TAROT_SPREADS as SHARED_TAROT_SPREADS,
  TAROT_UNLOCK_METHODS as SHARED_TAROT_UNLOCK_METHODS,
} from "@manyang/contracts/tarot";

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

const TAROT_PUBLIC_TYPE_NAMES = [
  "DailyTarotCardSelection",
  "DailyTarotGeneratedCardReading",
  "DailyTarotGeneratedReading",
  "DailyTarotOption",
  "DailyTarotPosition",
  "DailyTarotQuestionContext",
  "DailyTarotReading",
  "TarotArcana",
  "TarotCard",
  "TarotCardContent",
  "TarotCardContexts",
  "TarotCardMeaning",
  "TarotCardSymbolMeaning",
  "TarotMajorCardContent",
  "TarotMajorCardSnapshot",
  "TarotMinorCardContent",
  "TarotMinorCardSnapshot",
  "TarotMinorRank",
  "TarotMinorSuit",
  "TarotOrientation",
  "TarotPromptCardMeaning",
  "TarotQuestionPrompt",
  "TarotQuestionState",
  "TarotQuestionStateKey",
  "TarotReadingOrientation",
  "TarotReadingPosition",
  "TarotReadingRequest",
  "TarotReadingSelectionRequest",
  "TarotReadingSpread",
  "TarotSpread",
  "TarotUnlockMethod",
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

  it("directly re-exports the shared tarot contract while retaining backend services", () => {
    const publicIndexSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
    const directTypeExports = Array.from(
      publicIndexSource.matchAll(
        /export\s+type\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/tarot";/g,
      ),
      (match) => match[1],
    ).join("\n");
    const directRuntimeExports = Array.from(
      publicIndexSource.matchAll(
        /export\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/tarot";/g,
      ),
      (match) => match[1],
    ).join("\n");

    for (const typeName of TAROT_PUBLIC_TYPE_NAMES) {
      expect(directTypeExports).toMatch(new RegExp(`\\b${typeName}\\b`));
    }

    for (const runtimeName of [
      "TAROT_ARCANAS",
      "TAROT_MINOR_RANKS",
      "TAROT_MINOR_SUITS",
      "TAROT_ORIENTATIONS",
      "TAROT_POSITIONS",
      "TAROT_SPREADS",
      "TAROT_UNLOCK_METHODS",
    ]) {
      expect(directRuntimeExports).toMatch(new RegExp(`\\b${runtimeName}\\b`));
    }

    const tarotRuntimeExports = backendPublicApi as Record<string, unknown>;

    expect(tarotRuntimeExports.TAROT_ARCANAS).toBe(SHARED_TAROT_ARCANAS);
    expect(tarotRuntimeExports.TAROT_MINOR_RANKS).toBe(SHARED_TAROT_MINOR_RANKS);
    expect(tarotRuntimeExports.TAROT_MINOR_SUITS).toBe(SHARED_TAROT_MINOR_SUITS);
    expect(tarotRuntimeExports.TAROT_ORIENTATIONS).toBe(SHARED_TAROT_ORIENTATIONS);
    expect(tarotRuntimeExports.TAROT_POSITIONS).toBe(SHARED_TAROT_POSITIONS);
    expect(tarotRuntimeExports.TAROT_SPREADS).toBe(SHARED_TAROT_SPREADS);
    expect(tarotRuntimeExports.TAROT_UNLOCK_METHODS).toBe(SHARED_TAROT_UNLOCK_METHODS);
    expect(buildTarotReadingPrompt).toBeTypeOf("function");
    expect(generateTarotReadingForUser).toBeTypeOf("function");
    expect(publicIndexSource).toContain('from "./services/llm-provider"');
  });

  it("keeps shared prompt dependencies separate from local provider result types", () => {
    const promptSource = readFileSync(
      new URL("../src/services/tarot-reading-prompt.ts", import.meta.url),
      "utf8",
    );
    const llmSource = readFileSync(
      new URL("../src/services/llm-tarot-reading.ts", import.meta.url),
      "utf8",
    );

    expect(promptSource).toContain('from "@manyang/contracts/tarot"');
    expect(promptSource).not.toMatch(
      /export\s+type\s+(?:TarotReadingSpread|TarotReadingPosition|TarotReadingOrientation|TarotCardSymbolMeaning|TarotPromptCardMeaning)\s*=\s*(?:\{|(?:"|'))/,
    );
    expect(llmSource).toContain('from "@manyang/contracts/tarot"');
    expect(llmSource).not.toMatch(/\bDailyTarotGenerated(?:CardReading|Reading)\b/);

    const generatedCardReadingType = llmSource.match(
      /export\s+type\s+TarotGeneratedCardReading\s*=\s*\{([\s\S]*?)\n\};/,
    )?.[1];
    const generatedReadingType = llmSource.match(
      /export\s+type\s+TarotGeneratedReading\s*=\s*\{([\s\S]*?)\n\};/,
    )?.[1];

    expect(generatedCardReadingType).toMatch(/position:\s*TarotReadingPosition;/);
    expect(generatedCardReadingType).toMatch(/heading:\s*string;/);
    expect(generatedCardReadingType).toMatch(/reading:\s*string;/);
    expect(
      Array.from(generatedReadingType?.matchAll(/^\s+(\w+):/gm) ?? [], (match) => match[1]),
    ).toEqual(["title", "overview", "keywords", "cardReadings"]);
    expect(llmSource).not.toMatch(/}\s+as\s+TarotGeneratedReading;/);
    expect(llmSource).not.toMatch(
      /return\s+value\s*===\s*"today"\s*\|\|\s*value\s*===\s*"situation"/,
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
