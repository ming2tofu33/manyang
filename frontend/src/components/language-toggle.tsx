"use client";

import { useLocale } from "@/lib/use-locale";
import { supportedLocales, type Locale } from "@/lib/locale";
import { cn } from "@/lib/styles";

const localeNameKey = {
  ko: "language.name.ko",
  en: "language.name.en",
} as const;

// 한국어 ↔ English 토글. 선택은 localStorage에 저장되고, 같은 store를 쓰는
// 모든 화면(useLocale)이 즉시 반영된다. API 요청에도 이 locale이 실린다.
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("language.switch")}
      className={cn(
        "inline-flex gap-1 rounded-full border border-[#b98255]/45 bg-[#06040c]/60 p-1",
        className,
      )}
    >
      {supportedLocales.map((option: Locale) => {
        const isActive = option === locale;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={isActive}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
              isActive
                ? "bg-[linear-gradient(135deg,rgba(100,45,134,0.92),rgba(31,16,49,0.94))] text-[#ffe7b5] shadow-[0_0_18px_rgba(199,117,255,0.32)]"
                : "text-[#f2c27d]/80 hover:text-[#ffe7b5]",
            )}
          >
            {t(localeNameKey[option])}
          </button>
        );
      })}
    </div>
  );
}
