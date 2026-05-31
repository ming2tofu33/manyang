import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { NightCheckInForm } from "@/components/night-checkin-form";
import { NightCheckInBackgroundOverlay } from "@/components/night-checkin-background-overlay";
import { manyangAssets } from "@/lib/manyang-assets";
import { nightCheckInCopy } from "@/lib/night-checkin-options";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function NightPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      backgroundOverlay={<NightCheckInBackgroundOverlay />}
      title="✧ 밤의 기록 ✧"
      subtitle={nightCheckInCopy.pageSubtitle}
      titleIconSrc={manyangAssets.semanticIcons.moon}
      backHref="/"
      rightAction="calendar"
      showBottomNav={false}
    >
      <NightCheckInForm />
    </AppShell>
  );
}
