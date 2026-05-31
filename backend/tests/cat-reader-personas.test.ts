import { describe, expect, test } from "vitest";

import { getCatReaderPersona } from "../src/services/cat-reader-personas";

describe("cat reader personas", () => {
  test("returns a common persona profile for every cat theme", () => {
    const persona = getCatReaderPersona("white_cat");

    expect(persona.id).toBe("white_cat");
    expect(persona.interpretationPriority).toContain("symbol evidence");
    expect(persona.outputBias.join(" ")).toContain("regardless of selected cat theme");
  });

  test("normalizes legacy cheese reader ids", () => {
    expect(getCatReaderPersona("orange_cat").id).toBe("cheese_cat");
    expect(getCatReaderPersona("yellow_cat").id).toBe("cheese_cat");
  });

  test("defaults unknown reader ids to black cat", () => {
    expect(getCatReaderPersona("unknown_cat").id).toBe("black_cat");
    expect(getCatReaderPersona(undefined).id).toBe("black_cat");
  });

  test("does not define gray cat as a separate premium depth reader", () => {
    const persona = getCatReaderPersona("gray_cat");

    expect(persona.access).toBe("annual_premium");
    expect("premiumDepthProfile" in persona).toBe(false);
    expect(persona.outputBias).toEqual(getCatReaderPersona("black_cat").outputBias);
  });

  test("does not define distinct reading profiles for free cat themes", () => {
    expect("readingProfile" in getCatReaderPersona("black_cat")).toBe(false);
    expect("readingProfile" in getCatReaderPersona("white_cat")).toBe(false);
    expect("readingProfile" in getCatReaderPersona("cheese_cat")).toBe(false);
    expect(getCatReaderPersona("black_cat").interpretationPriority).toEqual(
      getCatReaderPersona("white_cat").interpretationPriority,
    );
  });
});
