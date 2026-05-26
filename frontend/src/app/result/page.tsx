import type { Metadata } from "next";

import { DreamResultPageClient } from "@/components/dream-result-page-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultPage() {
  return <DreamResultPageClient />;
}
