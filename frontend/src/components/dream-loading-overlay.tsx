import Image from "next/image";
import { useEffect, useState } from "react";

import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";

type DreamLoadingOverlayProps = {
  isActive: boolean;
  background?: string;
};

export function DreamLoadingOverlay({
  isActive,
  background = manyangAssets.backgrounds.blackCatInterpretation,
}: DreamLoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(timer);
  }, [isActive]);

  if (!mounted && !isActive) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#05040b] transition-opacity duration-1000",
        isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Background that holds, then zooms/fades */}
      <div className="absolute inset-0 animate-bg-cinematic" style={{ transformOrigin: "center 50%" }}>
        <Image
          src={background}
          alt="background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Looping orb container with premium glow effect */}
      <div className="animate-fade-in-delayed relative z-10 flex h-full w-full flex-col items-center justify-center gap-16">
        <div className="animate-orb-glow-premium relative h-[250px] w-[250px] sm:h-[350px] sm:w-[350px]">
          <Image
            src={manyangAssets.orbs.one}
            alt="orb1"
            fill
            className="animate-orb-1 absolute object-contain drop-shadow-2xl"
            priority
          />
          <Image
            src={manyangAssets.orbs.two}
            alt="orb2"
            fill
            className="animate-orb-2 absolute object-contain drop-shadow-2xl"
            priority
          />
          <Image
            src={manyangAssets.orbs.three}
            alt="orb3"
            fill
            className="animate-orb-3 absolute object-contain drop-shadow-2xl"
            priority
          />
          <span className="absolute -left-5 top-8 h-16 w-16 animate-orb-1">
            <Image src={manyangAssets.icons.key} alt="" fill sizes="64px" unoptimized className="object-contain opacity-75" />
          </span>
          <span className="absolute -right-4 bottom-10 h-16 w-16 animate-orb-2">
            <Image src={manyangAssets.icons.cloud} alt="" fill sizes="64px" unoptimized className="object-contain opacity-75" />
          </span>
          <span className="absolute bottom-0 left-1/2 h-14 w-14 -translate-x-1/2 animate-orb-3">
            <Image src={manyangAssets.icons.sparkles} alt="" fill sizes="56px" unoptimized className="object-contain opacity-80" />
          </span>
        </div>

        {/* Cinematic Shimmering Typography */}
        <div className="text-center">
          <p className="animate-text-shimmer text-xl font-light tracking-[0.2em] sm:text-2xl">
            기억의 조각을 모으는 중...
          </p>
        </div>
      </div>
    </div>
  );
}
