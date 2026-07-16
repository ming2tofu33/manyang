import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("shared tarot boundary", () => {
  test("daily tarot re-exports its public contract types instead of defining them locally", () => {
    const source = readSource("./daily-tarot.ts");
    const sharedTypeNames = [
      "DailyTarotCardSelection",
      "DailyTarotGeneratedCardReading",
      "DailyTarotGeneratedReading",
      "DailyTarotOption",
      "DailyTarotPosition",
      "DailyTarotQuestionContext",
      "DailyTarotReading",
      "TarotOrientation",
      "TarotSpread",
      "TarotUnlockMethod",
    ] as const;

    expect(source).toContain('from "@manyang/contracts/tarot"');
    expect(source).not.toMatch(
      /export\s+type\s+(?:TarotOrientation|TarotSpread|TarotUnlockMethod|DailyTarotPosition|DailyTarotQuestionContext|DailyTarotReading)\b/,
    );

    const sharedTypeExports = Array.from(
      source.matchAll(/export\s+type\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/tarot";/g),
      (match) => match[1],
    ).join("\n");

    for (const typeName of sharedTypeNames) {
      expect(sharedTypeExports).toMatch(new RegExp(`\\b${typeName}\\b`));
    }
  });

  test.each([
    "./tarot-major-cards.ts",
    "./tarot-minor-cards.ts",
    "./tarot-cards.ts",
    "./tarot-question-prompts.ts",
  ])("%s remains a web adapter over shared tarot content", (relativePath) => {
    const source = readSource(relativePath);

    expect(source).toContain('from "@manyang/content/tarot"');
    expect(source).not.toMatch(/manyangAssets\.[A-Za-z]*tarot/i);
    expect(source).not.toMatch(/representativeQuestion\s*:/);
  });

  test("the tarot readings route validates with the shared request contract and runtime values", () => {
    const source = readSource("../app/api/tarot/readings/route.ts");
    const sharedContractImports = Array.from(
      source.matchAll(/import(?:\s+type)?\s*\{([^}]*)\}\s*from\s*"@manyang\/contracts\/tarot";/g),
      (match) => match[1],
    ).join("\n");

    for (const contractName of [
      "TAROT_ORIENTATIONS",
      "TAROT_POSITIONS",
      "TAROT_SPREADS",
      "TAROT_UNLOCK_METHODS",
      "DailyTarotReading",
      "TarotReadingRequest",
      "TarotSpread",
    ]) {
      expect(sharedContractImports).toMatch(new RegExp(`\\b${contractName}\\b`));
    }

    expect(source).not.toMatch(/type\s+TarotReading(?:SelectionRequest|RequestBody)\s*=/);
    expect(source).toMatch(/new\s+Set(?:<[^>]+>)?\(TAROT_SPREADS\)/);
    expect(source).toMatch(/new\s+Set(?:<[^>]+>)?\(TAROT_ORIENTATIONS\)/);
    expect(source).toMatch(/new\s+Set(?:<[^>]+>)?\(TAROT_POSITIONS\)/);
    expect(source).toMatch(/new\s+Set(?:<[^>]+>)?\(TAROT_UNLOCK_METHODS\)/);
  });
});
