import { Bell, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ui } from "@/lib/styles";

export default function TodayPage() {
  return (
    <AppShell
      background="/manyang/home-background-mobile.png"
      backgroundClassName="object-cover opacity-100 brightness-[1.06] contrast-[1.08] saturate-[1.08]"
      scrimClassName="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.00)_0%,rgba(5,4,11,0.03)_36%,rgba(5,4,11,0.20)_64%,rgba(5,4,11,0.90)_100%)]"
      bottomScrimClassName="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,transparent,#05040b_72%)]"
      showHeader={false}
    >
      <header className="relative flex min-h-[78px] items-start justify-between">
        <button type="button" className={`${ui.orbButton} relative z-20`} aria-label="알림">
          <Bell size={23} strokeWidth={1.7} />
        </button>

        <div className="pointer-events-none absolute left-[4.1rem] right-[4.1rem] top-0 z-10 py-1 text-center">
          <div className="absolute inset-x-[-2rem] -top-5 bottom-[-0.5rem] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.54)_42%,rgba(0,0,0,0.17)_68%,transparent_82%)]" />
          <div className="relative">
            <p className="text-[11px] tracking-[0.43em] text-[#f4b65f]">
              MANYANG DREAM
            </p>
            <h1 className={`mt-1.5 text-[26px] font-semibold leading-tight text-[#ffd98a] ${ui.textGlow}`}>
              마냥 꿈해몽
            </h1>
            <p className="mx-auto mt-1.5 max-w-[320px] text-[14px] leading-5 text-[#fff3d7]">
              사라진 꿈을 고양이가 읽어드립니다
            </p>
          </div>
        </div>

        <button type="button" className={`${ui.orbButton} relative z-20`} aria-label="설정">
          <Settings size={23} strokeWidth={1.7} />
        </button>
      </header>

      <div className="mt-auto space-y-1.5 pb-1">
        <Link
          href="/write"
          className="mx-auto block w-[86%] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
        >
          <Image
            src="/manyang/dreammemory-button-1.png"
            alt="꿈 비춰보기"
            width={1207}
            height={405}
            sizes="382px"
            unoptimized
            className="h-auto w-full drop-shadow-[0_0_26px_rgba(156,82,210,0.42)]"
          />
        </Link>
        <Link
          href="/morning"
          className="mx-auto block w-[68%] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
        >
          <Image
            src="/manyang/dreammemory-button-2.png"
            alt="기억나지 않아요"
            width={924}
            height={191}
            sizes="382px"
            unoptimized
            className="h-auto w-full drop-shadow-[0_0_18px_rgba(0,0,0,0.36)]"
          />
        </Link>
        <Link
          href="/morning"
          className="mx-auto block h-10 px-4 text-center text-base text-[#f2c27d] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
        >
          아침 기분만 남기기
        </Link>
      </div>
    </AppShell>
  );
}
