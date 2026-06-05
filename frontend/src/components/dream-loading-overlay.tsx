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
  orbImage?: string;
  elapsedMs?: number;
};

export function DreamLoadingOverlay({
  isActive,
  background = manyangAssets.backgrounds.blackCatInterpretation,
  readerImage = manyangAssets.loadingReaders.blackCat,
  introImage = background,
  orbImage = manyangAssets.orbs.catWithStand.blackCat,
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
    ? "오브가 맑아지면 꿈 영수증을 펼칠게요."
    : "곧 꿈 조각을 오브에 모을게요.";

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
          isOrbScene ? "justify-start pt-[38dvh] pb-0" : "justify-end pb-[2.65rem]",
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
                src={orbImage}
                alt=""
                fill
                sizes="100vw"
                className="orb-pulse absolute object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {isOrbScene ? (
          <div
            data-loading-orb-caption="true"
            className="relative w-full max-w-[22rem] px-3 text-center"
            aria-live="polite"
          >
            <span className="sr-only">진행 단계 {sequence.stepLabel}</span>
            <div
              data-loading-step-indicator="true"
              className="mb-3 flex items-center justify-center gap-2"
              aria-hidden="true"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rotate-45 rounded-[0.08rem] transition duration-500",
                    index <= sequence.stepIndex
                      ? "bg-[#ffd98a] shadow-[0_0_10px_rgba(255,217,138,0.95)]"
                      : "border border-[#b893c6]/38 bg-[#2b1736]/32",
                  )}
                />
              ))}
            </div>

            <p className="animate-text-shimmer mx-auto min-h-[3.1rem] max-w-[20rem] text-balance text-[1.22rem] font-semibold leading-[1.62] tracking-normal text-[#fff5dc] drop-shadow-[0_3px_14px_rgba(0,0,0,0.72)] [word-break:keep-all] sm:text-2xl">
              {sequence.message}
            </p>

            <p className="mx-auto mt-2 min-h-[2rem] max-w-[18.5rem] text-[0.84rem] font-medium leading-6 text-[#f4cfa8]/72 drop-shadow-[0_2px_10px_rgba(0,0,0,0.74)] [word-break:keep-all]">
              {sequence.supportingMessage ?? defaultSupportingMessage}
            </p>
          </div>
        ) : (
          <div
            data-loading-copy-panel="true"
            className="w-full max-w-[20.5rem] rounded-[1rem] border border-[#f0bc7d]/28 bg-[rgba(5,4,11,0.6)] px-3.5 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.34),inset_0_0_20px_rgba(255,217,138,0.035)]"
            aria-live="polite"
          >
            <p className="mb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-[#f0bc7d]/70">
              {sceneLabel}
            </p>

            <p className="animate-text-shimmer mx-auto min-h-[2.55rem] max-w-[18.75rem] text-balance text-[1.05rem] font-semibold leading-[1.52] tracking-normal [word-break:keep-all] sm:text-xl">
              {sequence.message}
            </p>

            <p className="mx-auto mt-2 min-h-[1.6rem] max-w-[17.25rem] text-[0.76rem] font-medium leading-5 text-[#f4cfa8]/74 [word-break:keep-all]">
              {sequence.supportingMessage ?? defaultSupportingMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
