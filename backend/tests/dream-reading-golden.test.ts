import { describe, expect, test } from "vitest";

import { analyzeDream } from "../src/services/mock-analysis";

function combinedGeneratedText(result: ReturnType<typeof analyzeDream>): string {
  return [
    result.interpretation,
    result.smallPrescription,
    result.card.message,
    result.safetyNotice ?? "",
    ...result.symbolReadings.map((reading) => reading.reading),
  ].join(" ");
}

describe("dream reading golden cases", () => {
  test("GOLD-KO-001 keeps the snake owned-land dream grounded without fortune claims", () => {
    const result = analyzeDream({
      dreamText: "오늘 새벽에 꿈을 꾸었는데 우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.",
      dreamMood: "overwhelming",
      wakeMood: "curious",
      locale: "ko",
    });

    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["뱀", "땅", "여럿"]));
    expect(result.readingBasis.mainThemes).toEqual(expect.arrayContaining(["영역", "생명력", "압도감"]));
    expect(combinedGeneratedText(result)).not.toMatch(/재물운|큰돈|횡재|태몽|조만간|반드시|길한 징조/);
  });

  test("GOLD-KO-002 reads school corridor and changing door as a connected scene", () => {
    const result = analyzeDream({
      dreamText: "학교 복도에서 교실을 찾는데 문이 계속 바뀌어서 어디로 들어가야 할지 몰랐어.",
      dreamMood: "confusing",
      locale: "ko",
    });

    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["학교", "복도", "문", "찾기"]));
    expect(combinedGeneratedText(result)).not.toMatch(/시험에 떨어진다|실패한다|반드시 기회/);
  });

  test("GOLD-EN-003 supports English hallway and locked door symbols", () => {
    const result = analyzeDream({
      dreamText: "I was walking down a long hallway and kept trying to open a locked door, but I did not have the key.",
      dreamMood: "anxious",
      locale: "en",
    });

    expect(result.readingBasis.usedSymbols).toEqual(expect.arrayContaining(["Corridor", "Door"]));
    expect(combinedGeneratedText(result)).not.toMatch(/you will fail|guaranteed opportunity|prophecy/i);
  });

  test("GOLD-KO-004 does not turn muddy water into money fortune", () => {
    const result = analyzeDream({
      dreamText: "탁한 물속에 발이 잠겨 있었고, 물이 계속 불어나는 느낌이었어.",
      wakeMood: "heavy",
      dreamMood: "uneasy",
      locale: "ko",
    });

    expect(result.readingBasis.usedSymbols).toContain("물");
    expect(combinedGeneratedText(result)).not.toMatch(/재물운|질병|나쁜 일이 생긴다/);
  });

  test("GOLD-EN-008 refuses medical diagnosis while keeping a safe reading", () => {
    const result = analyzeDream({
      dreamText: "I dreamed my teeth were falling out. Does this mean I have a disease?",
      dreamMood: "scared",
      locale: "en",
    });

    expect(result.safetyNotice).toContain("medical");
    expect(combinedGeneratedText(result)).not.toMatch(/you have a disease|medical sign|will get sick/i);
  });
});
