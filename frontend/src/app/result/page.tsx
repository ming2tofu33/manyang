import type { Metadata } from "next";

import { DreamResultPageClient } from "@/components/dream-result-page-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type ResultPageProps = {
  searchParams?: Promise<{
    saveLatest?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const resolvedSearchParams = await searchParams;
  const shouldSaveLatest = getSingleSearchParam(resolvedSearchParams?.saveLatest) === "1";

  return <DreamResultPageClient shouldSaveLatest={shouldSaveLatest} />;
}
