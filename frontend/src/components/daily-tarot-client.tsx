"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  createDailyTarotOptions,
  createDailyTarotReading,
  dailyTarotStorageKey,
  getDailyTarotReadingFromBrowser,
  saveDailyTarotReadingToBrowser,
  subscribeToDailyTarot,
  type DailyTarotOption,
  type DailyTarotReading,
} from "@/lib/daily-tarot";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

type DailyTarotClientProps = {
  appDate: string;
  initialReading: DailyTarotReading | null;
};

type DailyTarotSnapshotCache = {
  appDate: string;
  reading: DailyTarotReading | null;
  storageValue: string | null;
};

let dailyTarotSnapshotCache: DailyTarotSnapshotCache | null = null;

function getDailyTarotStorageValueFromBrowser(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(dailyTarotStorageKey);
  } catch {
    return null;
  }
}

export function getStableDailyTarotReadingSnapshot(appDate: string): DailyTarotReading | null {
  const storageValue = getDailyTarotStorageValueFromBrowser();

  if (
    dailyTarotSnapshotCache?.appDate === appDate &&
    dailyTarotSnapshotCache.storageValue === storageValue
  ) {
    return dailyTarotSnapshotCache.reading;
  }

  const reading = getDailyTarotReadingFromBrowser(appDate);
  dailyTarotSnapshotCache = { appDate, reading, storageValue };

  return reading;
}

const orientationLabels = {
  upright: "정방향",
  reversed: "역방향",
} as const;

function DailyTarotOptionButton({
  option,
  index,
  onSelect,
}: {
  option: DailyTarotOption;
  index: number;
  onSelect: (option: DailyTarotOption) => void;
}) {
  const orientationLabel = orientationLabels[option.orientation];

  return (
    <button
      type="button"
      data-daily-tarot-option={option.id}
      aria-label={`${orientationLabel} 카드 선택지 ${index + 1}`}
      onClick={() => onSelect(option)}
      className={cn(
        "group flex min-h-[9.5rem] flex-col items-center justify-center rounded-[1.25rem] border border-[#b98255]/45 bg-[#070612]/62 p-2.5 shadow-[0_16px_34px_rgba(0,0,0,0.26)] ring-1 ring-[#d799ff]/10 transition",
        "hover:border-[#ffd08a]/70 hover:bg-[#140d24]/78 focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
      )}
    >
      <span className="relative block aspect-[5/8] w-full max-w-[5.5rem] overflow-hidden rounded-[0.7rem] shadow-[0_12px_28px_rgba(0,0,0,0.34)]">
        <Image
          src={manyangAssets.tarot.cardBack}
          alt=""
          fill
          sizes="88px"
          className={cn("object-contain", option.orientation === "reversed" ? "rotate-180" : "")}
          priority={index < 2}
        />
      </span>
      <span className="mt-2 text-center text-[12px] font-semibold text-[#f2c27d]">
        {orientationLabel}
      </span>
    </button>
  );
}

function DailyTarotResult({ reading }: { reading: DailyTarotReading }) {
  const orientationLabel = orientationLabels[reading.orientation];

  return (
    <section
      data-daily-tarot-state="result"
      className="mx-auto w-full max-w-[26rem] px-4 py-5 text-[#fff3d7]"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,9.5rem)_1fr] sm:items-center">
        <div className="mx-auto w-full max-w-[9.5rem]">
          <div className="relative aspect-[5/8] overflow-hidden rounded-[1rem] border border-[#ffd08a]/45 shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
            <Image
              src={reading.card.image}
              alt={`${reading.card.nameKo} ${orientationLabel}`}
              fill
              sizes="152px"
              className={cn("object-contain", reading.orientation === "reversed" ? "rotate-180" : "")}
              priority
            />
          </div>
        </div>

        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#f4b65f]">
            {orientationLabel}
          </p>
          <h2 className={cn("mt-1 text-2xl font-bold leading-tight text-[#ffe7b5]", ui.textGlow)}>
            {reading.card.nameKo}
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#d9b6ff]">{reading.card.nameEn}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/54 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
        <p className="text-[15px] font-bold leading-6 text-[#ffe7b5]">{reading.title}</p>
        <p className="text-[14px] leading-6 text-[#fff3d7]/88">{reading.message}</p>
        <p className="border-t border-[#b98255]/25 pt-3 text-[13px] leading-6 text-[#f2c27d]">
          {reading.advice}
        </p>
      </div>

      <p className="mt-4 text-center text-[12px] leading-5 text-[#c7a98a]">
        타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.
      </p>
    </section>
  );
}

export function DailyTarotClient({ appDate, initialReading }: DailyTarotClientProps) {
  const options = useMemo(() => createDailyTarotOptions(appDate, 6), [appDate]);
  const storedReading = useSyncExternalStore(
    subscribeToDailyTarot,
    () => getStableDailyTarotReadingSnapshot(appDate),
    () => initialReading,
  );
  const [selectedReading, setSelectedReading] = useState<DailyTarotReading | null>(initialReading);
  const storedReadingForDate = storedReading?.appDate === appDate ? storedReading : null;
  const selectedReadingForDate = selectedReading?.appDate === appDate ? selectedReading : null;
  const initialReadingForDate = initialReading?.appDate === appDate ? initialReading : null;
  const reading = storedReadingForDate ?? selectedReadingForDate ?? initialReadingForDate;

  function handleSelect(option: DailyTarotOption) {
    const nextReading = createDailyTarotReading({
      appDate,
      selectedAt: new Date().toISOString(),
      option,
    });

    setSelectedReading(nextReading);
    saveDailyTarotReadingToBrowser(nextReading);
  }

  if (reading) {
    return <DailyTarotResult reading={reading} />;
  }

  return (
    <section
      data-daily-tarot-state="draw-ready"
      className="mx-auto w-full max-w-[30rem] px-4 py-5 text-center text-[#fff3d7]"
    >
      <div className="mx-auto max-w-[22rem]">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#f4b65f]">{appDate}</p>
        <p className={cn("mt-2 text-[15px] font-semibold leading-6 text-[#ffe7b5]", ui.textGlow)}>
          마음이 닿는 뒷면 한 장을 골라 오늘의 흐름을 확인해 보세요.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option, index) => (
          <DailyTarotOptionButton key={option.id} option={option} index={index} onSelect={handleSelect} />
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-[21rem] text-[12px] leading-5 text-[#c7a98a]">
        타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.
      </p>
    </section>
  );
}
