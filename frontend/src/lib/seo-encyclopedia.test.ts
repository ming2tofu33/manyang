import { encyclopediaEntries, type EncyclopediaEntry } from "@manyang/backend";
import { describe, expect, it } from "vitest";

import {
  createSymbolCanonicalPath,
  createSymbolSeoDescription,
  createSymbolSeoTitle,
  getIndexableEncyclopediaEntries,
} from "./seo-encyclopedia";

const catEntry = encyclopediaEntries.find((entry) => entry.slug === "cat");

describe("seo encyclopedia helpers", () => {
  it("creates a branded symbol SEO title", () => {
    expect(createSymbolSeoTitle(catEntry as EncyclopediaEntry)).toBe("고양이 꿈 해몽 | 마냥 꿈해몽");
  });

  it("creates a symbol description that connects search intent to dream receipts", () => {
    const description = createSymbolSeoDescription(catEntry as EncyclopediaEntry);

    expect(description).toContain("직감");
    expect(description).toContain("독립성");
    expect(description).toContain("조용한 관찰과 연결");
    expect(description).toContain("꿈 영수증");
  });

  it("creates the canonical encyclopedia path", () => {
    expect(createSymbolCanonicalPath(catEntry as EncyclopediaEntry)).toBe("/encyclopedia/cat");
  });

  it("filters entries that cannot become indexable pages", () => {
    const entries = [
      catEntry,
      { ...(catEntry as EncyclopediaEntry), slug: "" },
      { ...(catEntry as EncyclopediaEntry), symbol: "" },
    ] as EncyclopediaEntry[];

    expect(getIndexableEncyclopediaEntries(entries)).toEqual([catEntry]);
  });
});
