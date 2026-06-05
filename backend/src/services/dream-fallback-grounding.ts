import type { SupportedLocale } from "../contracts/symbol-encyclopedia";

/**
 * 무매칭/저매칭 폴백 grounding (RAG-IMP-06).
 *
 * 등록된 상징이 하나도 안 잡히거나(무매칭) 약하게만 잡혔을 때(저매칭), 시스템이 빈약한 일반 멘트만
 * 내거나 없는 상징을 지어내는 대신 — "꿈을 어떻게 바라볼지"의 안전·보편 틀에 기대게 한다.
 *
 * 점/예언이 아니라 일반 dream-psychology 톤만 담는다. 남은 감정을 단서로 데려가되,
 * 재물·질병·길흉을 단정하지 않는다(테스트가 금지어를 가드).
 */

type LocaleText = Record<SupportedLocale, string>;

// 근거가 비었을 때 기대는 보편 grounding 문장. 새 문장은 함수가 아니라 이 표에 한 줄 더한다.
export const GENERAL_DREAM_GROUNDING: LocaleText[] = [
  {
    ko: "꿈은 낮 동안 미처 정리하지 못한 감정과 인상을 밤사이 곱씹는 과정으로 여겨져요.",
    en: "Dreams are often the mind's way of sorting through feelings and impressions it didn't finish during the day.",
  },
  {
    ko: "또렷한 장면이 없을수록, 깨어나 남은 기분이 지금 마음이 어디에 머무는지를 더 잘 보여줍니다.",
    en: "When the scenes stay vague, the mood you wake with often says more about where your mind is resting than any single image.",
  },
  {
    ko: "상징이 분명하지 않은 꿈은 답을 주기보다, 요즘 무엇이 마음에 걸려 있는지 가만히 비춰주는 거울에 가까워요.",
    en: "A dream without clear symbols is less an answer than a quiet mirror of what has been on your mind lately.",
  },
  {
    ko: "꿈을 정답처럼 풀기보다 남은 감각 하나를 붙잡아 두면, 오늘 나를 돌보는 작은 실마리가 됩니다.",
    en: "Rather than solving the dream like a riddle, holding on to one lingering feeling can be a small way to look after yourself today.",
  },
];

export type FallbackGroundingInput = {
  locale: SupportedLocale;
  /** 폴백이어도 기댈 수 있는, 사용자에게서 온 정서/분위기 라벨(현지화). 있으면 앵커로 삼는다. */
  anchorLabels?: string[];
  /** 결정적 변주용 정수(예: 텍스트 길이). 같은 입력은 같은 문장을 고른다. */
  salt?: number;
};

/** 폴백 grounding 한 문장을 만든다. 앵커 정서가 있으면 그것을 명시하고 보편 문장을 잇는다. */
export function resolveFallbackGrounding(input: FallbackGroundingInput): string {
  const index = Math.abs(Math.trunc(input.salt ?? 0)) % GENERAL_DREAM_GROUNDING.length;
  const chosen = GENERAL_DREAM_GROUNDING[index] ?? GENERAL_DREAM_GROUNDING[0];
  const line = chosen ? chosen[input.locale] : "";
  const anchor = (input.anchorLabels ?? []).map((label) => label.trim()).find((label) => label.length > 0);

  if (!anchor) {
    return line;
  }

  return input.locale === "en"
    ? `The dream left mostly a feeling of ${anchor} rather than a clear symbol. ${line}`
    : `이 꿈은 또렷한 상징보다 ${anchor} 같은 느낌을 남겼어요. ${line}`;
}
