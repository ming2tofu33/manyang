"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { AssetIconButton } from "@/components/asset-primitives";
import {
  createArchiveRecordViews,
  getFeaturedDreamRecordView,
  getRecentArchiveRecordViews,
  type ArchiveRecordView,
} from "@/lib/archive-record-view";
import {
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
  type CatReaderId,
} from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { useArchiveDreamRecords } from "@/lib/use-archive-dream-records";
import { useRoutineRecords } from "@/lib/use-routine-records";

const recordTypeIcons: Record<ArchiveRecordView["type"], string> = {
  dream: manyangAssets.calendarRecordIcons.dream,
  pawprint: manyangAssets.calendarRecordIcons.pawprint,
  night_checkin: manyangAssets.calendarRecordIcons.night,
};

type RecentArchiveSlotDefinition = {
  type: ArchiveRecordView["type"];
  label: string;
  emptyTitle: string;
  emptySummary: string;
  ctaLabel: string;
  href: string;
};

const recentArchiveSlots: RecentArchiveSlotDefinition[] = [
  {
    type: "dream",
    label: "꿈 해몽 기록",
    emptyTitle: "아직 해몽한 꿈이 없어요",
    emptySummary: "꿈을 들려주면 영수증으로 남겨둘게요.",
    ctaLabel: "꿈 들려주기",
    href: "/write",
  },
  {
    type: "pawprint",
    label: "꿈 발자국",
    emptyTitle: "오늘의 발자국이 비어 있어요",
    emptySummary: "꿈이 흐릿해도 아침 느낌은 남길 수 있어요.",
    ctaLabel: "발자국 남기기",
    href: "/morning",
  },
  {
    type: "night_checkin",
    label: "밤의 기록",
    emptyTitle: "아직 밤의 기록이 없어요",
    emptySummary: "잠들기 전 마음을 짧게 남겨둘까요?",
    ctaLabel: "밤의 기록 남기기",
    href: "/night",
  },
];

function formatArchiveDate(date: string): string {
  return date.replaceAll("-", ".");
}

function ArchiveRecordIcon({ type }: { type: ArchiveRecordView["type"] }) {
  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[rgba(255,217,138,0.06)] ring-1 ring-[#d799ff]/12">
      <span className="relative h-7 w-7">
        <Image src={recordTypeIcons[type]} alt="" fill sizes="28px" unoptimized className="object-contain" />
      </span>
    </span>
  );
}

function ArchiveRecordTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.slice(0, 4).map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#b98255]/38 bg-[rgba(6,4,12,0.44)] px-2.5 py-1 text-[11px] leading-none text-[#f2c27d]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ArchiveCatGuide({ selectedCatReaderId }: { selectedCatReaderId: CatReaderId }) {
  const reader = getCatReaderById(selectedCatReaderId);

  return (
    <div className="relative z-10 mt-4 flex min-h-[5.5rem] items-end justify-between border-t border-[#7c4a38]/35 pt-3">
      <p className="pb-2 text-sm font-semibold text-[#ffd98a]">꿈은 지나가도, 기록은 남는다냥.</p>
      <span className="relative h-24 w-24 shrink-0" title={reader.name}>
        <Image
          src={manyangAssets.illustrations[reader.assetKey]}
          alt={`${reader.name} 기록 안내`}
          fill
          sizes="96px"
          unoptimized
          className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.28)]"
        />
      </span>
    </div>
  );
}

export function DreamRecordActions({
  title,
  onOpen,
  onDelete,
}: {
  title: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <AssetIconButton
        src={manyangAssets.actionIcons.book}
        label={`${title} 꿈 영수증 다시 보기`}
        title="꿈 영수증 다시 보기"
        onClick={onOpen}
        className="h-9 w-9"
      />
      <AssetIconButton
        src={manyangAssets.actionIcons.trash}
        label={`${title} 기록 삭제`}
        title="기록 삭제"
        onClick={onDelete}
        className="h-9 w-9"
      />
    </div>
  );
}

