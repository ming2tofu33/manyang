import { Bell, ChevronLeft, Settings, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ui } from "@/lib/styles";

import { BottomNav } from "./bottom-nav";

type AppShellProps = {
  children: ReactNode;
  background?: string;
  backgroundClassName?: string;
  scrimClassName?: string;
  bottomScrimClassName?: string;
  title?: string;
  subtitle?: string;
  backHref?: string;
  rightAction?: "settings" | "share";
  showHeader?: boolean;
};

export function AppShell({
  children,
  background = "/manyang/home-background.png",
  backgroundClassName = "object-cover opacity-68",
  scrimClassName = "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.10)_0%,rgba(5,4,11,0.22)_52%,rgba(5,4,11,0.95)_100%)]",
  bottomScrimClassName = "absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(circle_at_50%_18%,rgba(119,56,173,0.34),transparent_34%),linear-gradient(180deg,transparent,#05040b_70%)]",
  title,
  subtitle,
  backHref,
  rightAction = "settings",
  showHeader = true,
}: AppShellProps) {
  const RightIcon = rightAction === "share" ? Share2 : Settings;

  return (
    <main className="min-h-screen overflow-hidden bg-[#05040b] text-[#fff3d7]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#05040b] shadow-[0_0_90px_rgba(0,0,0,0.7)]">
        <Image
          src={background}
          alt=""
          fill
          priority
          sizes="430px"
          className={backgroundClassName}
        />
        <div className={scrimClassName} />
        <div className={bottomScrimClassName} />

        <div className="relative z-10 flex min-h-screen flex-col px-6 pb-1.5 pt-8">
          {showHeader ? (
            <header className="flex min-h-14 items-center justify-between">
              {backHref ? (
                <Link href={backHref} className={ui.orbButton} aria-label="뒤로 가기">
                  <ChevronLeft size={29} strokeWidth={1.8} />
                </Link>
              ) : (
                <button type="button" className={ui.orbButton} aria-label="알림">
                  <Bell size={24} strokeWidth={1.7} />
                </button>
              )}

              {title ? (
                <div className="text-center">
                  <p className={`text-2xl font-semibold text-[#ffd98a] ${ui.textGlow}`}>
                    {title}
                  </p>
                  {subtitle ? <p className="mt-1 text-sm text-[#fff3d7]/82">{subtitle}</p> : null}
                </div>
              ) : null}

              <button type="button" className={ui.orbButton} aria-label={rightAction}>
                <RightIcon size={24} strokeWidth={1.7} />
              </button>
            </header>
          ) : null}

          <div className="flex flex-1 flex-col">{children}</div>
          <BottomNav />
        </div>
      </section>
    </main>
  );
}
