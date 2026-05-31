import type { Metadata } from "next";
import Image from "next/image";

import { AppShell } from "@/components/app-shell";
import { NightCheckInForm } from "@/components/night-checkin-form";
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
      backgroundOverlay={
        <>
          <div className="absolute inset-x-0 top-8 h-[25.4rem] overflow-hidden">
            <Image
              src={manyangAssets.illustrations.dreamseed}
              alt=""
              width={1254}
              height={1254}
              priority
              sizes="430px"
              className="absolute left-1/2 top-0 h-[25.4rem] w-[25.4rem] max-w-none -translate-x-1/2 object-contain"
            />
          </div>
          <div className="absolute inset-x-0 top-[17rem] h-[9rem] bg-[linear-gradient(180deg,rgba(5,4,11,0.00),rgba(5,4,11,0.92)_66%,rgba(5,4,11,0.99))]" />
        </>
      }
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