export function FeaturedDreamRecordCard({
  view,
  onOpen,
}: {
  view: ArchiveRecordView;
  onOpen: (view: ArchiveRecordView) => void;
}) {
  return (
    <section
      className={cn(ui.panel, "relative overflow-hidden p-4")}
      aria-label="최근 꿈 영수증"
      data-featured-dream-record="true"
    >
      <div className="relative z-10 flex gap-3">
        <div className="relative h-[7.25rem] w-[6.2rem] shrink-0 overflow-hidden rounded-[1rem] border border-[#7c4a38]/48 bg-[rgba(5,4,12,0.55)]">
          <Image
            src={manyangAssets.backgrounds.default}
            alt=""
            fill
            sizes="100px"
            unoptimized
            className="scale-125 object-cover opacity-72"
          />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,18,0.08),rgba(8,6,18,0.52))]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <time className="text-[12px] font-semibold text-[#f0bc7d]" dateTime={view.date}>
              {formatArchiveDate(view.date)}
            </time>
            <span className="rounded-full border border-[#b98255]/42 px-2.5 py-1 text-[11px] leading-none text-[#f2c27d]">
              {view.categoryLabel}
            </span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-[1.32rem] font-semibold leading-8 text-[#ffd98a]">{view.title}</h2>
          <ArchiveRecordTags tags={view.tags} />
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#fff3d7]/72">{view.summary}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(view)}
        className={cn(
          "relative z-10 mt-3 flex min-h-11 w-full items-center justify-between rounded-[0.9rem] border border-[#b98255]/45 bg-[rgba(9,7,18,0.58)] px-3 text-sm font-semibold text-[#ffd98a] transition hover:border-[#ffd08a]/70",
          ui.insetFocus,
        )}
      >
        <span className="flex items-center gap-2">
          <span className="relative h-5 w-5">
            <Image src={manyangAssets.actionIcons.book} alt="" fill sizes="20px" unoptimized className="object-contain" />
          </span>
          꿈 영수증 보기
        </span>
        <span className="relative h-5 w-5 opacity-78" aria-hidden="true">
          <Image src={manyangAssets.actionIcons.arrowRight} alt="" fill sizes="20px" unoptimized className="object-contain" />
        </span>
      </button>
    </section>
  );
}

function RecentArchiveRecordItem({
  view,
  onOpenDream,
}: {
  view: ArchiveRecordView;
  onOpenDream: (view: ArchiveRecordView) => void;
}) {
  const content = (
    <>
      <ArchiveRecordIcon type={view.type} />
      <span className="min-w-0 flex-1">
        <span className="text-[12px] font-semibold text-[#f0bc7d]">{formatArchiveDate(view.date)}</span>
        <span className="mt-0.5 block truncate text-[1rem] font-semibold leading-6 text-[#ffd98a]">{view.title}</span>
        <span className="block truncate text-[12px] leading-5 text-[#fff3d7]/70">
          {[...view.metaParts, ...view.tags].slice(0, 3).join(" · ") || view.categoryLabel}
        </span>
      </span>
      <span className="relative h-6 w-6 shrink-0 opacity-75" aria-hidden="true">
        <Image src={manyangAssets.actionIcons.arrowRight} alt="" fill sizes="24px" unoptimized className="object-contain" />
      </span>
    </>
  );
  const className =
    "flex min-h-[4.7rem] w-full items-center gap-3 rounded-[1rem] border border-[#7c4a38]/36 bg-[rgba(10,8,21,0.58)] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,226,176,0.05)] transition hover:border-[#ffd08a]/58 hover:bg-[rgba(20,11,34,0.72)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]/72";

  if (view.type === "dream") {
    return (
      <button type="button" className={className} onClick={() => onOpenDream(view)}>
        {content}
      </button>
    );
  }

  return (
    <Link href={view.detailHref ?? "/archive/records"} className={className}>
      {content}
    </Link>
  );
}

