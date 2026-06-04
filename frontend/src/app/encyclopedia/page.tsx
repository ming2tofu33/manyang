import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { EncyclopediaContent } from "@/components/encyclopedia-content";
import { EncyclopediaBackgroundOverlay } from "@/components/encyclopedia-reader-guide-client";
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
      backgroundLayer={<div className="absolute inset-0 bg-[#05040b]" />}
      backgroundOverlay={<EncyclopediaBackgroundOverlay />}
      title="꿈해몽 백과"
      subtitle="궁금한 꿈의 상징을 찾아보세요"
      titleIconSrc={manyangAssets.pageIcons.encyclopedia}
      backHref="/"
    >
      <EncyclopediaContent entries={getIndexableEncyclopediaEntries()} />
    </AppShell>
  );
}
