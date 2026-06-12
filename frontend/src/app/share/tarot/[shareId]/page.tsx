import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DailyTarotClient } from "@/components/daily-tarot-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { findSharedResult } from "@/lib/server/manyang-db";
import { isSharedTarotPayload, validateShareRecordSlug } from "@/lib/share-records";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "오늘의 타로 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

type SharedTarotPageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

export default async function SharedTarotPage({ params }: SharedTarotPageProps) {
  const { shareId } = await params;
  const publicId = validateShareRecordSlug(shareId);

  if (!publicId) {
    notFound();
  }

  const record = await findSharedResult(publicId, "tarot");

  if (!record || !isSharedTarotPayload(record.payload)) {
    notFound();
  }

  const reading = record.payload;

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="오늘의 타로"
      titleIconSrc={manyangAssets.pageIcons.tarot}
      backHref="/"
      rightAction="none"
      showBottomNav={false}
    >
      <section data-daily-tarot-page className="flex min-h-full flex-col px-1 pb-4 pt-1 text-[#fff3d7]">
        <DailyTarotClient
          appDate={reading.appDate}
          initialReading={reading}
          initialUserId={null}
          isSharedView
        />
      </section>
    </AppShell>
  );
}
