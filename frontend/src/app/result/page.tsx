import Image from "next/image";

import { AppShell } from "@/components/app-shell";
import { ui } from "@/lib/styles";

export default function ResultPage() {
  return (
    <AppShell background="/manyang/background-default.png" title="오늘의 꿈 영수증" backHref="/write" rightAction="share">
      <div className="mt-5 space-y-4 pb-5">
        <section className="relative mx-auto min-h-[890px] w-full max-w-[360px] overflow-hidden">
          <Image
            src="/manyang/dreamreceipt-empty.png"
            alt=""
            fill
            sizes="360px"
            className="object-contain drop-shadow-[0_18px_60px_rgba(0,0,0,0.38)]"
          />
          <div className="relative z-10 mx-auto flex min-h-[890px] w-[78%] flex-col px-1 pt-[152px] text-[#2f2117]">
          <h1 className="text-center text-2xl font-semibold leading-snug text-[#24180f]">
            맨발로 복도를 달린 꿈
          </h1>
          <div className="mt-5 flex justify-center gap-2 text-sm text-[#5b4029]">
            <span>2026.05.24</span>
            <span>|</span>
            <span>불안함</span>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["학교", "복도", "신발"].map((symbol) => (
              <span key={symbol} className="rounded-full border border-[#7b5536]/40 px-4 py-2 text-sm text-[#4b3422]">
                {symbol}
              </span>
            ))}
          </div>
          <p className="mt-7 text-[15px] leading-7 text-[#2f2117]">
            이 꿈은 목적지보다 준비 상태가 더 신경 쓰이는 마음과 연결되어 보인다냥.
            복도는 과정과 이동을, 맨발은 아직 충분히 준비되지 않았다는 감각을 보여주는 듯해요.
          </p>
          <p className="mt-5 border-t border-[#8b6345]/30 pt-5 text-[15px] leading-7 text-[#2f2117]">
            오늘은 미뤄둔 준비물 하나만 먼저 확인해보자냥.
          </p>
          </div>
        </section>
        <button type="button" className={ui.primaryAction}>
          기록에 저장하기
        </button>
      </div>
    </AppShell>
  );
}
