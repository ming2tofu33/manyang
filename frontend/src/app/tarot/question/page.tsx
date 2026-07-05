import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { QuestionTarotClient } from "@/components/question-tarot-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { getPawprintAppDate } from "@/lib/pawprints";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function TarotQuestionPage() {
  const appDate = getPawprintAppDate();
  const initialUserId = await getAuthenticatedUserId();

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="질문 타로"
      subtitle="궁금한 주제를 고르고 한 장으로 비춰봐요."
      titleIconSrc={manyangAssets.pageIcons.tarot}
      backHref="/tarot"
      rightAction="none"
      showBottomNav={false}
    >
      <section data-question-tarot-page className="flex min-h-full flex-col px-1 pb-4 pt-1 text-[#fff3d7]">
        <QuestionTarotClient appDate={appDate} initialReading={null} initialUserId={initialUserId} />
      </section>
    </AppShell>
  );
}
