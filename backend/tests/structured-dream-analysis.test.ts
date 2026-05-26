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
});
