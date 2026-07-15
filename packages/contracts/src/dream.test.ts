import { describe, expect, test } from "vitest";

import { CAT_READER_TYPES, DREAM_LOCALES } from "./dream";

describe("dream transport contract", () => {
  test("exposes the supported reader ids once", () => {
    expect(CAT_READER_TYPES).toEqual([
      "black_cat",
      "white_cat",
      "cheese_cat",
      "gray_cat",
    ]);
    expect(new Set(CAT_READER_TYPES).size).toBe(CAT_READER_TYPES.length);
  });

  test("exposes the supported dream locales", () => {
    expect(DREAM_LOCALES).toEqual(["ko", "en"]);
  });
});
