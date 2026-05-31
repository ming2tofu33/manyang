import { encyclopediaEntries, type EncyclopediaEntry } from "@manyang/backend";
import { describe, expect, it } from "vitest";

import {
  createSymbolCanonicalPath,
  createSymbolSeoDescription,
  createSymbolSeoTitle,
  getSiteUrl,
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

  it("defaults to the current production site URL", () => {
    const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const vercelUrl = process.env.VERCEL_URL;

    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "temporary-preview.vercel.app";

    try {
      expect(getSiteUrl()).toBe("https://manyang.vercel.app");
    } finally {
      if (publicSiteUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        process.env.NEXT_PUBLIC_SITE_URL = publicSiteUrl;
      }

      if (vercelUrl === undefined) {
        delete process.env.VERCEL_URL;
      } else {
        process.env.VERCEL_URL = vercelUrl;
      }
    }
  });
});
