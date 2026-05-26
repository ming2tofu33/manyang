"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { AssetTextButton } from "@/components/asset-primitives";
import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

const steps = ["꿈 조각을 모으는 중", "상징을 찾는 중", "꿈 영수증을 쓰는 중"];

export function DreamLoadingPageClient() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const reader = getCatReaderById(selectedCatReaderId);

  return (
    <AppShell
      background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
      backgroundClassName="object-cover opacity-88 brightness-[0.92] contrast-[1.04]"
      scrimClassName="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.30)_0%,rgba(5,4,11,0.42)_52%,rgba(5,4,11,0.95)_100%)]"
      title="꿈을 읽는 중"
      backHref="/write"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-16">
        <div className="relative h-56 w-56">
          <Image src="/manyang/orbs/orb-transparent.png" alt="" fill sizes="224px" className="object-contain orb-pulse" />
        </div>
        <div className="w-full space-y-4">
          {steps.map((step, index) => (
            <div key={step} className={cn(ui.panel, "flex items-center gap-4 px-4 py-3")}>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[#d799ff]/50 bg-[#3d1d58]/60 text-[#ffd98a]">
                {index + 1}
              </span>
              <span className="text-lg text-[#fff3d7]">{step}</span>
            </div>
          ))}
        </div>
        <AssetTextButton
          href="/result"
          frame={manyangAssets.boxes.pillSparkles}
          iconSrc={manyangAssets.icons.crystalBall}
          contentClassName="min-h-[3.75rem] text-lg"
        >
          결과 미리 보기
        </AssetTextButton>
      </div>
    </AppShell>
  );
}
