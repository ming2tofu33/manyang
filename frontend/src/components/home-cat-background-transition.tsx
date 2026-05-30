"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { CatReaderId } from "@/lib/cat-readers";
import { getHomeCatTransitionTheme } from "@/lib/home-cat-transition-theme";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";

type HomeCatBackgroundTransitionProps = {
  background: string;
  readerId: CatReaderId;
  backgroundClassName: string;
};

type PreviousBackground = {
  background: string;
  readerId: CatReaderId;
};

type HomeCatTransitionStyle = CSSProperties & {
  "--home-cat-transition-left-image": string;
  "--home-cat-transition-right-image": string;
};

export const homeCatTransitionDurationMs = 2400;
export const homeCatTransitionCloudAssets = [
  manyangAssets.transitions.catMagicCloudLeft,
  manyangAssets.transitions.catMagicCloudRight,
];

export function HomeCatBackgroundTransition({
  background,
  readerId,
  backgroundClassName,
}: HomeCatBackgroundTransitionProps) {
  const lastBackgroundRef = useRef(background);
  const lastReaderIdRef = useRef(readerId);
  const [previousBackground, setPreviousBackground] = useState<PreviousBackground | null>(null);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const theme = getHomeCatTransitionTheme(readerId);
  const transitionStyle: HomeCatTransitionStyle = {
    "--home-cat-transition-left-image": `url(${manyangAssets.transitions.catMagicCloudLeft})`,
    "--home-cat-transition-right-image": `url(${manyangAssets.transitions.catMagicCloudRight})`,
  };

  useEffect(() => {
    const decodedImages = homeCatTransitionCloudAssets.map((src) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
      void image.decode?.().catch(() => undefined);
      return image;
    });

    return () => {
      decodedImages.forEach((image) => {
        image.src = "";
      });
    };
  }, []);

  useEffect(() => {
    if (lastBackgroundRef.current === background) {
      lastReaderIdRef.current = readerId;
      return undefined;
    }

    setPreviousBackground({
      background: lastBackgroundRef.current,
      readerId: lastReaderIdRef.current,
    });
    setTransitionIndex((current) => current + 1);
    lastBackgroundRef.current = background;
    lastReaderIdRef.current = readerId;

    const timeoutId = window.setTimeout(() => {
      setPreviousBackground(null);
    }, homeCatTransitionDurationMs);

    return () => window.clearTimeout(timeoutId);
  }, [background, readerId]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#05040b]"
      data-home-cat-transition="root"
      style={transitionStyle}
    >
      {homeCatTransitionCloudAssets.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          width={1}
          height={1}
          priority
          unoptimized
          className="pointer-events-none absolute h-px w-px opacity-0"
          data-home-cat-transition={index === 0 ? "preload-left" : "preload-right"}
        />
      ))}

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

      {/* Left Mist Wave */}
      <div
        key={`mist-left-${transitionIndex}`}
        className={cn("home-cat-transition-mist-left", theme.mistClassName)}
        data-home-cat-transition="mist-left"
      />

      {/* Right Mist Wave */}
      <div
        key={`mist-right-${transitionIndex}`}
        className={cn("home-cat-transition-mist-right", theme.mistClassName)}
        data-home-cat-transition="mist-right"
      />

      {/* Center Ambient Glow */}
      <div
        key={`glow-${transitionIndex}`}
        className={cn("home-cat-transition-glow", theme.glowClassName)}
        data-home-cat-transition="glow"
      />
    </div>
  );
}
