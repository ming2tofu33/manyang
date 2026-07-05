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
        <nav
          data-tarot-mode-selector="true"
          aria-label="타로 모드"
          className="mx-auto mb-3 grid w-full max-w-[28rem] grid-cols-2 gap-2 px-3"
        >
          <div
            data-tarot-mode-option="daily"
            aria-current="page"
            className="min-h-[4.75rem] rounded-[0.9rem] border border-[#ffd08a]/62 bg-[#f2c27d]/14 px-3 py-3 text-left shadow-[0_12px_26px_rgba(0,0,0,0.22)] ring-1 ring-[#ffd08a]/16"
          >
            <p className="text-[14px] font-extrabold leading-5 text-[#ffe7b5]">오늘의 한 장</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-[#c7a98a]">
              오늘 하루의 분위기와 기준을 봐요
            </p>
          </div>
          <Link
            href="/tarot/question"
            data-tarot-mode-option="question"
            className="min-h-[4.75rem] rounded-[0.9rem] border border-[#b98255]/36 bg-[#05040b]/52 px-3 py-3 text-left shadow-[0_12px_26px_rgba(0,0,0,0.2)] transition hover:border-[#ffd08a]/70 hover:bg-[#140d24]/78 focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            <span className="block text-[14px] font-extrabold leading-5 text-[#f2c27d]">질문 타로</span>
            <span className="mt-1 block text-[12px] font-semibold leading-5 text-[#c7a98a]">
              궁금한 주제를 고르고 한 장으로 비춰봐요
            </span>
          </Link>
        </nav>
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
