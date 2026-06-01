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
      subcategory: "animal",
    });
    expect(snake?.facets).toEqual(expect.arrayContaining(["reptile", "hidden_movement"]));
    expect(snake?.symbolRole).toContain("primary_candidate");
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
    expect(door?.confidence).toBeGreaterThanOrEqual(0.96);
    expect(door?.confidence).toBeLessThan(1);
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

  test("matches newly added everyday symbols with v0.2 metadata", () => {
    const matches = findRuntimeSymbolMatches("집에서 열쇠를 찾다가 가방과 신발을 잃어버렸어.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(
      expect.arrayContaining(["home", "key", "bag", "shoes", "lost_item"]),
    );
    expect(matches.find((match) => match.entryId === "key")).toMatchObject({
      category: "object",
      subcategory: "key_item",
    });
  });

  test("matches phase 2 coverage symbols for relationship, communication, and body details", () => {
    const matches = findRuntimeSymbolMatches("전 연인이 휴대폰으로 연락했는데 답장이 오지 않았고 치아가 빠졌어요.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["ex_partner", "phone", "teeth"]));
    expect(matches.find((match) => match.entryId === "phone")?.usedFields).toEqual(
      expect.arrayContaining(["aliases", "sceneModifiers.noReply"]),
    );
    expect(matches.find((match) => match.entryId === "teeth")).toMatchObject({
      category: "body",
      subcategory: "mouth",
    });
  });

  test("matches phase 2B coverage symbols for route, pursuit, and body-fluid details", () => {
    const matches = findRuntimeSymbolMatches("긴 길을 따라 다리를 건너는데 누군가에게 쫓기다가 피를 봤어요.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(
      expect.arrayContaining(["road", "bridge", "being_chased", "blood"]),
    );
    expect(matches.find((match) => match.entryId === "being_chased")?.category).toBe("action");
    expect(matches.find((match) => match.entryId === "blood")?.usedFields).toEqual(
      expect.arrayContaining(["aliases"]),
    );
  });

  test("matches real UTF-8 Korean dream text with particles and spacing", () => {
    const matches = findRuntimeSymbolMatches("내 땅에 큰 구렁이와 뱀이 수십 마리 나왔어.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(
      expect.arrayContaining(["snake", "owned_land", "many"]),
    );
    expect(matches.find((match) => match.entryId === "snake")?.matchedText).toEqual(
      expect.arrayContaining(["뱀", "구렁이"]),
    );
    expect(matches.find((match) => match.entryId === "owned_land")?.matchedText).toContain("내 땅");
    expect(matches.find((match) => match.entryId === "many")?.matchedText).toContain("수십");
  });

  test("matches real UTF-8 Korean object and nature symbols with particles", () => {
    const matches = findRuntimeSymbolMatches("엘리베이터에 갇혔고 바다를 봤어.", {
      locale: "ko",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["elevator", "sea"]));
    expect(matches.find((match) => match.entryId === "elevator")?.matchedText).toContain("엘리베이터");
    expect(matches.find((match) => match.entryId === "sea")?.matchedText).toContain("바다");
  });
});
