import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { DailyTarotClient } from "@/components/daily-tarot-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { getPawprintAppDate } from "@/lib/pawprints";
import { isAdminUser } from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type TarotPageProps = {
  searchParams?: Promise<{
    adminTest?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveAdminTarotTestMode(requestedAdminTest: boolean, userId: string | null): Promise<boolean> {
  if (!requestedAdminTest || !userId) {
    return false;
  }

  try {
    return await isAdminUser(userId);
  } catch {
    return false;
  }
}

export default async function TarotPage({ searchParams }: TarotPageProps) {
  const resolvedSearchParams = await searchParams;
  const appDate = getPawprintAppDate();
  const initialUserId = await getAuthenticatedUserId();
  const isAdminTarotTestMode = await resolveAdminTarotTestMode(
    getSingleSearchParam(resolvedSearchParams?.adminTest) === "1",
    initialUserId,
  );

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="오늘의 타로"
      subtitle="카드의 방향까지 직접 골라 오늘의 흐름을 확인해요."
      titleIconSrc={manyangAssets.pageIcons.tarot}
      backHref="/"
      rightAction="none"
      showBottomNav={false}
    >
      <section data-daily-tarot-page className="flex min-h-full flex-col px-1 pb-4 pt-1 text-[#fff3d7]">
        <DailyTarotClient
          appDate={appDate}
          ignoreStoredReading={isAdminTarotTestMode}
          initialReading={null}
          initialUserId={initialUserId}
        />
      </section>
    </AppShell>
  );
}
