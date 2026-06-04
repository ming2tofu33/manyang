"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createArchiveRecordViews,
  filterArchiveRecordViews,
  type ArchiveRecordFilterType,
  type ArchiveRecordView,
} from "@/lib/archive-record-view";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { useArchiveDreamRecords } from "@/lib/use-archive-dream-records";
import { useRoutineRecords } from "@/lib/use-routine-records";

const filterTabs: Array<{ type: ArchiveRecordFilterType; label: string }> = [
  { type: "all", label: "전체" },
  { type: "dream", label: "꿈 영수증" },
  { type: "pawprint", label: "발자국 기록" },
  { type: "night_checkin", label: "밤의 기록" },
];

const recordTypeIcons: Record<ArchiveRecordView["type"], string> = {
  dream: manyangAssets.calendarRecordIcons.dream,
  night_checkin: manyangAssets.calendarRecordIcons.night,
  pawprint: manyangAssets.calendarRecordIcons.pawprint,
};

function formatArchiveDate(date: string): string {
  return date.replaceAll("-", ".");
}

function RecordTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.slice(0, 4).map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#9d6545]/42 px-2.5 py-1 text-[11px] leading-none text-[#7b4c35]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function DreamReceiptCard({
  view,
  onOpenDream,
  onDeleteDream,
}: {
  view: ArchiveRecordView;
  onOpenDream: (view: ArchiveRecordView) => void;
  onDeleteDream?: (view: ArchiveRecordView) => void;
}) {
  const dreamRecordId = view.dreamRecordId ?? view.raw.dreamRecord?.id;

  return (
    <article className="relative overflow-hidden rounded-[1.15rem] border border-[#8b6345]/60 bg-[#ead2a6] p-4 text-[#2f2117] shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <span className="absolute right-5 top-0 h-12 w-6 bg-[#5a247d]" aria-hidden="true" />
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[#8a603d]">
            {formatArchiveDate(view.date)} <span className="mx-1">|</span> {view.categoryLabel}
          </p>
          <h2 className="mt-2 line-clamp-2 text-[1.28rem] font-semibold leading-8">{view.title}</h2>
          <RecordTags tags={view.tags} />
          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-[#3b2a1f]/84">{view.summary}</p>
        </div>
        <div className="relative h-[6.25rem] w-[5.5rem] shrink-0 overflow-hidden rounded-[0.8rem] border border-[#8b6345]/40 bg-[#1a1028]">
          <Image
            src={manyangAssets.backgrounds.default}
            alt=""
            fill
            sizes="88px"
            unoptimized
            className="scale-125 object-cover opacity-90"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onOpenDream(view)}
          className="flex min-h-10 flex-1 items-center justify-between rounded-[0.75rem] border border-[#8b6345]/38 bg-[#f3dfbb]/60 px-3 text-sm font-semibold text-[#4b2c44] transition hover:bg-[#f6e7c8] focus:outline-none focus:ring-2 focus:ring-[#7a3a93]"
        >
          <span>자세히 보기</span>
          <span className="relative h-5 w-5" aria-hidden="true">
            <Image src={manyangAssets.actionIcons.arrowRight} alt="" fill sizes="20px" unoptimized className="object-contain" />
          </span>
        </button>
        {dreamRecordId && onDeleteDream ? (
          <button
            type="button"
            onClick={() => onDeleteDream(view)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.75rem] border border-[#8b6345]/38 bg-[#f3dfbb]/60 transition hover:bg-[#f6e7c8] focus:outline-none focus:ring-2 focus:ring-[#7a3a93]"
            aria-label={`${view.title} 기록 삭제`}
            title="기록 삭제"
            data-dream-record-delete-action={dreamRecordId}
          >
            <span className="relative h-5 w-5" aria-hidden="true">
              <Image src={manyangAssets.actionIcons.trash} alt="" fill sizes="20px" unoptimized className="object-contain" />
            </span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ArchiveRecordListCard({
  view,
  onOpenDream,
  onDeleteDream,
}: {
  view: ArchiveRecordView;
  onOpenDream: (view: ArchiveRecordView) => void;
  onDeleteDream?: (view: ArchiveRecordView) => void;
}) {
  if (view.type === "dream") {
    return <DreamReceiptCard view={view} onOpenDream={onOpenDream} onDeleteDream={onDeleteDream} />;
  }

  return (
    <Link
      href={view.detailHref ?? "/archive/records"}
      className={cn(
        ui.panel,
        "group relative block overflow-hidden p-4 transition hover:border-[#ffd08a]/58",
        ui.insetFocus,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[rgba(255,217,138,0.06)] ring-1 ring-[#d799ff]/14">
          <span className="relative h-7 w-7">
            <Image src={recordTypeIcons[view.type]} alt="" fill sizes="28px" unoptimized className="object-contain" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-[#f0bc7d]">
            {formatArchiveDate(view.date)} <span className="mx-1">|</span> {view.categoryLabel}
          </span>
          <span className="mt-1 block text-[1.15rem] font-semibold leading-7 text-[#ffd98a]">{view.title}</span>
          <span className="mt-1 block text-[13px] leading-6 text-[#fff3d7]/76">{view.summary}</span>
          {view.metaParts.length > 0 ? (
            <span className="mt-3 flex flex-wrap gap-1.5">
              {view.metaParts.slice(0, 4).map((part) => (
                <span
                  key={part}
                  className="rounded-full border border-[#b98255]/38 bg-[rgba(6,4,12,0.44)] px-2.5 py-1 text-[11px] leading-none text-[#f2c27d]"
                >
                  {part}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="relative mt-2 h-6 w-6 shrink-0 opacity-75 transition group-hover:translate-x-0.5" aria-hidden="true">
          <Image src={manyangAssets.actionIcons.arrowRight} alt="" fill sizes="24px" unoptimized className="object-contain" />
        </span>
      </div>
    </Link>
  );
}

export function ArchiveRecordsClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ArchiveRecordFilterType>("all");
  const [deleteError, setDeleteError] = useState("");
  const { dreamRecords, isLoadingServerRecords, openDreamRecord, deleteDreamRecord, source } = useArchiveDreamRecords();
  const { pawprints, morningMoodRecords, nightCheckInRecords, source: routineSource, isLoadingRoutineRecords } =
    useRoutineRecords();
  const visiblePawprints = pawprints;
  const visibleNightCheckInRecords = nightCheckInRecords;
  const views = createArchiveRecordViews({
    dreamRecords,
    pawprints: visiblePawprints,
    nightCheckInRecords: visibleNightCheckInRecords,
    morningMoodRecords,
  });
  const filteredViews = filterArchiveRecordViews(views, { query, type: selectedType });
  const isLoadingArchive = (isLoadingServerRecords || (source === "server" && isLoadingRoutineRecords)) && views.length === 0;

  function handleOpenDream(view: ArchiveRecordView) {
    const record = view.raw.dreamRecord;

    if (record && openDreamRecord(record)) {
      router.push("/result");
    }
  }

  async function handleDeleteDream(view: ArchiveRecordView) {
    const record = view.raw.dreamRecord;

    if (!record) {
      return;
    }

    const shouldDelete =
      typeof window === "undefined" ||
      window.confirm("이 꿈 영수증을 기록장에서 삭제할까요? 삭제하면 되돌릴 수 없어요.");

    if (!shouldDelete) {
      return;
    }

    setDeleteError("");
    const deleted = await deleteDreamRecord(record.id);

    if (!deleted) {
      setDeleteError("꿈 영수증을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  if (isLoadingArchive) {
    return (
      <section className={cn(ui.panel, "mt-8 space-y-3 p-5 text-center")}>
        <p className="text-lg font-semibold text-[#ffd98a]">기록을 불러오는 중이에요</p>
        <p className="text-sm leading-6 text-[#fff3d7]/72">꿈 영수증과 발자국을 한곳에 모으고 있어요.</p>
      </section>
    );
  }

  return (
    <div className="mt-6 space-y-4 pb-5">
      {source === "local" || routineSource === "local" ? (
        <p className="rounded-[1rem] border border-[#7c4a38]/45 bg-[rgba(5,4,12,0.58)] px-4 py-3 text-center text-sm leading-6 text-[#fff3d7]/74">
          이 기기에 저장된 기록이에요. 로그인하면 계정에 백업할 수 있어요.
        </p>
      ) : null}

      {deleteError ? (
        <p className="rounded-[1rem] border border-[#b98255]/45 bg-[rgba(7,6,18,0.78)] px-4 py-3 text-center text-sm font-semibold leading-6 text-[#ffd98a]">
          {deleteError}
        </p>
      ) : null}

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-70">
          <Image src={manyangAssets.actionIcons.search} alt="" fill sizes="20px" unoptimized className="object-contain" />
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="꿈, 상징, 감정을 검색해보세요"
          className="h-[3.25rem] w-full rounded-full border border-[#b98255]/55 bg-[rgba(8,6,18,0.72)] pl-11 pr-4 text-sm text-[#fff3d7] outline-none placeholder:text-[#fff3d7]/48 focus:border-[#ffd08a]/75 focus:ring-2 focus:ring-inset focus:ring-[#d799ff]/55"
          aria-label="기록 검색"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filterTabs.map((tab) => {
          const isSelected = selectedType === tab.type;

          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => setSelectedType(tab.type)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                ui.insetFocus,
                isSelected
                  ? ui.selectedPill
                  : "border-[#b98255]/48 bg-[rgba(7,5,15,0.58)] text-[#f2c27d]",
              )}
              aria-pressed={isSelected}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredViews.length > 0 ? (
          filteredViews.map((view) => (
            <ArchiveRecordListCard
              key={view.id}
              view={view}
              onOpenDream={handleOpenDream}
              onDeleteDream={handleDeleteDream}
            />
          ))
        ) : (
          <section className={cn(ui.panel, "space-y-2 p-5 text-center")}>
            <p className="text-lg font-semibold text-[#ffd98a]">맞는 기록을 찾지 못했어요</p>
            <p className="text-sm leading-6 text-[#fff3d7]/70">검색어를 줄이거나 다른 기록 종류를 선택해보세요.</p>
          </section>
        )}
      </div>
    </div>
  );
}
