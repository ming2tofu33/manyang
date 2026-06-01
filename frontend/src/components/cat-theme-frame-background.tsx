"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
  type CatReaderId,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";

type CatThemeFrameBackgroundProps = {
  className?: string;
};

export function getCatThemeFrameForCatReader(readerId: CatReaderId): string {
  const reader = getCatReaderById(readerId);

  return manyangAssets.backgrounds.themeFrames[reader.assetKey];
}

export function CatThemeFrameBackground({ className = "object-contain object-top opacity-90" }: CatThemeFrameBackgroundProps) {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const backgroundSrc = getCatThemeFrameForCatReader(selectedCatReaderId);

  return (
    <Image
      key={backgroundSrc}
      src={backgroundSrc}
      alt=""
      fill
      priority
      sizes="430px"
      unoptimized
      className={className}
      data-cat-theme-frame="current"
      data-cat-theme-frame-reader={selectedCatReaderId}
    />
  );
}
