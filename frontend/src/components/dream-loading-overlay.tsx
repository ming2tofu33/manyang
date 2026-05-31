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
      <div className="absolute inset-0 animate-bg-cinematic opacity-45" style={{ transformOrigin: "center 50%" }}>
        <Image src={background} alt="background" fill sizes="100vw" className="object-cover" priority />
      </div>

      <div
        className={cn(
          "absolute inset-0 transition duration-1000 ease-out",
          isReaderScene ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-[1.035]",
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
          isInterpretationScene ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-[1.035]",
        )}
      >
        <Image
          src={introImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover brightness-[0.94] contrast-[1.04]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.08)_0%,rgba(5,4,11,0.18)_46%,rgba(5,4,11,0.76)_100%)]" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(112,50,145,0.18),transparent_42%),linear-gradient(180deg,rgba(5,4,11,0.14),rgba(5,4,11,0.88))]" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 pb-10 pt-8 text-center">
        <div className="relative flex h-[20rem] w-full max-w-[24rem] items-center justify-center">
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition duration-1000 ease-out",
              isOrbScene ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105",
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
              <span className="absolute -left-3 top-10 h-14 w-14 animate-orb-1">
                <Image
                  src={manyangAssets.semanticIcons.key}
                  alt=""
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-contain opacity-75"
                />
              </span>
              <span className="absolute -right-2 bottom-12 h-14 w-14 animate-orb-2">
                <Image
                  src={manyangAssets.semanticIcons.cloud}
                  alt=""
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-contain opacity-75"
                />
              </span>
              <span className="absolute bottom-2 left-1/2 h-12 w-12 -translate-x-1/2 animate-orb-3">
                <Image
                  src={manyangAssets.semanticIcons.sparkles}
                  alt=""
                  fill
                  sizes="48px"
                  unoptimized
                  className="object-contain opacity-80"
                />
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-[9.5rem] w-full max-w-[22rem] space-y-4">
          {isOrbScene ? (
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#d799ff]/28 bg-[rgba(18,10,31,0.62)] px-3 py-1.5 text-[0.78rem] font-semibold text-[#e8b6ff] shadow-[0_0_18px_rgba(185,97,255,0.18)]">
              <span>해몽 단계 {sequence.stepLabel}</span>
              <span className="flex gap-1" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      index <= sequence.stepIndex
                        ? "bg-[#ffd98a] shadow-[0_0_8px_rgba(255,217,138,0.85)]"
                        : "bg-[#7b5f85]/55",
                    )}
                  />
                ))}
              </span>
            </div>
          ) : null}

          <p className="animate-text-shimmer min-h-[3.6rem] text-balance text-[1.35rem] font-semibold leading-[1.65] tracking-normal sm:text-2xl">
            {sequence.message}
          </p>

          <p className="mx-auto min-h-[2.75rem] max-w-[19rem] text-[0.9rem] font-medium leading-6 text-[#f4cfa8]/78">
            {sequence.supportingMessage ?? "해몽이 끝나면 꿈 영수증이 자동으로 열려요."}
          </p>
        </div>
      </div>
    </div>
  );
}
