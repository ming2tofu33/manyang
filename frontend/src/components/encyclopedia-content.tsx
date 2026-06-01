import { EncyclopediaReaderGuideNote, EncyclopediaReaderIntroCard } from "@/components/encyclopedia-reader-guide-client";
import { EncyclopediaSearchClient } from "@/components/encyclopedia-search-client";
import type { EncyclopediaSearchEntry } from "@/lib/encyclopedia-search";

type EncyclopediaListEntry = EncyclopediaSearchEntry;

export function EncyclopediaContent({
  entries,
}: {
  entries: EncyclopediaListEntry[];
}) {
  return (
    <div className="mt-6 space-y-5 pb-5">
      <EncyclopediaReaderIntroCard />

      <EncyclopediaSearchClient entries={entries} />

      <EncyclopediaReaderGuideNote />
    </div>
  );
}
