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
    expect(DREAM_LOADING_INTERPRETATION_SCENE_MS).toBe(7000);
    expect(DREAM_LOADING_ORB_MINIMUM_MS).toBe(10000);
    expect(DREAM_LOADING_MINIMUM_MS).toBe(20000);

    expect(getDreamLoadingSequence(0)).toMatchObject({
      scene: "reader",
      message: "오늘 꿈을 읽을 고양이가 도착했어요.",
      canFinish: false,
    });
    expect(getDreamLoadingSequence(2999).scene).toBe("reader");
    expect(getDreamLoadingSequence(3000)).toMatchObject({
      scene: "interpretation",
      message: "장면과 상징을 차분히 읽고 있어요.",
      canFinish: false,
    });
    expect(getDreamLoadingSequence(9999).scene).toBe("interpretation");
    expect(getDreamLoadingSequence(10000)).toMatchObject({
      scene: "orb",
      stepIndex: 0,
      message: "꿈 조각을 오브에 모으고 있어요.",
      canFinish: false,
    });
  });

  test("advances through orb reading steps without pretending to know exact progress", () => {
    expect(getDreamLoadingSequence(12500)).toMatchObject({
      scene: "orb",
      stepIndex: 1,
      stepLabel: "2/4",
      message: "반복되는 상징을 찾고 있어요.",
    });
    expect(getDreamLoadingSequence(15000)).toMatchObject({
      scene: "orb",
      stepIndex: 2,
      stepLabel: "3/4",
      message: "꿈에 남은 감정을 비춰보고 있어요.",
    });
    expect(getDreamLoadingSequence(17500)).toMatchObject({
      scene: "orb",
      stepIndex: 3,
      stepLabel: "4/4",
      message: "꿈 영수증에 담을 말을 고르고 있어요.",
    });
  });

  test("allows completion only after the full minimum ritual and switches to longer wait copy later", () => {
    expect(getDreamLoadingSequence(19999).canFinish).toBe(false);
    expect(getDreamLoadingSequence(20000).canFinish).toBe(true);
    expect(getDreamLoadingSequence(24999).supportingMessage).toBeNull();
    expect(getDreamLoadingSequence(25000).supportingMessage).toBe("꿈 조각이 많아 한 겹 더 맞춰보고 있어요.");
    expect(getDreamLoadingSequence(55000).supportingMessage).toBe("연결이 늦어지고 있어요. 준비되는 대로 바로 열게요.");
  });
});
