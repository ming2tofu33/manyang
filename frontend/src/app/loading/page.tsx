import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { cn, ui } from "@/lib/styles";

const steps = ["꿈 조각을 모으는 중", "상징을 찾는 중", "꿈 영수증을 쓰는 중"];

export default function LoadingPage() {
  return (
    <AppShell background="/manyang/background-default.png" title="꿈을 읽는 중" backHref="/write">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-16">
        <div className="relative h-56 w-56">
          <Image src="/manyang/orb.png" alt="" fill sizes="224px" className="object-contain orb-pulse" />
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
        <Link href="/result" className={ui.secondaryAction}>
          결과 미리 보기
        </Link>
      </div>
    </AppShell>
  );
}
