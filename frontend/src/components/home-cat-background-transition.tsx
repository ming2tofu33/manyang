"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/styles";

type HomeCatBackgroundTransitionProps = {
  background: string;
  backgroundClassName: string;
};

type PreviousBackground = {
  background: string;
};

export const homeCatTransitionDurationMs = 900;

export function HomeCatBackgroundTransition({
  background,
  backgroundClassName,
}: HomeCatBackgroundTransitionProps) {
  const lastBackgroundRef = useRef(background);
  const [previousBackground, setPreviousBackground] = useState<PreviousBackground | null>(null);

  useEffect(() => {
    if (lastBackgroundRef.current === background) {
      return undefined;
    }

    setPreviousBackground({
      background: lastBackgroundRef.current,
    });
    lastBackgroundRef.current = background;

    const timeoutId = window.setTimeout(() => {
      setPreviousBackground(null);
    }, homeCatTransitionDurationMs);

    return () => window.clearTimeout(timeoutId);
  }, [background]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#05040b]"
      data-home-cat-transition="root"
    >
      <Image
        key={background}
        src={background}
        alt=""
        fill
        priority
        sizes="430px"
        unoptimized
        data-home-cat-transition="current"
        className={cn(backgroundClassName, "home-cat-transition-current")}
      />

      {previousBackground ? (
        <Image
          key={previousBackground.background}
          src={previousBackground.background}
          alt=""
          fill
          priority
          sizes="430px"
          unoptimized
          data-home-cat-transition="previous"
          className={cn(backgroundClassName, "home-cat-transition-previous")}
        />
      ) : null}
    </div>
  );
}
