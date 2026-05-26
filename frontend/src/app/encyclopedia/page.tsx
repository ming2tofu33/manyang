import { encyclopediaEntries } from "@manyang/backend";
import type { Metadata } from "next";

import { EncyclopediaPageClient } from "@/components/encyclopedia-page-client";
import { getIndexableEncyclopediaEntries } from "@/lib/seo-encyclopedia";

export const metadata: Metadata = {
  title: "꿈해몽 백과 | 마냥 꿈해몽",
  description: "고양이 해몽사와 함께 꿈속 상징의 의미를 찾아보고, 내 꿈을 꿈 영수증으로 정리해보세요.",
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
  return <EncyclopediaPageClient entries={getIndexableEncyclopediaEntries(encyclopediaEntries).slice(0, 12)} />;
}
