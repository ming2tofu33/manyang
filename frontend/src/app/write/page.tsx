import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { cn, ui } from "@/lib/styles";

const moods = ["편안", "불안", "조급", "신기", "흐릿"];

export default function WritePage() {
  return (
    <AppShell
      background="/manyang/background-default.png"
      title="꿈쓰기"
      subtitle="어젯밤 꿈을 들려주세요"
      backHref="/"
    >
      <div className="mt-auto space-y-5 pb-5">
        <section className={cn(ui.panel, "p-5")}>
          <p className="text-sm text-[#f0bc7d]">검은냥 한마디</p>
          <p className="mt-2 text-lg leading-7 text-[#fff2d6]">
            짧아도 괜찮고, 뒤죽박죽이어도 괜찮다냥.
          </p>
        </section>

        <section className={cn(ui.panel, "p-4")}>
          <label htmlFor="dream" className="text-sm text-[#f0bc7d]">
            꿈 내용
          </label>
          <textarea
            id="dream"
            rows={7}
            placeholder="낡은 학교 복도에서 교실을 찾는 꿈을 꿨어요..."
            className={cn(ui.field, "mt-3 resize-none rounded-3xl p-4 text-base leading-7")}
          />
        </section>

        <section className={cn(ui.panel, "p-4")}>
          <p className="text-sm text-[#f0bc7d]">깼을 때 기분</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button key={mood} type="button" className={ui.chip}>
                {mood}
              </button>
            ))}
          </div>
        </section>

        <Link
          href="/loading"
          className="block transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
        >
          <Image
            src="/manyang/dreammemory-button-3.png"
            alt="해몽 받기"
            width={1199}
            height={382}
            sizes="382px"
            unoptimized
            className="h-auto w-full drop-shadow-[0_0_26px_rgba(156,82,210,0.42)]"
          />
        </Link>
      </div>
    </AppShell>
  );
}
