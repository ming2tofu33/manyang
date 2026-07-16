import {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
} from "@manyang/content/tarot";
import type {
  TarotQuestionPrompt,
  TarotQuestionState,
  TarotQuestionStateKey,
} from "@manyang/content/tarot";

export {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
};
export type {
  TarotQuestionPrompt,
  TarotQuestionState,
  TarotQuestionStateKey,
};

export const maxCustomTarotQuestionLength = 80;

function createStableQuestionHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function normalizeCustomTarotQuestionText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createCustomTarotQuestionPrompt(value: string): TarotQuestionPrompt | null {
  const text = normalizeCustomTarotQuestionText(value);

  if (!text || text.length > maxCustomTarotQuestionLength) {
    return null;
  }

  return {
    key: `custom_${createStableQuestionHash(text)}`,
    text,
  };
}
