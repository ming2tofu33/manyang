import { encyclopediaEntries } from "@manyang/backend";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EncyclopediaDetailPageClient } from "@/components/encyclopedia-detail-page-client";
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

  return <EncyclopediaDetailPageClient entry={entry} relatedSymbols={getRelatedSymbolLinks(entry)} />;
}
