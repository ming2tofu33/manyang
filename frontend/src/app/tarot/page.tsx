import type { Metadata } from "next";
import Link from "next/link";

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
        <div className="mx-auto mb-2 flex w-full max-w-[28rem] justify-end px-3">
          <Link
            href="/tarot/question"
            className="rounded-full border border-[#f2c27d]/36 bg-[#05040b]/48 px-3 py-1.5 text-[12px] font-bold text-[#f2c27d] shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition hover:border-[#ffd08a]/70 hover:text-[#ffe7b5] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            질문 타로
          </Link>
        </div>
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
