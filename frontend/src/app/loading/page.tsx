import type { Metadata } from "next";

import { DreamLoadingPageClient } from "@/components/dream-loading-page-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoadingPage() {
  return <DreamLoadingPageClient />;
}
