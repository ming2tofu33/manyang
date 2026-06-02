import type { EncyclopediaEntry } from "@manyang/backend";
import { describe, expect, it } from "vitest";

import {
  createSymbolCanonicalPath,
  createSymbolSeoDescription,
  createSymbolSeoTitle,
  getSiteUrl,
  getIndexableEncyclopediaEntries,
} from "./seo-encyclopedia";

// 헬퍼 단위 테스트용 self-contained 픽스처(데이터셋 비의존).
const catEntry: EncyclopediaEntry = {
  symbol: "고양이",
  slug: "cat",
  category: "animal",
  aliases: ["고양이", "냥이", "검은고양이", "길고양이"],
  coreMeanings: ["직감", "독립성", "조용한 관찰"],
  positiveReadings: ["내 감각을 믿어도 되는 흐름", "거리를 두고 살피는 지혜"],
  negativeReadings: ["마음을 쉽게 열지 않는 경계", "혼자 해결하려는 습관"],
  contextQuestions: ["고양이가 다가왔나요, 멀어졌나요?", "고양이를 돌봤나요, 바라봤나요?"],
  relatedSymbols: ["동물", "어둠", "모르는 사람"],
  catInterpretationHint: "고양이는 조용히 이미 알고 있던 마음을 건드립니다.",
  body: "고양이는 직감과 독립성, 섬세한 거리감을 표현하기 좋습니다.",
};

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
