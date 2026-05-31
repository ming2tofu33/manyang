import { describe, expect, test } from "vitest";

import { safeLemmatize, type KoreanLemmatizer } from "../src/services/korean-lemmatizer";

const fixedLemmatizer = (lemmas: string[]): KoreanLemmatizer => ({
  lemmatize: async () => lemmas,
});

describe("safeLemmatize", () => {
  test("returns an empty array when no lemmatizer is configured (fallback)", async () => {
    expect(await safeLemmatize(undefined, "맑은 물")).toEqual([]);
  });

  test("returns the lemmatizer's lemmas", async () => {
    expect(await safeLemmatize(fixedLemmatizer(["물", "올라가"]), "맑은 물에서 올라갔어")).toEqual(["물", "올라가"]);
  });

  test("falls back to an empty array when the lemmatizer throws", async () => {
    const failing: KoreanLemmatizer = {
      lemmatize: async () => {
        throw new Error("analyzer down");
      },
    };
    expect(await safeLemmatize(failing, "맑은 물")).toEqual([]);
  });

  test("drops empty or blank lemmas", async () => {
    expect(await safeLemmatize(fixedLemmatizer(["물", "  ", ""]), "물")).toEqual(["물"]);
  });
});
