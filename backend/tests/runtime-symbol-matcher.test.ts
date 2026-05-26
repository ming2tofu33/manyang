import { describe, expect, test } from "vitest";

import { findRuntimeSymbolMatches } from "../src/services/symbol-matcher";

describe("findRuntimeSymbolMatches", () => {
  test("returns scored runtime matches with evidence for the snake owned-land case", () => {
    const matches = findRuntimeSymbolMatches("우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.", {
      locale: "ko",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["snake", "owned_land", "many"]));

    const snake = matches.find((match) => match.entryId === "snake");
    expect(snake).toMatchObject({
      locale: "ko",
      label: "뱀",
      matchType: "exact",
      category: "animal",
    });
    expect(snake?.confidence).toBeGreaterThanOrEqual(0.82);
    expect(snake?.matchedText).toEqual(expect.arrayContaining(["뱀", "구렁이"]));
    expect(snake?.usedFields).toEqual(expect.arrayContaining(["aliases", "sceneModifiers.large", "sceneModifiers.many"]));
    expect(snake?.evidence.coreMeanings).toContain("생명력");
  });

  test("detects scene modifiers for a changing door without losing the canonical symbol", () => {
    const matches = findRuntimeSymbolMatches("학교 복도에서 문이 계속 바뀌는 꿈을 꿨어.", {
      locale: "ko",
      limit: 5,
    });

    const door = matches.find((match) => match.entryId === "door");

    expect(door?.matchType).toBe("exact");
    expect(door?.confidence).toBe(1);
    expect(door?.usedFields).toContain("sceneModifiers.changing");
    expect(door?.rankReason).toContain("scene modifier");
  });

  test("supports English aliases and localized evidence", () => {
    const matches = findRuntimeSymbolMatches("I walked down a long hallway toward a locked door.", {
      locale: "en",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["corridor", "door"]));
    expect(matches.find((match) => match.entryId === "corridor")?.label).toBe("Corridor");
    expect(matches.find((match) => match.entryId === "door")?.usedFields).toContain("sceneModifiers.locked");
  });
});
