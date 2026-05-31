"use client";

import { useLocale } from "@/lib/use-locale";
import { supportedLocales, type Locale } from "@/lib/locale";

const localeNameKey = {
  ko: "language.name.ko",
  en: "language.name.en",
} as const;

// 한국어 ↔ English 토글. 선택은 localStorage에 저장되고, 같은 store를 쓰는
// 모든 화면(useLocale)이 즉시 반영된다. API 요청에도 이 locale이 실린다.
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={className} role="group" aria-label={t("language.switch")}>
      {supportedLocales.map((option: Locale) => {
        const isActive = option === locale;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={isActive}
            data-active={isActive}
          >
            {t(localeNameKey[option])}
          </button>
        );
      })}
    </div>
  );
}
