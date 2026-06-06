import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { MorningMoodForm } from "@/components/morning-mood-form";
import { MorningIllustrationOverlay } from "@/components/morning-illustration-overlay";
import { morningMoodCopy } from "@/lib/morning-mood-options";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function MorningPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      backgroundOverlay={<MorningIllustrationOverlay />}
      title={morningMoodCopy.pageTitle}
      subtitle={morningMoodCopy.pageScrollSubtitle}
      titleIconSrc={manyangAssets.pageIcons.morningPawprint}
      backHref="/"
      rightAction="calendar"
      showBottomNav={false}
    >
      <MorningMoodForm />
    </AppShell>
  );
}
