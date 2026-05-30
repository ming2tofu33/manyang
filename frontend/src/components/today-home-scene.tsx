"use client";

import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { AssetIconButton } from "@/components/asset-primitives";
import { HomeCatBackgroundTransition } from "@/components/home-cat-background-transition";
import { HomeBackgroundEffects } from "@/components/home-background-effects";
import { TodayHomeActions } from "@/components/today-home-actions";
import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { getHomeTitleTheme } from "@/lib/home-title-theme";
import { manyangAssets } from "@/lib/manyang-assets";

export function TodayHomeScene() {
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const selectedReader = getCatReaderById(selectedCatReaderId);
  const titleTheme = getHomeTitleTheme(selectedReader.id);
  const selectedBackground = manyangAssets.backgrounds[selectedReader.homeBackgroundKey];
  const selectedBackgroundClassName = "object-cover opacity-100 brightness-[1.06] contrast-[1.08] saturate-[1.08]";

  return (
    <AppShell
      background={selectedBackground}
      backgroundLayer={
        <HomeCatBackgroundTransition
          background={selectedBackground}
          readerId={selectedReader.id}
          backgroundClassName={selectedBackgroundClassName}
        />
      }
      backgroundOverlay={<HomeBackgroundEffects readerId={selectedReader.id} />}
      backgroundClassName={selectedBackgroundClassName}
      scrimClassName="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.00)_0%,rgba(5,4,11,0.03)_36%,rgba(5,4,11,0.20)_64%,rgba(5,4,11,0.90)_100%)]"
      bottomScrimClassName="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,transparent,#05040b_72%)]"
      showHeader={false}
      contentMode="fixed"
    >
      <header className="relative flex min-h-[78px] items-start justify-between">
        <AssetIconButton src={manyangAssets.actionIcons.bell} label="알림" size="header" className="relative z-20" />

        <div className="pointer-events-none absolute left-[4.1rem] right-[4.1rem] top-0 z-10 py-1 text-center">
          <div className={titleTheme.haloClassName} />
          <div className="relative">
            <p className={`text-[11px] ${titleTheme.eyebrowClassName}`}>MANYANG DREAM READER</p>
            <h1 className={`mt-1.5 text-[26px] font-semibold leading-tight ${titleTheme.titleClassName}`}>
              마냥 꿈해몽
            </h1>
          </div>
        </div>

        <AssetIconButton src={manyangAssets.actionIcons.settings} label="설정" size="header" className="relative z-20" />
      </header>

      <TodayHomeActions />
    </AppShell>
  );
}
