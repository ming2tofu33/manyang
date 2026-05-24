import { describe, expect, test } from "vitest";

import { findMatchingSymbols } from "../src/services/symbol-matcher.js";

describe("findMatchingSymbols", () => {
  test("matches canonical symbols from a Korean dream sentence", () => {
    const matches = findMatchingSymbols("낡은 학교 복도에서 신발을 잃어버렸어요.", {
      limit: 6,
    });

    expect(matches.map((match) => match.entry.symbol)).toEqual(
      expect.arrayContaining(["학교", "복도", "신발", "잃어버림"]),
    );
  });

  test("matches action aliases without requiring an exact canonical word", () => {
    const matches = findMatchingSymbols("어두운 방에서 열쇠를 찾고 있었어요.", {
      limit: 6,
    });

    expect(matches.map((match) => match.entry.symbol)).toEqual(
      expect.arrayContaining(["방", "열쇠", "찾기"]),
    );
  });

  test("does not match short symbols inside unrelated Korean words", () => {
    const matches = findMatchingSymbols("문득 비슷한 생각이 떠올랐어요.", {
      limit: 6,
    });

    expect(matches.map((match) => match.entry.symbol)).not.toContain("문");
    expect(matches.map((match) => match.entry.symbol)).not.toContain("비");
  });
});