function RecentArchiveEmptySlot({ slot }: { slot: RecentArchiveSlotDefinition }) {
  return (
    <Link
      href={slot.href}
      className={cn(
        "group flex min-h-[5.1rem] w-full items-center gap-3 rounded-[1rem] border border-dashed border-[#7c4a38]/46 bg-[rgba(10,8,21,0.34)] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,226,176,0.035)] transition hover:border-[#ffd08a]/55 hover:bg-[rgba(20,11,34,0.56)]",
        ui.insetFocus,
      )}
      data-empty-recent-archive-slot={slot.type}
    >
      <span className="opacity-58 transition group-hover:opacity-80">
        <ArchiveRecordIcon type={slot.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[12px] font-semibold text-[#f0bc7d]/72">{slot.label}</span>
        <span className="mt-0.5 block text-[0.95rem] font-semibold leading-6 text-[#ffd98a]/88">{slot.emptyTitle}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-[#fff3d7]/58">{slot.emptySummary}</span>
      </span>
      <span className="shrink-0 text-[12px] font-semibold text-[#f0bc7d] transition group-hover:text-[#ffd98a]">
        {slot.ctaLabel} ›
      </span>
    </Link>
  );
}

export function RecentArchiveRecords({
  views,
  onOpenDream,
  selectedCatReaderId,
}: {
  views: ArchiveRecordView[];
  onOpenDream: (view: ArchiveRecordView) => void;
  selectedCatReaderId: CatReaderId;
}) {
  const viewsByType = new Map(views.map((view) => [view.type, view]));

  return (
    <section className={cn(ui.panel, "relative overflow-hidden p-4")} data-recent-archive-records="true">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#ffd98a]">최근 기록</h2>
        <Link
          href="/archive/records"
          className={cn(
            "shrink-0 text-sm font-semibold text-[#f0bc7d] transition hover:text-[#ffd98a]",
            ui.insetFocus,
          )}
        >
          전체 보기 ›
        </Link>
      </header>
      <div className="space-y-2">
        {recentArchiveSlots.map((slot) => {
          const view = viewsByType.get(slot.type);

          return view ? (
            <RecentArchiveRecordItem key={view.id} view={view} onOpenDream={onOpenDream} />
          ) : (
            <RecentArchiveEmptySlot key={`empty-${slot.type}`} slot={slot} />
          );
        })}
      </div>
      <ArchiveCatGuide selectedCatReaderId={selectedCatReaderId} />
    </section>
  );
}

export function DreamArchiveList() {
  const router = useRouter();
  const { dreamRecords, isLoadingServerRecords, openDreamRecord, source } = useArchiveDreamRecords();
  const { pawprints, morningMoodRecords, nightCheckInRecords, isLoadingRoutineRecords } = useRoutineRecords();
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const visiblePawprints = pawprints;
  const visibleNightCheckInRecords = nightCheckInRecords;
  const views = createArchiveRecordViews({
    dreamRecords,
    pawprints: visiblePawprints,
    nightCheckInRecords: visibleNightCheckInRecords,
    morningMoodRecords,
  });
  const featuredDreamRecord = getFeaturedDreamRecordView(views);
  const recentRecords = getRecentArchiveRecordViews(views, 3);
  const isLoadingArchive = (isLoadingServerRecords || (source === "server" && isLoadingRoutineRecords)) && views.length === 0;

  function handleOpenReceipt(view: ArchiveRecordView) {
    const record = view.raw.dreamRecord;

    if (record && openDreamRecord(record)) {
      router.push("/result");
    }
  }

  if (isLoadingArchive) {
    return (
      <section className={cn(ui.panel, "space-y-3 p-5 text-center")}>
        <p className={cn("text-lg font-semibold text-[#ffd98a]", ui.textGlow)}>기록함을 여는 중이에요</p>
        <p className="text-sm leading-6 text-[#fff3d7]/76">계정에 저장된 꿈 영수증과 하루의 흔적을 확인하고 있어요.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {featuredDreamRecord ? <FeaturedDreamRecordCard view={featuredDreamRecord} onOpen={handleOpenReceipt} /> : null}
      <RecentArchiveRecords
        views={recentRecords}
        onOpenDream={handleOpenReceipt}
        selectedCatReaderId={selectedCatReaderId}
      />
    </div>
  );
}
