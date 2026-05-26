import type { EncyclopediaEntry } from "@manyang/backend";
import Image from "next/image";
import Link from "next/link";

import { getCatReaderById, type CatReaderId } from "@/lib/cat-readers";
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
  selectedCatReaderId,
}: {
  entries: EncyclopediaListEntry[];
  selectedCatReaderId: CatReaderId;
}) {
  const reader = getCatReaderById(selectedCatReaderId);

  return (
    <div className="mt-6 space-y-5 pb-5">
      <section className="relative overflow-hidden rounded-[1.35rem] border border-[#7c4a38]/60 bg-[rgba(5,4,12,0.74)] px-4 py-4 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="relative h-16 w-16 shrink-0">
            <Image
              src={manyangAssets.illustrations[reader.assetKey]}
              alt={`${reader.name} 백과 안내`}
              fill
              sizes="64px"
              unoptimized
              className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.26)]"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#f0bc7d]">{reader.name} 사전 안내</p>
            <p className="mt-1 text-[15px] leading-6 text-[#fff3d7]">
              꿈속의 상징은 마음을 비추는 거울이라냥.
            </p>
          </div>
        </div>
      </section>

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

      <AssetlessGuide readerId={selectedCatReaderId} />
    </div>
  );
}

function AssetlessGuide({ readerId }: { readerId: CatReaderId }) {
  const reader = getCatReaderById(readerId);

  return (
    <section className="relative overflow-hidden rounded-[1.1rem] border border-[#7c4a38]/58 bg-[linear-gradient(135deg,rgba(44,22,74,0.82),rgba(8,6,18,0.82))] p-3 shadow-[0_0_24px_rgba(0,0,0,0.26)]">
      <div className="relative z-10 flex items-center gap-3">
        <span className="relative h-16 w-16 shrink-0">
          <Image
            src={manyangAssets.illustrations[reader.assetKey]}
            alt=""
            fill
            sizes="64px"
            unoptimized
            className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.28)]"
          />
        </span>
        <p className="text-sm leading-6 text-[#f1c5d8]">
          꿈은 같은 상징이라도 상황에 따라 다르게 해석될 수 있다냥. 여러 상징을 함께 보면 더 정확한 의미를 찾을 수 있다냥.
        </p>
      </div>
      <span className="pointer-events-none absolute right-4 top-4 text-2xl text-[#b970ff]/60">☾</span>
    </section>
  );
}
