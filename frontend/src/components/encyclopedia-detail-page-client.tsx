"use client";

import type { EncyclopediaEntry } from "@manyang/backend";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { EncyclopediaDetailContent, type RelatedSymbolLink } from "@/components/encyclopedia-detail-content";
import {
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";

type EncyclopediaDetailPageClientProps = {
  entry: EncyclopediaEntry;
  relatedSymbols: RelatedSymbolLink[];
};

export function EncyclopediaDetailPageClient({ entry, relatedSymbols }: EncyclopediaDetailPageClientProps) {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );

  return (
    <AppShell
      background="/manyang/backgrounds/default.png"
      title={`${entry.symbol} 꿈`}
      subtitle={entry.coreMeanings.slice(0, 2).join(" · ")}
      backHref="/encyclopedia"
    >
      <EncyclopediaDetailContent
        entry={entry}
        relatedSymbols={relatedSymbols}
        selectedCatReaderId={selectedCatReaderId}
      />
    </AppShell>
  );
}
