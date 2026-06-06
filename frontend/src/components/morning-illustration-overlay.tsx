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

export function getMorningIllustrationForCatReader(readerId: CatReaderId): string {
  const reader = getCatReaderById(readerId);

  return manyangAssets.illustrations.morningByCat[reader.assetKey];
}

export function MorningIllustrationOverlay() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const illustrationSrc = getMorningIllustrationForCatReader(selectedCatReaderId);

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[26rem] overflow-hidden">
        <Image
          key={illustrationSrc}
          src={illustrationSrc}
          alt=""
          width={1024}
          height={1024}
          priority
          sizes="430px"
          className="absolute left-1/2 top-0 h-[25.8rem] w-[25.8rem] max-w-none -translate-x-1/2 object-contain"
          data-morning-illustration-reader={selectedCatReaderId}
        />
      </div>
      <div className="absolute inset-x-0 top-[18.35rem] h-[9rem] bg-[linear-gradient(180deg,rgba(5,4,11,0.00),rgba(5,4,11,0.94)_66%,rgba(5,4,11,0.99))]" />
    </>
  );
}
