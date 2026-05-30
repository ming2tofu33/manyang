"use client";

import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { DreamResultReceipt } from "@/components/dream-result-receipt";
import { getCatReaderById } from "@/lib/cat-readers";
import {
  getLatestAnalysisSnapshotFromBrowser,
  subscribeToDreamStorage,
} from "@/lib/dream-storage";
import { manyangAssets } from "@/lib/manyang-assets";

export function DreamResultPageClient() {
  const payload = useSyncExternalStore(
    subscribeToDreamStorage,
    getLatestAnalysisSnapshotFromBrowser,
    () => null,
  );
  const reader = getCatReaderById(payload?.catReaderType ?? payload?.analysis.reader?.id);

  return (
    <AppShell
      background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
      backgroundClassName="object-cover opacity-88 brightness-[0.92] contrast-[1.04]"
      scrimClassName="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.24)_0%,rgba(5,4,11,0.34)_45%,rgba(5,4,11,0.92)_100%)]"
      title="오늘의 꿈 영수증"
      backHref="/write"
      rightAction="share"
      showBottomNav={false}
    >
      <DreamResultReceipt />
    </AppShell>
  );
}
