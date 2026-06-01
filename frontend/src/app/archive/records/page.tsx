import { AppShell } from "@/components/app-shell";
import { ArchiveRecordsClient } from "@/components/archive-records-client";
import { manyangAssets } from "@/lib/manyang-assets";

export default function ArchiveRecordsPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="꿈 영수증함"
      subtitle="해몽받은 꿈과 하루의 흔적을 모아보는 곳"
      backHref="/archive"
      rightAction="none"
    >
      <ArchiveRecordsClient />
    </AppShell>
  );
}
