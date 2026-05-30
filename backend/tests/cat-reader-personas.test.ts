import { describe, expect, test } from "vitest";

import { getCatReaderPersona } from "../src/services/cat-reader-personas";

describe("cat reader personas", () => {
  test("returns the requested persona profile", () => {
    const persona = getCatReaderPersona("white_cat");

    expect(persona.id).toBe("white_cat");
    expect(persona.interpretationPriority).toContain("emotional regulation");
    expect(persona.toneDirectives.join(" ")).toContain("gentle");
  });

  test("normalizes legacy cheese reader ids", () => {
    expect(getCatReaderPersona("orange_cat").id).toBe("cheese_cat");
    expect(getCatReaderPersona("yellow_cat").id).toBe("cheese_cat");
  });

  test("defaults unknown reader ids to black cat", () => {
    expect(getCatReaderPersona("unknown_cat").id).toBe("black_cat");
    expect(getCatReaderPersona(undefined).id).toBe("black_cat");
  });

  test("defines gray cat as a premium depth reader with reflective question guidance", () => {
    const persona = getCatReaderPersona("gray_cat");

    expect(persona.access).toBe("annual_premium");
    expect(persona.premiumDepthProfile).toMatchObject({
      mode: "gray_depth",
      closingStyle: expect.stringContaining("reflective question"),
    });
    expect(persona.premiumDepthProfile?.principle).toContain("does not sort dreams into lucky or unlucky readings");
    expect(persona.premiumDepthProfile?.readingShape).toEqual(
      expect.arrayContaining([
        expect.stringContaining("what the dream scene may reflect about the user's recent inner flow"),
        expect.stringContaining("more than one plausible possibility"),
      ]),
    );
  });

  test("defines clear reading profiles for free cat readers", () => {
    expect(getCatReaderPersona("black_cat").readingProfile).toMatchObject({
      mode: "symbol_focus",
      principle: expect.stringContaining("clearest scene"),
      closingStyle: expect.stringContaining("core image"),
    });
    expect(getCatReaderPersona("white_cat").readingProfile).toMatchObject({
      mode: "emotional_comfort",
      principle: expect.stringContaining("feeling left by the dream"),
      closingStyle: expect.stringContaining("small and easy"),
    });
    expect(getCatReaderPersona("cheese_cat").readingProfile).toMatchObject({
      mode: "daily_hint",
      principle: expect.stringContaining("hint the user can use today"),
      closingStyle: expect.stringContaining("one small concrete action"),
    });
  });
});
