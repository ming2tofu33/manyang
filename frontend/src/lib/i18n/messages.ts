// UI 문구 사전(경량 i18n). 해몽 내용(요약/상징/본문/길흉)은 백엔드가 locale로 생성하므로
// 여기엔 앱 껍데기 문구만 둔다. ko를 기준 키로 삼고, en은 같은 키를 모두 채우도록 타입으로 강제한다.
import type { Locale } from "../locale";

const ko = {
  "language.name.ko": "한국어",
  "language.name.en": "English",
  "language.switch": "언어",

  "dreamEntry.submit": "해몽 받기",
  "dreamEntry.submitting": "꿈 읽는 중",
  "dreamEntry.loadingAria": "고양이가 꿈을 읽는 중",
  "dreamEntry.emptyError": "꿈 내용을 한 문장이라도 적어주세요.",
  "dreamEntry.unavailable": "지금은 해몽을 받을 수 없어요",

  "gate.guestDailyLimit.title": "오늘의 꿈 영수증은 이미 받았어요",
  "gate.guestDailyLimit.cta": "로그인하고 매일 꿈 기록 남기기",
  "gate.guestDailyLimit.message": "오늘의 무료 꿈 영수증은 이미 받았어요. 로그인하면 매일 꿈 기록을 이어갈 수 있어요.",
} as const;

export type MessageKey = keyof typeof ko;

// en은 ko의 모든 키를 반드시 채워야 한다(누락 시 타입 에러).
const en: Record<MessageKey, string> = {
  "language.name.ko": "한국어",
  "language.name.en": "English",
  "language.switch": "Language",

  "dreamEntry.submit": "Read my dream",
  "dreamEntry.submitting": "Reading your dream",
  "dreamEntry.loadingAria": "The cat is reading your dream",
  "dreamEntry.emptyError": "Write at least one sentence about your dream.",
  "dreamEntry.unavailable": "Readings aren't available right now",

  "gate.guestDailyLimit.title": "You've already received today's dream receipt",
  "gate.guestDailyLimit.cta": "Sign in to keep a daily dream journal",
  "gate.guestDailyLimit.message":
    "You've already received today's free dream receipt. Sign in to keep recording your dreams every day.",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { ko, en };

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale]?.[key] ?? messages.ko[key] ?? key;
}
