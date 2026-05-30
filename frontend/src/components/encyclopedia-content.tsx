import type { EncyclopediaEntry, RuntimeSymbolEntry } from "@manyang/backend";
import Image from "next/image";
import Link from "next/link";

import { EncyclopediaReaderGuideNote, EncyclopediaReaderIntroCard } from "@/components/encyclopedia-reader-guide-client";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

type MainCategory = EncyclopediaEntry["category"] | RuntimeSymbolEntry["category"];
type CategoryTab = "all" | MainCategory;

type EncyclopediaListEntry = Pick<EncyclopediaEntry, "symbol" | "slug"> & {
  category: MainCategory;
};

const categoryLabelMap: Record<MainCategory, string> = {
  abstract: "추상",
  action: "행동",
  animal: "동물",
  body: "몸",
  emotion: "감정",
  event: "사건",
  food: "음식",
  living_being: "생명체",
  nature: "자연",
  object: "사물",
  person: "사람",
  place: "장소",
  quantity: "수량",
  relationship: "관계",
  social: "사회적 장면",
  state: "상태",
  time: "시간",
};

const categoryIconMap: Record<MainCategory, string> = {
  abstract: manyangAssets.semanticIcons.crystalBall,
  action: manyangAssets.semanticIcons.sparkles,
  animal: manyangAssets.semanticIcons.paw,
  body: manyangAssets.icons.profile,
  emotion: manyangAssets.semanticIcons.cloud,
  event: manyangAssets.semanticIcons.star,
  food: manyangAssets.semanticIcons.sparkles,
  living_being: manyangAssets.semanticIcons.paw,
  nature: manyangAssets.semanticIcons.moon,
  object: manyangAssets.semanticIcons.key,
  person: manyangAssets.icons.profile,
  place: manyangAssets.semanticIcons.door,
  quantity: manyangAssets.semanticIcons.sparkles,
  relationship: manyangAssets.icons.profile,
  social: manyangAssets.icons.profile,
  state: manyangAssets.semanticIcons.cloud,
  time: manyangAssets.semanticIcons.moon,
};

const categoryDisplayOrder: MainCategory[] = [
  "place",
  "living_being",
  "animal",
  "object",
  "relationship",
  "person",
  "body",
  "food",
  "action",
  "event",
  "social",
  "nature",
  "state",
  "emotion",
  "quantity",
  "time",
  "abstract",
];

function getMainCategoryLabel(category: MainCategory): string {
  return categoryLabelMap[category];
}

function getCategoryTabs(entries: EncyclopediaListEntry[]): CategoryTab[] {
  const usedCategories = new Set(entries.map((entry) => entry.category));

  return ["all", ...categoryDisplayOrder.filter((category) => usedCategories.has(category))];
}

export function EncyclopediaContent({
  entries,
}: {
  entries: EncyclopediaListEntry[];
}) {
  const categories = getCategoryTabs(entries);

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
          {categories.map((category, index) => {
            const label = category === "all" ? "전체" : getMainCategoryLabel(category);

            return (
            <button
              key={category}
              type="button"
              aria-pressed={index === 0}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                index === 0
                  ? "border-[#c775ff] bg-[#32134d]/78 text-[#f4b5ff] shadow-[0_0_18px_rgba(199,117,255,0.28)]"
                  : "border-[#7c4a38]/70 bg-[rgba(8,6,17,0.58)] text-[#f4b65f] hover:border-[#d799ff]/60",
              )}
            >
              {label}
            </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {entries.map((entry) => {
            const categoryLabel = getMainCategoryLabel(entry.category);

            return (
            <Link
              key={entry.slug}
              href={`/encyclopedia/${entry.slug}`}
              className={cn(ui.symbolCard, "relative min-h-[9rem] overflow-hidden px-3")}
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
              <span
                aria-label={`상위 분류: ${categoryLabel}`}
                className="relative mt-3 rounded-full border border-[#7c4a38]/70 bg-[rgba(8,6,17,0.62)] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#f4b65f]"
              >
                {categoryLabel}
              </span>
              <span className="relative mt-2 text-lg font-semibold text-[#ffd98a]">{entry.symbol} 꿈</span>
            </Link>
            );
          })}
        </div>
      </section>

      <EncyclopediaReaderGuideNote />
    </div>
  );
}
