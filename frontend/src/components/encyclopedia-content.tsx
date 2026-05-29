import type { EncyclopediaEntry } from "@manyang/backend";
import Image from "next/image";
import Link from "next/link";

import { EncyclopediaReaderGuideNote, EncyclopediaReaderIntroCard } from "@/components/encyclopedia-reader-guide-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

const categories = ["전체", "장소", "동물", "사물", "자연", "행동", "감정", "사람"];

type EncyclopediaListEntry = Pick<EncyclopediaEntry, "symbol" | "slug" | "category">;

const categoryIconMap: Record<EncyclopediaEntry["category"], string> = {
  action: manyangAssets.icons.sparkles,
  animal: manyangAssets.icons.paw,
  emotion: manyangAssets.icons.cloud,
  nature: manyangAssets.icons.moon,
  object: manyangAssets.icons.key,
  person: manyangAssets.icons.profile,
  place: manyangAssets.icons.door,
};

export function EncyclopediaContent({
  entries,
}: {
  entries: EncyclopediaListEntry[];
}) {
  return (
    <div className="mt-6 space-y-5 pb-5">
      <EncyclopediaReaderIntroCard />

      <div className={cn(ui.panel, "flex items-center gap-3 px-4 py-3 text-[#caa37b]")}>
        <span className="relative h-8 w-8 shrink-0">
          <Image src={manyangAssets.icons.search} alt="" fill sizes="32px" unoptimized className="object-contain" />
        </span>
        <span>무슨 꿈이 궁금한가요?</span>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#ffd98a]">많이 찾는 꿈해몽</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                index === 0
                  ? "border-[#c775ff] bg-[#32134d]/78 text-[#f4b5ff] shadow-[0_0_18px_rgba(199,117,255,0.28)]"
                  : "border-[#7c4a38]/70 bg-[rgba(8,6,17,0.58)] text-[#f4b65f] hover:border-[#d799ff]/60",
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.slug}
              href={`/encyclopedia/${entry.slug}`}
              className={cn(ui.symbolCard, "relative min-h-[8.1rem] overflow-hidden px-3")}
            >
              <span className="relative h-12 w-12">
                <Image
                  src={categoryIconMap[entry.category]}
                  alt=""
                  fill
                  sizes="48px"
                  unoptimized
                  className="object-contain drop-shadow-[0_0_12px_rgba(255,217,138,0.28)]"
                />
              </span>
              <span className="relative mt-3 text-lg font-semibold text-[#ffd98a]">{entry.symbol} 꿈</span>
            </Link>
          ))}
        </div>
      </section>

      <EncyclopediaReaderGuideNote />
    </div>
  );
}
