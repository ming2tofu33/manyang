export const DREAM_LOADING_READER_SCENE_MS = 3000;
export const DREAM_LOADING_INTERPRETATION_SCENE_MS = 10000;
export const DREAM_LOADING_ORB_MINIMUM_MS = 12000;
export const DREAM_LOADING_MINIMUM_MS =
  DREAM_LOADING_READER_SCENE_MS + DREAM_LOADING_INTERPRETATION_SCENE_MS + DREAM_LOADING_ORB_MINIMUM_MS;

export const dreamLoadingInterpretationSteps = [
  "꿈속에 남은 장면을 오브에 펼쳐보고 있어요.",
  "반복해서 나타난 상징을 하나씩 짚어보고 있어요.",
  "꿈에 묻어 있던 감정을 비춰보고 있어요.",
] as const;

export const dreamLoadingOrbSteps = [
  "꿈 조각을 오브에 모으고 있어요.",
  "반복되는 상징을 찾고 있어요.",
  "꿈에 남은 감정을 비춰보고 있어요.",
  "오늘의 꿈을 영수증에 옮겨 적고 있어요.",
] as const;

const READER_SCENE_MESSAGE = "오늘의 꿈을 읽을 고양이가 자리를 잡았어요.";
const LONG_WAIT_MESSAGE = "꿈 조각이 많아 한 겹 더 맞춰보고 있어요.";
const VERY_LONG_WAIT_MESSAGE = "연결이 늦어지고 있어요. 준비되는 대로 바로 열게요.";
const INTERPRETATION_STEP_MS = DREAM_LOADING_INTERPRETATION_SCENE_MS / dreamLoadingInterpretationSteps.length;
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
  const interpretationElapsedMs = Math.max(0, safeElapsedMs - DREAM_LOADING_READER_SCENE_MS);
  const orbElapsedMs = Math.max(
    0,
    safeElapsedMs - DREAM_LOADING_READER_SCENE_MS - DREAM_LOADING_INTERPRETATION_SCENE_MS,
  );
  const interpretationStepIndex = isInterpretationScene
    ? Math.min(dreamLoadingInterpretationSteps.length - 1, Math.floor(interpretationElapsedMs / INTERPRETATION_STEP_MS))
    : 0;
  const stepIndex =
    isReaderScene
      ? 0
      : isInterpretationScene
        ? interpretationStepIndex
        : Math.min(dreamLoadingOrbSteps.length - 1, Math.floor(orbElapsedMs / ORB_STEP_MS));

  return {
    scene: isReaderScene ? "reader" : isInterpretationScene ? "interpretation" : "orb",
    stepIndex,
    stepLabel: `${stepIndex + 1}/${dreamLoadingOrbSteps.length}`,
    message: isReaderScene
      ? READER_SCENE_MESSAGE
      : isInterpretationScene
        ? dreamLoadingInterpretationSteps[interpretationStepIndex]
        : dreamLoadingOrbSteps[stepIndex],
    supportingMessage: getSupportingMessage(safeElapsedMs),
    canFinish: safeElapsedMs >= DREAM_LOADING_MINIMUM_MS,
  };
}

function getSupportingMessage(elapsedMs: number): string | null {
  if (elapsedMs >= 55000) {
    return VERY_LONG_WAIT_MESSAGE;
  }

  if (elapsedMs >= 30000) {
    return LONG_WAIT_MESSAGE;
  }

  return null;
}
