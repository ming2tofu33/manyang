"use client";

import type { EncyclopediaEntry } from "@manyang/backend";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { EncyclopediaContent } from "@/components/encyclopedia-content";
import {
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";

type EncyclopediaPageClientProps = {
  entries: Pick<EncyclopediaEntry, "symbol" | "slug" | "category">[];
};

export function EncyclopediaPageClient({ entries }: EncyclopediaPageClientProps) {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="꿈해몽 백과"
      subtitle="궁금한 꿈의 상징을 찾아보세요."
      backHref="/"
    >
      <EncyclopediaContent entries={entries} selectedCatReaderId={selectedCatReaderId} />
    </AppShell>
  );
}
