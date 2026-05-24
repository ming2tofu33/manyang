import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { cn, ui } from "@/lib/styles";

const symbols = ["복도", "신발", "비", "고양이", "문", "학교", "계단", "바다", "창문", "엘리베이터"];

export default function EncyclopediaPage() {
  return (
    <AppShell background="/manyang/background-default.png" title="상징 백과" subtitle="꿈속 상징들이 모이는 곳" backHref="/">
      <div className="mt-8 space-y-5 pb-5">
        <div className={cn(ui.panel, "px-4 py-3 text-[#caa37b]")}>상징을 검색해보세요</div>
        <section>
          <p className="mb-3 text-lg text-[#ffd98a]">이번 주 자주 열린 상징</p>
          <div className="grid grid-cols-2 gap-3">
            {symbols.map((symbol, index) => (
              <Link
                key={symbol}
                href={`/encyclopedia/${index === 0 ? "corridor" : symbol}`}
                className={ui.symbolCard}
              >
                <span className="text-3xl">{index + 1}</span>
                <span className="mt-5 text-xl text-[#ffd98a]">{symbol}</span>
                <span className="mt-1 text-sm text-[#bd8f68]">{Math.max(1, 6 - index)}회</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
