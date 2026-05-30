import { describe, expect, test } from "vitest";

import { analyzeDreamStructure } from "../src/services/structured-dream-analysis";

describe("analyzeDreamStructure", () => {
  test("extracts literal, scene, and modifier queries for the snake owned-land case", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "오늘 새벽에 꿈을 꾸었는데 우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.",
      dreamMood: "overwhelming",
      wakeMood: "curious",
      locale: "ko",
    });

    expect(analysis.summary).toContain("구렁이");
    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["snake", "owned_land", "many", "dawn"]),
    );
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["구렁이", "뱀", "우리 땅", "수십 마리", "새벽"]));
    expect(analysis.modifierQueries).toEqual(expect.arrayContaining(["largeSnake", "manySnakes", "ownedLand", "dawn"]));
    expect(analysis.themes.map((theme) => theme.label)).toEqual(expect.arrayContaining(["영역", "생명력", "압도감"]));
  });

  test("extracts changing door and school corridor structure", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "학교 복도에서 교실을 찾는데 문이 계속 바뀌어서 어디로 들어가야 할지 몰랐어.",
      dreamMood: "confusing",
      locale: "ko",
    });

    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["school", "corridor", "door", "searching"]),
    );
    expect(analysis.sceneQueries).toEqual(expect.arrayContaining(["교실을 찾기", "문이 계속 바뀜"]));
    expect(analysis.modifierQueries).toContain("changingDoor");
  });

  test("keeps ambiguous searching dreams low-confidence and query-oriented", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "어딘가를 계속 돌아다녔는데 뭘 찾는지는 잘 모르겠어. 장면이 흐릿했어.",
      dreamMood: "blurry",
      locale: "ko",
    });

    const searching = analysis.symbolCandidates.find((candidate) => candidate.candidateId === "searching");

    expect(searching?.confidence).toBeLessThan(0.8);
    expect(analysis.themes.map((theme) => theme.label)).toContain("단서 부족");
  });

  test("extracts newer coverage symbols from encyclopedia aliases and scene modifiers", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "차를 운전하다가 무너진 다리를 건너는데 누군가에게 쫓기다가 피를 봤어.",
      dreamMood: "urgent",
      locale: "ko",
    });

    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["car", "bridge", "being_chased", "blood"]),
    );
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["차", "운전", "다리", "쫓기다가", "피"]));
    expect(analysis.modifierQueries).toEqual(
      expect.arrayContaining(["driving", "broken", "crossing", "unknownChaser"]),
    );
    expect(analysis.sceneFacts).toEqual(expect.arrayContaining([expect.stringContaining("자동차")]));
  });

  test("extracts English aliases and modifiers from the runtime encyclopedia", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "I was driving a car across a broken bridge while being chased and bleeding.",
      dreamMood: "urgent",
      locale: "en",
    });

    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["car", "bridge", "being_chased", "blood"]),
    );
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["car", "driving", "bridge", "being chased", "bleeding"]));
    expect(analysis.modifierQueries).toEqual(expect.arrayContaining(["driving", "broken", "crossing", "bleeding"]));
  });

  test("keeps unmatched noun-like details as low-confidence scene-only candidates", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "I saw a glowing robot beside a bridge.",
      locale: "en",
    });
    const robot = analysis.symbolCandidates.find((candidate) => candidate.text === "robot");

    expect(robot).toEqual(
      expect.objectContaining({
        text: "robot",
        source: "inferred",
        confidence: expect.any(Number),
      }),
    );
    expect(robot?.candidateId).toBeUndefined();
    expect(robot?.confidence).toBeLessThan(0.4);
  });

  test("adds distress safety signals without forcing a symbolic diagnosis", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "꿈에서 계속 울고 있었고, 깨고 나서도 마음이 너무 무겁고 힘들었어.",
      wakeMood: "heavy",
      dreamMood: "sad",
      locale: "ko",
    });

    expect(analysis.safetySignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "distress",
          severity: "medium",
        }),
      ]),
    );
  });

  test("flags medical or diagnostic requests in English", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "I dreamed my teeth were falling out. Does this mean I have a disease?",
      dreamMood: "scared",
      locale: "en",
    });

    expect(analysis.safetySignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "medicalOrDiagnostic",
          severity: "medium",
        }),
      ]),
    );
  });

  test("extracts real UTF-8 Korean snake, owned-land, and quantity symbols", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "내 땅에 큰 구렁이와 뱀이 수십 마리 나왔어.",
      locale: "ko",
      wakeMood: "surprised",
    });

    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["snake", "owned_land", "many"]),
    );
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["내 땅", "구렁이", "뱀", "수십"]));
    expect(analysis.modifierQueries).toEqual(expect.arrayContaining(["largeSnake", "manySnakes", "ownedLand"]));
  });

  test("extracts real UTF-8 Korean elevator and sea symbols", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "엘리베이터에 갇혔고 바다를 봤어.",
      locale: "ko",
      wakeMood: "anxious",
    });

    expect(analysis.symbolCandidates.map((candidate) => candidate.candidateId)).toEqual(
      expect.arrayContaining(["elevator", "sea"]),
    );
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["엘리베이터", "바다"]));
  });

  test("turns selected atmosphere and sensation ids into weak interpretation signals", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "복도를 끝없이 걸었어.",
      locale: "ko",
      dreamAtmospheres: ["anxious", "wistful"],
      dreamSensations: ["falling", "chased"],
    });

    expect(analysis.inferredEmotions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "불안", source: "selectedMood" }),
        expect.objectContaining({ label: "그리움", source: "selectedMood" }),
      ]),
    );
    expect(analysis.selectedAtmosphereLabels).toEqual(["불안", "그리움"]);
    expect(analysis.themeQueries).toEqual(expect.arrayContaining(["불안", "그리움"]));
    expect(analysis.selectedSensationLabels).toEqual(["떨어지는 느낌", "쫓기는 느낌"]);
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["떨어지는", "쫓기는"]));
  });

  test("adds the free-text sensation to selected labels but not to search queries", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "복도를 걸었어.",
      locale: "ko",
      dreamSensations: ["cold"],
      dreamSensationOther: "축축한 느낌",
    });

    expect(analysis.selectedSensationLabels).toEqual(["차가움", "축축한 느낌"]);
    // 임의 텍스트는 검색 노이즈를 막기 위해 literalQueries에 들어가지 않는다.
    expect(analysis.literalQueries).not.toEqual(expect.arrayContaining(["축축한 느낌"]));
  });

  test("localizes selected feeling signals for English", () => {
    const analysis = analyzeDreamStructure({
      dreamText: "I walked down an endless hallway.",
      locale: "en",
      dreamAtmospheres: ["anxious"],
      dreamSensations: ["floating"],
    });

    expect(analysis.selectedAtmosphereLabels).toEqual(["anxiety"]);
    expect(analysis.inferredEmotions).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "anxiety", source: "selectedMood" })]),
    );
    expect(analysis.literalQueries).toEqual(expect.arrayContaining(["flying"]));
  });

  test("resolves an auspicious lean for an unconditional luck symbol", () => {
    const analysis = analyzeDreamStructure({ dreamText: "돼지가 집에 들어왔어.", locale: "ko" });
    const pig = analysis.fortuneReadings.find((reading) => reading.symbolId === "pig");

    expect(pig?.lean).toBe("auspicious");
    expect(pig?.auspicious).toContain("재물");
  });

  test("reads a conditional symbol's lean from the scene cue, not feelings", () => {
    const clear = analyzeDreamStructure({ dreamText: "맑은 물에서 헤엄쳤어.", locale: "ko" });
    expect(clear.fortuneReadings.find((reading) => reading.symbolId === "water")?.lean).toBe("auspicious");

    const muddy = analyzeDreamStructure({ dreamText: "탁한 물에 빠졌어.", locale: "ko" });
    expect(muddy.fortuneReadings.find((reading) => reading.symbolId === "water")?.lean).toBe("cautious");

    // 장면 단서가 길조여도 분위기(두려움)는 omen을 못 바꾼다 — 톤만 무거워진다.
    const clearButScared = analyzeDreamStructure({
      dreamText: "맑은 물에서 헤엄쳤어.",
      locale: "ko",
      dreamAtmospheres: ["fearful"],
      dreamSensations: ["heavy"],
    });
    expect(clearButScared.fortuneReadings.find((reading) => reading.symbolId === "water")?.lean).toBe("auspicious");
    expect(clearButScared.readingTone).toBe("heavy");
  });

  test("presents both sides when a conditional symbol has no scene cue", () => {
    const analysis = analyzeDreamStructure({ dreamText: "물이 있었어.", locale: "ko" });
    expect(analysis.fortuneReadings.find((reading) => reading.symbolId === "water")?.lean).toBe("both");
  });

  test("derives reading tone and certainty from selected feelings", () => {
    const warm = analyzeDreamStructure({
      dreamText: "물.",
      locale: "ko",
      dreamAtmospheres: ["calm"],
      dreamSensations: ["warmth"],
    });
    expect(warm.readingTone).toBe("warm");

    expect(
      analyzeDreamStructure({ dreamText: "물.", locale: "ko", dreamSensations: ["hazy"] }).readingCertainty,
    ).toBe("low");
    expect(
      analyzeDreamStructure({ dreamText: "물.", locale: "ko", dreamSensations: ["vivid"] }).readingCertainty,
    ).toBe("high");
  });
});
