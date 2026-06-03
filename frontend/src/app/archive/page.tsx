import type { Metadata } from "next";

import { ArchiveCalendar } from "@/components/archive-calendar";
import { ArchiveRecordEntryPanel } from "@/components/archive-record-entry-panel";
import { AppShell } from "@/components/app-shell";
import { DreamArchiveList } from "@/components/dream-archive-list";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArchivePage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="꿈 기록"
      subtitle="내가 꾼 꿈들을 돌아보는 시간"
      titleIconSrc={manyangAssets.pageIcons.archive}
      backHref="/"
    >
      <div className="mt-8 space-y-4 pb-5">
        <ArchiveRecordEntryPanel />
        <ArchiveCalendar />
        <DreamArchiveList />
      </div>
    </AppShell>
  );
}
