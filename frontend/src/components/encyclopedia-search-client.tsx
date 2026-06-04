"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type EncyclopediaSearchCategory,
  type EncyclopediaSearchEntry,
  filterEncyclopediaSearchEntries,
  getEncyclopediaCategoryLabel,
  getEncyclopediaCategoryTabs,
} from "@/lib/encyclopedia-search";
import { getEncyclopediaCategoryIcon } from "@/lib/encyclopedia-category-icons";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

function EncyclopediaCard({ entry }: { entry: EncyclopediaSearchEntry }) {
  const categoryLabel = getEncyclopediaCategoryLabel(entry.category);

  return (
    <Link
      href={`/encyclopedia/${entry.slug}`}
      className={cn(ui.symbolCard, "relative min-h-[9rem] overflow-hidden px-3")}
    >
      <span className="relative h-12 w-12">
        <Image
          src={getEncyclopediaCategoryIcon(entry.category)}
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
}

export function EncyclopediaSearchClient({
  entries,
  initialLimit = 12,
  pageSize = 12,
}: {
  entries: EncyclopediaSearchEntry[];
  initialLimit?: number;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EncyclopediaSearchCategory>("all");
  const loadSentinelRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = query.trim();
  const filterKey = useMemo(
    () => `${normalizedQuery}::${selectedCategory}::${initialLimit}::${entries.map((entry) => entry.slug).join("|")}`,
    [entries, initialLimit, normalizedQuery, selectedCategory],
  );
  const [visiblePage, setVisiblePage] = useState(() => ({
    key: filterKey,
    limit: initialLimit,
  }));
  const categories = useMemo(() => getEncyclopediaCategoryTabs(entries), [entries]);
  const filteredEntries = useMemo(
    () => filterEncyclopediaSearchEntries(entries, { query, category: selectedCategory }),
    [entries, query, selectedCategory],
  );
  const isFilteredView = normalizedQuery.length > 0 || selectedCategory !== "all";
  const visibleLimit = visiblePage.key === filterKey ? visiblePage.limit : initialLimit;
  const visibleEntries = filteredEntries.slice(0, visibleLimit);
  const canLoadMore = visibleEntries.length < filteredEntries.length;
  const resultCountLabel = `${filteredEntries.length} / ${entries.length}`;
  const statusMessage = canLoadMore
    ? "상징을 더 펼치는 중이에요..."
    : isFilteredView
      ? "검색된 상징은 여기까지예요."
      : "모든 상징을 살펴봤어요.";

  const loadMoreEntries = useCallback(() => {
    setVisiblePage((currentPage) => {
      const currentLimit = currentPage.key === filterKey ? currentPage.limit : initialLimit;

      return {
        key: filterKey,
        limit: Math.min(currentLimit + pageSize, filteredEntries.length),
      };
    });
  }, [filterKey, filteredEntries.length, initialLimit, pageSize]);

  useEffect(() => {
    const sentinel = loadSentinelRef.current;

    if (!sentinel || !canLoadMore || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (observedEntries) => {
        if (observedEntries.some((entry) => entry.isIntersecting)) {
          loadMoreEntries();
        }
      },
      {
        rootMargin: "360px 0px 520px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [canLoadMore, loadMoreEntries]);

  return (
    <section className="space-y-4">
      <label className={cn(ui.panel, "flex items-center gap-3 px-4 py-2.5 text-[#caa37b]")}>
        <span className="relative h-7 w-7 shrink-0">
          <Image src={manyangAssets.actionIcons.search} alt="" fill sizes="32px" unoptimized className="object-contain" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="꿈 상징 검색"
          placeholder="무슨 꿈이 궁금한가요?"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#ffe7b7] placeholder:text-[#caa37b] focus:outline-none"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#ffd98a]">{isFilteredView ? "검색 결과" : "많이 찾는 꿈해몽"}</h2>
          <span
            className="shrink-0 text-xs font-semibold text-[#caa37b]"
            data-encyclopedia-result-count={`${filteredEntries.length}/${entries.length}`}
          >
            {resultCountLabel}개
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const isSelected = category === selectedCategory;
            const label = category === "all" ? "전체" : getEncyclopediaCategoryLabel(category);

            return (
              <button
                key={category}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  ui.insetFocus,
                  isSelected
                    ? ui.selectedPill
                    : "border-[#7c4a38]/70 bg-[rgba(8,6,17,0.58)] text-[#f4b65f] hover:border-[#d799ff]/60",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {visibleEntries.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {visibleEntries.map((entry) => (
                <EncyclopediaCard key={entry.slug} entry={entry} />
              ))}
            </div>
            <div
              ref={loadSentinelRef}
              className="min-h-16 px-4 py-5 text-center text-[12px] font-semibold leading-5 text-[#caa37b]"
              data-encyclopedia-load-sentinel="true"
              aria-live="polite"
            >
              {statusMessage}
            </div>
          </>
        ) : (
          <div className={cn(ui.panel, "px-4 py-8 text-center")}>
            <p className="text-base font-semibold text-[#ffd98a]">아직 맞는 상징을 찾지 못했어요.</p>
            <p className="mt-2 text-sm leading-6 text-[#caa37b]">다른 단어나 비슷한 장면으로 다시 찾아보세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}
