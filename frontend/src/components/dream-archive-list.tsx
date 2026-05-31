"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { ArchiveLoginGate } from "@/components/archive-login-gate";
import { AssetIconButton, AssetTextButton } from "@/components/asset-primitives";
import { createArchiveTimeline, type ArchiveTimelineItem } from "@/lib/archive-records";
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

const archiveYear = 2026;
const archiveMonth = 5;

const timelineIcons: Record<ArchiveTimelineItem["type"], string> = {
  dream: manyangAssets.semanticIcons.moon,
  pawprint: manyangAssets.semanticIcons.paw,
  night_checkin: manyangAssets.semanticIcons.sparkles,
};

function formatArchiveDate(date: string): string {
  return date.replaceAll("-", ".");
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

export function DreamArchiveList() {
  const router = useRouter();
  const { dreamRecords, deleteDreamRecord, isLoadingServerRecords, openDreamRecord, source } =
    useArchiveDreamRecords();
  const { pawprints, nightCheckInRecords, source: routineSource } = useRoutineRecords();
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const timeline = createArchiveTimeline({
    dreamRecords,
    pawprints: source === "server" && routineSource === "server" ? pawprints : [],
    nightCheckInRecords: source === "server" && routineSource === "server" ? nightCheckInRecords : [],
    year: archiveYear,
    month: archiveMonth,
  });

  function handleDelete(item: ArchiveTimelineItem) {
    if (!item.dreamRecordId) {
      return;
    }

    const confirmed = window.confirm(
      `"${item.title}" 기록을 삭제할까요?\n삭제한 기록은 다시 불러올 수 없어요.`,
    );

    if (confirmed) {
      void deleteDreamRecord(item.dreamRecordId);
    }
  }

  function handleOpenReceipt(item: ArchiveTimelineItem) {
    if (!item.dreamRecordId) {
      return;
    }

    const record = dreamRecords.find((dreamRecord) => dreamRecord.id === item.dreamRecordId);

    if (record && openDreamRecord(record)) {
      router.push("/result");
    }
  }

  if (isLoadingServerRecords) {
    return (
      <section className={cn(ui.panel, "space-y-3 p-5 text-center")}>
        <p className={cn("text-lg font-semibold text-[#ffd98a]", ui.textGlow)}>꿈 기록장을 여는 중이에요</p>
        <p className="text-sm leading-6 text-[#fff3d7]/76">계정에 저장된 꿈 영수증을 확인하고 있어요.</p>
      </section>
    );
  }

  if (source === "guest") {
    return <ArchiveLoginGate />;
  }

  if (timeline.length === 0) {
    const reader = getCatReaderById(selectedCatReaderId);

    return (
      <section className={cn(ui.panel, "space-y-4 p-5 text-center")}>
        <span className="relative mx-auto block h-14 w-14">
          <Image
            src={manyangAssets.illustrations[reader.assetKey]}
            alt={`${reader.name} 기록 안내`}
            fill
            sizes="56px"
            unoptimized
            className="scale-110 object-contain drop-shadow-[0_0_18px_rgba(215,153,255,0.28)]"
          />
        </span>
        <p className="text-lg font-semibold text-[#ffd98a]">아직 남긴 기록이 없어요</p>
        <p className="text-sm leading-6 text-[#fff3d7]/76">
          꿈을 적거나 아침 기분을 남기면 이곳에 차곡차곡 쌓여요.
        </p>
        <AssetTextButton
          href="/write"
          frame={manyangAssets.buttons.mediumSecondary}
          iconSrc={manyangAssets.actionIcons.pencil}
          className="mx-auto max-w-[15rem]"
          contentClassName="min-h-[3.2rem] px-4 text-base"
          iconClassName="h-6 w-6"
        >
          꿈쓰기
        </AssetTextButton>
      </section>
    );
  }

  return (
    <section className={cn(ui.panel, "relative overflow-hidden p-4")}>
      <header className="relative z-10 mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#ffd98a]">전체 기록</h2>
        <span className="text-sm text-[#f0bc7d]">{timeline.length}개</span>
      </header>

      <div className="relative z-10 space-y-2.5">
        {timeline.map((item) => (
          <article
            key={item.id}
            className="flex min-h-[4.55rem] items-center gap-3 rounded-[1.05rem] border border-[#7c4a38]/42 bg-[rgba(10,8,21,0.64)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,226,176,0.06)]"
          >
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[rgba(255,217,138,0.06)] ring-1 ring-[#d799ff]/12">
              <span className="relative h-7 w-7">
                <Image
                  src={timelineIcons[item.type]}
                  alt=""
                  fill
                  sizes="28px"
                  unoptimized
                  className="object-contain"
                />
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <time className="text-sm text-[#f0bc7d]" dateTime={item.date}>
                {formatArchiveDate(item.date)}
              </time>
              <h3 className="mt-0.5 truncate text-[1.05rem] font-semibold leading-6 text-[#ffd98a]">{item.title}</h3>
              {item.meta ? <p className="truncate text-sm leading-5 text-[#fff3d7]/72">{item.meta}</p> : null}
            </div>

            {item.dreamRecordId ? (
              <DreamRecordActions
                title={item.title}
                onOpen={() => handleOpenReceipt(item)}
                onDelete={() => handleDelete(item)}
              />
            ) : (
              <span className="relative h-7 w-7 shrink-0 opacity-72" aria-hidden="true">
                <Image
                  src={manyangAssets.actionIcons.arrowRight}
                  alt=""
                  fill
                  sizes="28px"
                  unoptimized
                  className="object-contain"
                />
              </span>
            )}
          </article>
        ))}
      </div>

      <ArchiveCatGuide selectedCatReaderId={selectedCatReaderId} />
    </section>
  );
}
