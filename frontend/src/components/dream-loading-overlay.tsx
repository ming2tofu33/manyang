import Image from "next/image";
import { useEffect, useState } from "react";

import { getDreamLoadingSequence } from "@/lib/dream-loading-sequence";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";

type DreamLoadingOverlayProps = {
  isActive: boolean;
  background?: string;
  readerImage?: string;
  introImage?: string;
  elapsedMs?: number;
};

export function DreamLoadingOverlay({
  isActive,
  background = manyangAssets.backgrounds.blackCatInterpretation,
  readerImage = manyangAssets.loadingReaders.blackCat,
  introImage = background,
  elapsedMs: elapsedMsOverride,
}: DreamLoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(elapsedMsOverride ?? 0);
  const sequence = getDreamLoadingSequence(elapsedMsOverride ?? elapsedMs);
  const isReaderScene = sequence.scene === "reader";
  const isInterpretationScene = sequence.scene === "interpretation";
  const isOrbScene = sequence.scene === "orb";
  const sceneLabel = isReaderScene ? "고양이 등장" : isInterpretationScene ? "해석 중" : "오브 리딩";
  const defaultSupportingMessage = isOrbScene
    ? "오브가 맑아지면 꿈 영수증을 열게요."
    : "잠시 뒤 꿈 조각을 오브에 모을게요.";

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || elapsedMsOverride !== undefined) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(timer);
  }, [elapsedMsOverride, isActive]);

  if (!mounted && !isActive) return null;

  return (
    <div
      data-loading-scene={sequence.scene}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#05040b] transition-opacity duration-1000",
        isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition duration-1000 ease-out",
          isOrbScene ? "opacity-100 scale-100" : "opacity-0 scale-[1.012]",
        )}
      >
        <Image
          src={background}
          alt=""
          fill
          sizes="100vw"
          className="object-cover brightness-[0.5] contrast-[1.04]"
          priority
        />
      </div>

      <div
        className={cn(
          "absolute inset-0 transition duration-1000 ease-out",
          isReaderScene ? "opacity-100 scale-100" : "opacity-0 scale-[1.018]",
        )}
      >
        <Image
          src={readerImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover brightness-[0.96] contrast-[1.03]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.08)_0%,rgba(5,4,11,0.1)_42%,rgba(5,4,11,0.72)_100%)]" />
      </div>

      <div
        className={cn(
          "absolute inset-0 transition duration-1000 ease-out",
          isInterpretationScene ? "opacity-100 scale-100" : "opacity-0 scale-[1.012]",
        )}
      >
        <Image
          src={introImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover brightness-[1.01] contrast-[1.04] saturate-[1.03]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.02)_0%,rgba(5,4,11,0.03)_48%,rgba(5,4,11,0.7)_100%)]" />
      </div>

      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          isInterpretationScene
            ? "opacity-0"
            : "opacity-100 bg-[radial-gradient(circle_at_50%_42%,rgba(112,50,145,0.16),transparent_44%),linear-gradient(180deg,rgba(5,4,11,0.08),rgba(5,4,11,0.86))]",
        )}
      />

      <div
        className={cn(
          "relative z-10 flex h-full w-full flex-col items-center px-6 pt-8 text-center",
          isOrbScene ? "justify-center pb-10" : "justify-end pb-[5.25rem]",
        )}
      >
        <div
          className={cn(
            "relative flex h-[18rem] w-full max-w-[24rem] items-center justify-center transition duration-1000 ease-out",
            isOrbScene ? "mb-5 opacity-100 scale-100" : "pointer-events-none h-0 opacity-0 scale-105",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition duration-1000 ease-out",
              isOrbScene ? "opacity-100 scale-100" : "opacity-0 scale-105",
            )}
          >
            <div className="animate-orb-glow-premium relative h-[17rem] w-[17rem] sm:h-[21rem] sm:w-[21rem]">
              <Image
                src={manyangAssets.orbs.one}
                alt=""
                fill
                sizes="100vw"
                className="animate-orb-1 absolute object-contain drop-shadow-2xl"
                priority
              />
              <Image
                src={manyangAssets.orbs.two}
                alt=""
                fill
                sizes="100vw"
                className="animate-orb-2 absolute object-contain drop-shadow-2xl"
                priority
              />
              <Image
                src={manyangAssets.orbs.three}
                alt=""
                fill
                sizes="100vw"
                className="animate-orb-3 absolute object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        <div
          data-loading-copy-panel="true"
          className={cn(
            "w-full max-w-[22rem] rounded-[1.15rem] border px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.38),inset_0_0_24px_rgba(255,217,138,0.04)]",
            isOrbScene
              ? "border-[#d799ff]/24 bg-[rgba(12,8,24,0.58)]"
              : "border-[#f0bc7d]/32 bg-[rgba(5,4,11,0.68)]",
          )}
        >
          <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#f0bc7d]/74">
            {sceneLabel}
          </p>
          {isOrbScene ? (
            <div
              data-loading-step-indicator="true"
              className="mb-3 flex items-center gap-2 text-[0.72rem] font-semibold text-[#e8b6ff]/88"
            >
              <span className="shrink-0">오브 리딩 {sequence.stepLabel}</span>
              <span className="flex flex-1 gap-1" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      index <= sequence.stepIndex
                        ? "bg-[#ffd98a] shadow-[0_0_8px_rgba(255,217,138,0.85)]"
                        : "bg-[#7b5f85]/55",
                    )}
                  />
                ))}
              </span>
            </div>
          ) : null}

          <p className="animate-text-shimmer min-h-[3.2rem] text-balance text-[1.22rem] font-semibold leading-[1.65] tracking-normal sm:text-2xl">
            {sequence.message}
          </p>

          <p className="mx-auto mt-3 min-h-[2.25rem] max-w-[19rem] text-[0.88rem] font-medium leading-6 text-[#f4cfa8]/78">
            {sequence.supportingMessage ?? defaultSupportingMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
