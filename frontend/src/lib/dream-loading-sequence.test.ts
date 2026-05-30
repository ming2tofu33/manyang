import { describe, expect, test } from "vitest";

import {
  DREAM_LOADING_CAT_SCENE_MS,
  DREAM_LOADING_MINIMUM_MS,
  DREAM_LOADING_ORB_MINIMUM_MS,
  getDreamLoadingSequence,
} from "./dream-loading-sequence";

describe("dream loading sequence", () => {
  test("keeps a five second cat intro before the orb reading scene", () => {
    expect(DREAM_LOADING_CAT_SCENE_MS).toBe(5000);
    expect(DREAM_LOADING_ORB_MINIMUM_MS).toBe(10000);
    expect(DREAM_LOADING_MINIMUM_MS).toBe(15000);

    expect(getDreamLoadingSequence(0)).toMatchObject({
      scene: "cat",
      message: "고양이가 첫 장면을 살펴보고 있어요.",
      canFinish: false,
    });
    expect(getDreamLoadingSequence(4999).scene).toBe("cat");
    expect(getDreamLoadingSequence(5000)).toMatchObject({
      scene: "orb",
      stepIndex: 0,
      message: "꿈 조각을 오브에 모으고 있어요.",
      canFinish: false,
    });
  });

  test("advances through orb reading steps without pretending to know exact progress", () => {
    expect(getDreamLoadingSequence(7500)).toMatchObject({
      scene: "orb",
      stepIndex: 1,
      stepLabel: "2/4",
      message: "반복되는 상징을 찾고 있어요.",
    });
    expect(getDreamLoadingSequence(10000)).toMatchObject({
      scene: "orb",
      stepIndex: 2,
      stepLabel: "3/4",
      message: "꿈에 남은 감정을 비춰보고 있어요.",
    });
    expect(getDreamLoadingSequence(12500)).toMatchObject({
      scene: "orb",
      stepIndex: 3,
      stepLabel: "4/4",
      message: "꿈 영수증에 담을 말을 고르고 있어요.",
    });
  });

  test("allows completion only after the full minimum ritual and switches to longer wait copy later", () => {
    expect(getDreamLoadingSequence(14999).canFinish).toBe(false);
    expect(getDreamLoadingSequence(15000).canFinish).toBe(true);
    expect(getDreamLoadingSequence(30000).supportingMessage).toBe("꿈 내용이 길어서 조금 더 깊게 읽고 있어요.");
    expect(getDreamLoadingSequence(55000).supportingMessage).toBe("조금 오래 걸리고 있어요. 곧 다시 확인할게요.");
  });
});
