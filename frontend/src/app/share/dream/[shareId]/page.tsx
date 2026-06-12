import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DreamResultReceipt } from "@/components/dream-result-receipt";
import { getCatReaderById } from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { findSharedResult } from "@/lib/server/manyang-db";
import { isSharedDreamPayload, validateShareRecordSlug } from "@/lib/share-records";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "오늘의 꿈 영수증 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

type SharedDreamPageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

export default async function SharedDreamPage({ params }: SharedDreamPageProps) {
  const { shareId } = await params;
  const publicId = validateShareRecordSlug(shareId);

  if (!publicId) {
    notFound();
  }

  const record = await findSharedResult(publicId, "dream");

  if (!record || !isSharedDreamPayload(record.payload)) {
    notFound();
  }

  const payload = record.payload;
  const reader = getCatReaderById(payload.catReaderType ?? payload.analysis.reader?.id);

  return (
    <AppShell
      background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
      backgroundClassName="object-cover opacity-88 brightness-[0.92] contrast-[1.04]"
      scrimClassName="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.24)_0%,rgba(5,4,11,0.34)_45%,rgba(5,4,11,0.92)_100%)]"
      title="오늘의 꿈 영수증"
      backHref="/"
      rightAction="none"
      showBottomNav={false}
    >
      <DreamResultReceipt payloadOverride={payload} isSharedView />
    </AppShell>
  );
}
