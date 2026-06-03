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

export function getNightCheckInBackgroundForCatReader(readerId: CatReaderId): string {
  const reader = getCatReaderById(readerId);

  return manyangAssets.illustrations.dreamseedByCat[reader.assetKey];
}

export function NightCheckInBackgroundOverlay() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const backgroundSrc = getNightCheckInBackgroundForCatReader(selectedCatReaderId);

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[25.4rem] overflow-hidden">
        <Image
          key={backgroundSrc}
          src={backgroundSrc}
          alt=""
          width={1254}
          height={1254}
          priority
          sizes="430px"
          className="absolute left-1/2 top-0 h-[25.4rem] w-[25.4rem] max-w-none -translate-x-1/2 object-contain"
        />
      </div>
      <div className="absolute inset-x-0 top-[17rem] h-[9rem] bg-[linear-gradient(180deg,rgba(5,4,11,0.00),rgba(5,4,11,0.92)_66%,rgba(5,4,11,0.99))]" />
    </>
  );
}
