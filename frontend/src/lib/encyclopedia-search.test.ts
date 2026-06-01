import { describe, expect, it } from "vitest";

import { filterEncyclopediaSearchEntries } from "./encyclopedia-search";

const entries = [
  {
    symbol: "문",
    slug: "door",
    category: "place",
    aliases: ["문", "대문", "문틈"],
    coreMeanings: ["경계", "선택"],
    positiveReadings: ["새로운 장면으로 넘어갈 준비"],
    negativeReadings: ["결정을 미루는 마음"],
    contextQuestions: ["문은 열려 있었나요?"],
    relatedSymbols: ["열쇠"],
    catInterpretationHint: "문은 마음이 경계선 앞에서 발을 멈춘 장면일 수 있다냥.",
    body: "문은 안과 밖을 나누는 상징입니다.",
  },
  {
    symbol: "열쇠",
    slug: "key",
    category: "object",
    aliases: ["열쇠", "키", "자물쇠", "잠금"],
    coreMeanings: ["접근 권한", "해결 방법"],
    positiveReadings: ["문제를 풀 실마리를 발견하는 흐름"],
    negativeReadings: ["중요한 단서를 잃을까 하는 걱정"],
    contextQuestions: ["열쇠를 갖고 있었나요?"],
    relatedSymbols: ["문"],
    catInterpretationHint: "열쇠는 이미 손안에 있는 단서를 떠올리게 한다냥.",
    body: "열쇠는 잠긴 상황을 열기 위한 단서입니다.",
  },
  {
    symbol: "고양이",
    slug: "cat",
    category: "animal",
    aliases: ["고양이", "검은 고양이", "길고양이"],
    coreMeanings: ["직감", "독립성"],
    positiveReadings: ["조용히 살피는 힘"],
    negativeReadings: ["거리감을 두는 마음"],
    contextQuestions: ["고양이는 가까이 있었나요?"],
    relatedSymbols: ["동물"],
    catInterpretationHint: "고양이는 조용한 직감을 보여준다냥.",
    body: "고양이는 독립적인 관찰자의 감각을 상징합니다.",
  },
] as const;

describe("filterEncyclopediaSearchEntries", () => {
  it("matches symbols by aliases and body text", () => {
    expect(filterEncyclopediaSearchEntries(entries, { query: "자물쇠", category: "all" }).map((entry) => entry.slug)).toEqual([
      "key",
    ]);

    expect(filterEncyclopediaSearchEntries(entries, { query: "검은 고양이", category: "all" }).map((entry) => entry.slug)).toEqual([
      "cat",
    ]);
  });

  it("narrows entries by selected category", () => {
    expect(filterEncyclopediaSearchEntries(entries, { query: "", category: "object" }).map((entry) => entry.slug)).toEqual([
      "key",
    ]);
  });

  it("requires all query words to be present when searching phrases", () => {
    expect(filterEncyclopediaSearchEntries(entries, { query: "마음 경계", category: "all" }).map((entry) => entry.slug)).toEqual([
      "door",
    ]);
  });
});
