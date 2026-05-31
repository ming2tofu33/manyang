import { encyclopediaEntries } from "@manyang/backend";
import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { EncyclopediaContent } from "@/components/encyclopedia-content";
import { manyangAssets } from "@/lib/manyang-assets";
import { getIndexableEncyclopediaEntries } from "@/lib/seo-encyclopedia";

export const metadata: Metadata = {
  title: "꿈해몽 백과 | 마냥 꿈해몽",
  description: "꿈속 상징의 의미를 찾아보고, 내 꿈을 꿈 영수증과 고양이 테마로 정리해보세요.",
  alternates: {
    canonical: "/encyclopedia",
  },
  openGraph: {
    title: "꿈해몽 백과 | 마냥 꿈해몽",
    description: "꿈속 상징의 의미를 찾아보고, 내 꿈을 꿈 영수증으로 정리해보세요.",
    url: "/encyclopedia",
    siteName: "마냥 꿈해몽",
    locale: "ko_KR",
    type: "website",
  },
};

export default function EncyclopediaPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="꿈해몽 백과"
      subtitle="궁금한 꿈의 상징을 찾아보세요"
      backHref="/"
    >
      <EncyclopediaContent entries={getIndexableEncyclopediaEntries(encyclopediaEntries).slice(0, 12)} />
    </AppShell>
  );
}
