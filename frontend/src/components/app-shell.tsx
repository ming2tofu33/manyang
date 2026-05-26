import Image from "next/image";
import type { ReactNode } from "react";

import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

import { AssetIconButton } from "./asset-primitives";
import { BottomNav } from "./bottom-nav";

type AppShellProps = {
  children: ReactNode;
  background?: string;
  backgroundOverlay?: ReactNode;
  backgroundClassName?: string;
  scrimClassName?: string;
  bottomScrimClassName?: string;
  title?: string;
  subtitle?: string;
  titleIconSrc?: string;
  backHref?: string;
  rightAction?: "settings" | "share" | "calendar" | "book";
  showHeader?: boolean;
};

export function AppShell({
  children,
  background = "/manyang/backgrounds/home.png",
  backgroundOverlay,
  backgroundClassName = "object-cover opacity-68",
  scrimClassName = "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.10)_0%,rgba(5,4,11,0.22)_52%,rgba(5,4,11,0.95)_100%)]",
  bottomScrimClassName = "absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(circle_at_50%_18%,rgba(119,56,173,0.34),transparent_34%),linear-gradient(180deg,transparent,#05040b_70%)]",
  title,
  subtitle,
  titleIconSrc,
  backHref,
  rightAction = "settings",
  showHeader = true,
}: AppShellProps) {
  const rightIcon =
    rightAction === "share"
      ? manyangAssets.icons.share
      : rightAction === "calendar"
        ? manyangAssets.icons.calendar
        : rightAction === "book"
          ? manyangAssets.icons.book
          : manyangAssets.icons.settings;
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
        <Image
          src={background}
          alt=""
          fill
          priority
          sizes="430px"
          unoptimized
          className={backgroundClassName}
        />
        <div className={scrimClassName} />
        {backgroundOverlay ? <div className="pointer-events-none absolute inset-0 z-[3]">{backgroundOverlay}</div> : null}
        <div className={bottomScrimClassName} />

        <div className="relative z-10 flex h-full min-h-0 flex-col px-6 pb-1.5 pt-8">
          {showHeader ? (
            <header className={cn("flex justify-between", titleIconSrc ? "min-h-[6.4rem] items-start" : "min-h-14 items-center")}>
              {backHref ? (
                <AssetIconButton
                  href={backHref}
                  src={manyangAssets.icons.arrowLeft}
                  label="뒤로 가기"
                  size="header"
                />
              ) : (
                <AssetIconButton src={manyangAssets.icons.bell} label="알림" size="header" />
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

              <AssetIconButton src={rightIcon} label={rightLabel} size="header" />
            </header>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
            <div className="flex min-h-full flex-col">{children}</div>
          </div>
          <BottomNav />
        </div>
      </section>
    </main>
  );
}
