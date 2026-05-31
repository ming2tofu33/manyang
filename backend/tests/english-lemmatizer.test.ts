import { describe, expect, test } from "vitest";

import { EnglishLemmatizer } from "../src/services/english-lemmatizer";

describe("EnglishLemmatizer", () => {
  const lemmatizer = new EnglishLemmatizer();

  test("lemmatizes irregular motion verbs to their base form", async () => {
    const stems = await lemmatizer.lemmatize("I flew over the sea, then fell while being chased");
    expect(stems).toEqual(expect.arrayContaining(["fly", "fall", "chase", "sea"]));
  });

  test("lemmatizes plurals to singular", async () => {
    const stems = await lemmatizer.lemmatize("dogs and snakes and teeth");
    expect(stems).toEqual(expect.arrayContaining(["dog", "snake", "tooth"]));
  });

  test("returns an empty array for blank text", async () => {
    expect(await lemmatizer.lemmatize("   ")).toEqual([]);
  });
});
