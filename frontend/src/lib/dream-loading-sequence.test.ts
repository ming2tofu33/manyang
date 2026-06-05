import { describe, expect, test } from "vitest";

import {
  DREAM_LOADING_INTERPRETATION_SCENE_MS,
  DREAM_LOADING_MINIMUM_MS,
  DREAM_LOADING_ORB_MINIMUM_MS,
  DREAM_LOADING_READER_SCENE_MS,
  getDreamLoadingSequence,
} from "./dream-loading-sequence";

describe("dream loading sequence", () => {
  test("plays reader, interpretation, then orb scenes before allowing completion", () => {
    expect(DREAM_LOADING_READER_SCENE_MS).toBe(3000);
    expect(DREAM_LOADING_INTERPRETATION_SCENE_MS).toBe(10000);
    expect(DREAM_LOADING_ORB_MINIMUM_MS).toBe(12000);
    expect(DREAM_LOADING_MINIMUM_MS).toBe(25000);

    expect(getDreamLoadingSequence(0)).toMatchObject({
      scene: "reader",
      message: "오늘의 꿈을 읽을 고양이가 자리를 잡았어요.",
      canFinish: false,
    });
    expect(getDreamLoadingSequence(2999).scene).toBe("reader");
    expect(getDreamLoadingSequence(3000)).toMatchObject({
      scene: "interpretation",
      message: "꿈속에 남은 장면을 오브에 펼쳐보고 있어요.",
      canFinish: false,
    });
    expect(getDreamLoadingSequence(6334)).toMatchObject({
      scene: "interpretation",
      message: "반복해서 나타난 상징을 하나씩 짚어보고 있어요.",
    });
    expect(getDreamLoadingSequence(9667)).toMatchObject({
      scene: "interpretation",
      message: "꿈에 묻어 있던 감정을 비춰보고 있어요.",
    });
    expect(getDreamLoadingSequence(12999).scene).toBe("interpretation");
    expect(getDreamLoadingSequence(13000)).toMatchObject({
      scene: "orb",
      stepIndex: 0,
      message: "꿈 조각을 오브에 모으고 있어요.",
      canFinish: false,
    });
  });

  test("advances through orb reading steps without pretending to know exact progress", () => {
    expect(getDreamLoadingSequence(16000)).toMatchObject({
      scene: "orb",
      stepIndex: 1,
      stepLabel: "2/4",
      message: "반복되는 상징을 찾고 있어요.",
    });
    expect(getDreamLoadingSequence(19000)).toMatchObject({
      scene: "orb",
      stepIndex: 2,
      stepLabel: "3/4",
      message: "꿈에 남은 감정을 비춰보고 있어요.",
    });
    expect(getDreamLoadingSequence(22000)).toMatchObject({
      scene: "orb",
      stepIndex: 3,
      stepLabel: "4/4",
      message: "오늘의 꿈을 영수증에 옮겨 적고 있어요.",
    });
  });

  test("allows completion only after the full minimum ritual and switches to longer wait copy later", () => {
    expect(getDreamLoadingSequence(24999).canFinish).toBe(false);
    expect(getDreamLoadingSequence(25000).canFinish).toBe(true);
    expect(getDreamLoadingSequence(29999).supportingMessage).toBeNull();
    expect(getDreamLoadingSequence(30000).supportingMessage).toBe("꿈 조각이 많아 한 겹 더 맞춰보고 있어요.");
    expect(getDreamLoadingSequence(55000).supportingMessage).toBe("연결이 늦어지고 있어요. 준비되는 대로 바로 열게요.");
  });
});
