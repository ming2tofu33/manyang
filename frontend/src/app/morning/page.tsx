import type { Metadata } from "next";
import Image from "next/image";

import { AppShell } from "@/components/app-shell";
import { MorningMoodForm } from "@/components/morning-mood-form";
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
      background="/manyang/backgrounds/default.png"
      backgroundOverlay={
        <>
          <div className="absolute inset-x-0 top-[2.25rem] h-[26rem] overflow-hidden">
            <Image
              src={manyangAssets.illustrations.morning}
              alt=""
              width={1254}
              height={1254}
              priority
              sizes="430px"
              className="absolute left-1/2 top-0 h-[25.8rem] w-[25.8rem] max-w-none -translate-x-1/2 object-contain"
            />
          </div>
          <div className="absolute inset-x-0 top-[20.6rem] h-[9rem] bg-[linear-gradient(180deg,rgba(5,4,11,0.00),rgba(5,4,11,0.94)_66%,rgba(5,4,11,0.99))]" />
        </>
      }
      title={morningMoodCopy.pageTitle}
      subtitle={morningMoodCopy.pageSubtitle}
      titleIconSrc={manyangAssets.icons.moon}
      backHref="/"
      rightAction="calendar"
    >
      <MorningMoodForm />
    </AppShell>
  );
}
