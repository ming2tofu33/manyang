"use client";

import { useSyncExternalStore } from "react";

import { DreamLoadingOverlay } from "@/components/dream-loading-overlay";
import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";

export function DreamLoadingPageClient() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const reader = getCatReaderById(selectedCatReaderId);

  return (
    <DreamLoadingOverlay
      isActive
      background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
      readerImage={manyangAssets.loadingReaders[reader.assetKey]}
      introImage={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
      orbImage={manyangAssets.orbs.catWithStand[reader.assetKey]}
    />
  );
}
