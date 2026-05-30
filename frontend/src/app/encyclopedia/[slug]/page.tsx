import { encyclopediaEntries } from "@manyang/backend";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EncyclopediaDetailContent } from "@/components/encyclopedia-detail-content";
import { manyangAssets } from "@/lib/manyang-assets";
import {
  createSymbolCanonicalPath,
  createSymbolSeoDescription,
  createSymbolSeoTitle,
  getIndexableEncyclopediaEntries,
  getSiteUrl,
  siteName,
} from "@/lib/seo-encyclopedia";

type EncyclopediaDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getEntryBySlug(slug: string) {
  return encyclopediaEntries.find((entry) => entry.slug === slug);
}

function getRelatedSymbolLinks(entry: NonNullable<ReturnType<typeof getEntryBySlug>>) {
  return entry.relatedSymbols.map((symbol) => {
    const relatedEntry = encyclopediaEntries.find((candidate) => candidate.symbol === symbol);

    return {
      symbol,
      slug: relatedEntry?.slug ?? null,
    };
  });
}

export function generateStaticParams() {
  return getIndexableEncyclopediaEntries().map((entry) => ({
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: EncyclopediaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);

  if (!entry) {
    return {
      title: "꿈해몽 백과 | 마냥 꿈해몽",
    };
  }

  const title = createSymbolSeoTitle(entry);
  const description = createSymbolSeoDescription(entry);
  const canonicalPath = createSymbolCanonicalPath(entry);
  const canonicalUrl = `${getSiteUrl()}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      locale: "ko_KR",
      type: "article",
    },
  };
}

export default async function EncyclopediaDetailPage({ params }: EncyclopediaDetailPageProps) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title={`${entry.symbol} 꿈`}
      subtitle={entry.coreMeanings.slice(0, 2).join(" · ")}
      backHref="/encyclopedia"
      showBottomNav={false}
    >
      <EncyclopediaDetailContent entry={entry} relatedSymbols={getRelatedSymbolLinks(entry)} />
    </AppShell>
  );
}
