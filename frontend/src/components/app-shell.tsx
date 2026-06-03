import Image from "next/image";
import type { ReactNode } from "react";

import { manyangAssets } from "@/lib/manyang-assets";
import { mobileLayout } from "@/lib/mobile-layout";
import { cn, ui } from "@/lib/styles";

import { AssetIconButton } from "./asset-primitives";
import { BottomNav } from "./bottom-nav";
import { CatThemeFrameBackground } from "./cat-theme-frame-background";

type AppShellProps = {
  children: ReactNode;
  background?: string;
  backgroundLayer?: ReactNode;
  backgroundOverlay?: ReactNode;
  backgroundClassName?: string;
  scrimClassName?: string;
  bottomScrimClassName?: string;
  title?: string;
  subtitle?: string;
  titleIconSrc?: string;
  backHref?: string;
  leftAction?: "bell" | "none";
  rightAction?: "settings" | "share" | "calendar" | "book" | "none";
  showHeader?: boolean;
  showBottomNav?: boolean;
  contentMode?: "scroll" | "fixed";
};

export function AppShell({
  children,
  background = manyangAssets.backgrounds.default,
  backgroundLayer,
  backgroundOverlay,
  backgroundClassName = "object-cover opacity-68",
  scrimClassName = "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.10)_0%,rgba(5,4,11,0.22)_52%,rgba(5,4,11,0.95)_100%)]",
  bottomScrimClassName = "absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(180deg,transparent,#05040b_82%)]",
  title,
  subtitle,
  titleIconSrc,
  backHref,
  leftAction = "bell",
  rightAction = "settings",
  showHeader = true,
  showBottomNav = true,
  contentMode = "scroll",
}: AppShellProps) {
  const showRightAction = rightAction !== "none";
  const shouldUseCatThemeFrame = background === manyangAssets.backgrounds.default;
  const rightIcon =
    rightAction === "share"
      ? manyangAssets.actionIcons.share
      : rightAction === "calendar"
        ? manyangAssets.actionIcons.calendar
        : rightAction === "book"
          ? manyangAssets.actionIcons.book
          : manyangAssets.actionIcons.settings;
  const rightLabel =
    rightAction === "share"
      ? "공유"
      : rightAction === "calendar"
        ? "기록"
        : rightAction === "book"
          ? "도감"
          : "설정";

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#05040b] text-[#fff3d7]">
      <section className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#05040b] shadow-[0_0_90px_rgba(0,0,0,0.7)]">
        {backgroundLayer ??
          (shouldUseCatThemeFrame ? (
            <CatThemeFrameBackground />
          ) : (
            <Image
              src={background}
              alt=""
              fill
              priority
              sizes="430px"
              unoptimized
              className={backgroundClassName}
            />
          ))}
        <div className={scrimClassName} />
        {backgroundOverlay ? <div className="pointer-events-none absolute inset-0 z-[3]">{backgroundOverlay}</div> : null}
        <div className={bottomScrimClassName} />

        <div
          className={cn(
            "relative z-10 flex h-full min-h-0 flex-col pt-8",
            showBottomNav ? "pb-0" : "pb-1.5",
            mobileLayout.shellInlinePaddingClassName,
          )}
        >
          {showHeader ? (
            <header className={cn("flex justify-between", titleIconSrc ? "min-h-[6.4rem] items-start" : "min-h-14 items-center")}>
              {backHref ? (
                <AssetIconButton
                  href={backHref}
                  src={manyangAssets.actionIcons.arrowLeft}
                  label="뒤로 가기"
                  size="header"
                />
              ) : leftAction === "bell" ? (
                <AssetIconButton src={manyangAssets.actionIcons.bell} label="알림" size="header" />
              ) : (
                <span className="h-11 w-11 shrink-0" aria-hidden="true" />
              )}

              {title ? (
                <div className="min-w-0 flex-1 px-3 text-center">
                  {titleIconSrc ? (
                    <span className="relative mx-auto mb-1.5 block h-9 w-9">
                      <Image src={titleIconSrc} alt="" fill sizes="36px" unoptimized className="object-contain" />
                    </span>
                  ) : null}
                  <p className={`text-[1.72rem] font-semibold leading-tight text-[#ffd98a] ${ui.textGlow}`}>
                    {title}
                  </p>
                  {subtitle ? <p className="mt-1.5 whitespace-pre-line text-[15px] leading-6 text-[#fff3d7]/88">{subtitle}</p> : null}
                </div>
              ) : null}

              {showRightAction ? (
                <AssetIconButton src={rightIcon} label={rightLabel} size="header" />
              ) : (
                <span className="h-11 w-11 shrink-0" aria-hidden="true" />
              )}
            </header>
          ) : null}

          <div
            className={cn(
              "min-h-0 flex-1",
              contentMode === "fixed"
                ? "overflow-hidden pb-0"
                : "overflow-y-auto overscroll-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
            data-app-shell-content-mode={contentMode}
          >
            <div className="flex min-h-full flex-col">{children}</div>
          </div>
          {showBottomNav ? <BottomNav /> : null}
        </div>
      </section>
    </main>
  );
}
