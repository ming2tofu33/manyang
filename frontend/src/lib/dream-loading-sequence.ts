export const DREAM_LOADING_READER_SCENE_MS = 3000;
export const DREAM_LOADING_INTERPRETATION_SCENE_MS = 7000;
export const DREAM_LOADING_ORB_MINIMUM_MS = 10000;
export const DREAM_LOADING_MINIMUM_MS =
  DREAM_LOADING_READER_SCENE_MS + DREAM_LOADING_INTERPRETATION_SCENE_MS + DREAM_LOADING_ORB_MINIMUM_MS;

export const dreamLoadingOrbSteps = [
  "꿈 조각을 오브에 모으고 있어요.",
  "반복되는 상징을 찾고 있어요.",
  "꿈에 남은 감정을 비춰보고 있어요.",
  "꿈 영수증에 담을 말을 고르고 있어요.",
] as const;

const READER_SCENE_MESSAGE = "오늘 꿈을 읽을 고양이가 도착했어요.";
const INTERPRETATION_SCENE_MESSAGE = "장면과 상징을 차분히 읽고 있어요.";
const LONG_WAIT_MESSAGE = "꿈 조각이 많아 한 겹 더 맞춰보고 있어요.";
const VERY_LONG_WAIT_MESSAGE = "연결이 늦어지고 있어요. 준비되는 대로 바로 열게요.";
const ORB_STEP_MS = DREAM_LOADING_ORB_MINIMUM_MS / dreamLoadingOrbSteps.length;

export type DreamLoadingScene = "reader" | "interpretation" | "orb";

export type DreamLoadingSequence = {
  scene: DreamLoadingScene;
  stepIndex: number;
  stepLabel: string;
  message: string;
  supportingMessage: string | null;
  canFinish: boolean;
};

export function getDreamLoadingSequence(elapsedMs: number): DreamLoadingSequence {
  const safeElapsedMs = Math.max(0, elapsedMs);
  const isReaderScene = safeElapsedMs < DREAM_LOADING_READER_SCENE_MS;
  const isInterpretationScene =
    safeElapsedMs < DREAM_LOADING_READER_SCENE_MS + DREAM_LOADING_INTERPRETATION_SCENE_MS;
  const orbElapsedMs = Math.max(
    0,
    safeElapsedMs - DREAM_LOADING_READER_SCENE_MS - DREAM_LOADING_INTERPRETATION_SCENE_MS,
  );
  const stepIndex =
    isReaderScene || isInterpretationScene
      ? 0
      : Math.min(dreamLoadingOrbSteps.length - 1, Math.floor(orbElapsedMs / ORB_STEP_MS));

  return {
    scene: isReaderScene ? "reader" : isInterpretationScene ? "interpretation" : "orb",
    stepIndex,
    stepLabel: `${stepIndex + 1}/${dreamLoadingOrbSteps.length}`,
    message: isReaderScene
      ? READER_SCENE_MESSAGE
      : isInterpretationScene
        ? INTERPRETATION_SCENE_MESSAGE
        : dreamLoadingOrbSteps[stepIndex],
    supportingMessage: getSupportingMessage(safeElapsedMs),
    canFinish: safeElapsedMs >= DREAM_LOADING_MINIMUM_MS,
  };
}

function getSupportingMessage(elapsedMs: number): string | null {
  if (elapsedMs >= 55000) {
    return VERY_LONG_WAIT_MESSAGE;
  }

  if (elapsedMs >= 25000) {
    return LONG_WAIT_MESSAGE;
  }

  return null;
}
