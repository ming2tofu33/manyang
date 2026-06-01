import { AppShell } from "@/components/app-shell";
import { ArchiveRecordDetailClient } from "@/components/archive-record-detail-client";
import { manyangAssets } from "@/lib/manyang-assets";

type ArchiveRecordDetailPageProps = {
  params: Promise<{
    recordId: string;
  }>;
};

export default async function ArchiveRecordDetailPage({ params }: ArchiveRecordDetailPageProps) {
  const { recordId } = await params;

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="기록 자세히 보기"
      subtitle="남겨둔 꿈의 흔적을 다시 읽어봐요"
      backHref="/archive/records"
      rightAction="none"
    >
      <ArchiveRecordDetailClient recordId={decodeURIComponent(recordId)} />
    </AppShell>
  );
}
