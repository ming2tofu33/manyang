import type { Metadata } from "next";

import { ArchiveCalendar } from "@/components/archive-calendar";
import { AppShell } from "@/components/app-shell";
import { DreamArchiveList } from "@/components/dream-archive-list";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArchivePage() {
  return (
    <AppShell background="/manyang/backgrounds/default.png" title="꿈 기록" subtitle="내가 꾼 꿈들을 돌아보는 시간" backHref="/">
      <div className="mt-8 space-y-4 pb-5">
        <ArchiveCalendar />
        <DreamArchiveList />
      </div>
    </AppShell>
  );
}
