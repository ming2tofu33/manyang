"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AssetTextButton } from "@/components/asset-primitives";
import {
  createArchiveRecordViews,
  getArchiveRecordViewById,
  type ArchiveRecordView,
} from "@/lib/archive-record-view";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { useArchiveDreamRecords } from "@/lib/use-archive-dream-records";
import { useRoutineRecords } from "@/lib/use-routine-records";

function formatArchiveDate(date: string): string {
  return date.replaceAll("-", ".");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.8rem_1fr] gap-3 border-b border-[#7c4a38]/26 py-3 last:border-b-0">
      <span className="text-[13px] leading-6 text-[#f0bc7d]">{label}</span>
      <span className="text-[15px] leading-6 text-[#fff3d7]/88">{value}</span>
    </div>
  );
}

function DetailHeader({ view }: { view: ArchiveRecordView }) {
  const icon =
    view.type === "pawprint"
      ? manyangAssets.semanticIcons.paw
      : view.type === "night_checkin"
        ? manyangAssets.semanticIcons.sparkles
        : manyangAssets.semanticIcons.moon;

  return (
    <header className="space-y-3 text-center">
      <span className="relative mx-auto block h-10 w-10">
        <Image src={icon} alt="" fill sizes="40px" unoptimized className="object-contain" />
      </span>
      <div>
        <p className={cn("text-3xl font-semibold leading-tight text-[#ffd98a]", ui.textGlow)}>{view.title}</p>
        <p className="mt-2 text-sm leading-6 text-[#fff3d7]/72">{view.categoryLabel}</p>
      </div>
      <span className="inline-flex rounded-full border border-[#b98255]/42 bg-[rgba(8,6,18,0.58)] px-4 py-2 text-sm text-[#f0bc7d]">
        {formatArchiveDate(view.date)}
      </span>
    </header>
  );
}

export function RoutineRecordDetailContent({
  view,
  onOpenDream,
}: {
  view: ArchiveRecordView;
  onOpenDream: (view: ArchiveRecordView) => void;
}) {
  if (view.type === "dream") {
    return (
      <section className={cn(ui.panel, "mt-8 space-y-4 p-5 text-center")}>
        <DetailHeader view={view} />
        <p className="text-sm leading-6 text-[#fff3d7]/76">이 기록은 꿈 영수증 화면에서 다시 읽을 수 있어요.</p>
        <AssetTextButton
          frame={manyangAssets.buttons.mediumSecondary}
          iconSrc={manyangAssets.actionIcons.book}
          onClick={() => onOpenDream(view)}
          className="mx-auto max-w-[16rem]"
          contentClassName="min-h-[3.25rem] text-base"
          iconClassName="h-6 w-6"
        >
          꿈 영수증 보기
        </AssetTextButton>
      </section>
    );
  }

  if (view.type === "night_checkin") {
    const record = view.raw.nightCheckInRecord;

    return (
      <div className="mt-6 space-y-4 pb-5">
        <DetailHeader view={view} />
        <section className={cn(ui.panel, "p-5")}>
          <h2 className="mb-2 text-lg font-semibold text-[#ffd98a]">오늘 밤 남긴 마음</h2>
          <DetailRow label="밤의 기분" value={record?.moodLabel ?? view.metaParts[0] ?? "-"} />
          <DetailRow label="몸 상태" value={record?.conditionLabel ?? view.metaParts[1] ?? "-"} />
          <DetailRow label="남긴 말" value={record?.note || "남긴 말은 없어요."} />
        </section>
        <AssetTextButton
          href="/night"
          frame={manyangAssets.buttons.mediumSecondary}
          iconSrc={manyangAssets.actionIcons.pencil}
          contentClassName="min-h-[3.25rem] text-base"
          iconClassName="h-6 w-6"
        >
          밤의 기록 남기기
        </AssetTextButton>
      </div>
    );
  }

  const morningRecord = view.raw.morningMoodRecord;
  const pawprint = view.raw.pawprint;

  return (
    <div className="mt-6 space-y-4 pb-5">
      <DetailHeader view={view} />
      <section className={cn(ui.panel, "p-5")}>
        <h2 className="mb-2 text-lg font-semibold text-[#ffd98a]">오늘의 아침 기록</h2>
        {morningRecord ? (
          <>
            <DetailRow label="아침 기분" value={morningRecord.mood} />
            <DetailRow label="오늘의 빛깔" value={morningRecord.moodColor} />
            <DetailRow label="몸 상태" value={morningRecord.bodyFeeling} />
            <DetailRow label="떠오른 단어" value={morningRecord.thought || "남긴 단어는 없어요."} />
          </>
        ) : (
          <>
            <DetailRow label="기록 종류" value={view.summary} />
            <DetailRow label="저장 출처" value={pawprint?.source ?? "발자국 기록"} />
            <p className="mt-4 rounded-[1rem] border border-[#7c4a38]/30 bg-[rgba(8,6,18,0.46)] px-4 py-3 text-sm leading-6 text-[#fff3d7]/70">
              이 발자국은 계정에 저장되어 있지만, 세부 아침 메모는 이 기기에서 찾지 못했어요.
            </p>
          </>
        )}
      </section>
      <AssetTextButton
        href="/morning"
        frame={manyangAssets.buttons.mediumSecondary}
        iconSrc={manyangAssets.actionIcons.pencil}
        contentClassName="min-h-[3.25rem] text-base"
        iconClassName="h-6 w-6"
      >
        발자국 다시 남기기
      </AssetTextButton>
    </div>
  );
}

export function ArchiveRecordDetailClient({ recordId }: { recordId: string }) {
  const router = useRouter();
  const { dreamRecords, isLoadingServerRecords, openDreamRecord, source } = useArchiveDreamRecords();
  const { pawprints, morningMoodRecords, nightCheckInRecords, isLoadingRoutineRecords } = useRoutineRecords();
  const visiblePawprints = pawprints;
  const visibleNightCheckInRecords = nightCheckInRecords;
  const views = createArchiveRecordViews({
    dreamRecords,
    pawprints: visiblePawprints,
    nightCheckInRecords: visibleNightCheckInRecords,
    morningMoodRecords,
  });
  const view = getArchiveRecordViewById(views, recordId);
  const isLoadingArchive = (isLoadingServerRecords || (source === "server" && isLoadingRoutineRecords)) && !view;

  function handleOpenDream(selectedView: ArchiveRecordView) {
    const record = selectedView.raw.dreamRecord;

    if (record && openDreamRecord(record)) {
      router.push("/result");
    }
  }

  if (isLoadingArchive) {
    return (
      <section className={cn(ui.panel, "mt-8 space-y-3 p-5 text-center")}>
        <p className="text-lg font-semibold text-[#ffd98a]">기록을 찾는 중이에요</p>
        <p className="text-sm leading-6 text-[#fff3d7]/72">남겨둔 흔적을 다시 펼치고 있어요.</p>
      </section>
    );
  }

  if (!view) {
    return (
      <section className={cn(ui.panel, "mt-8 space-y-4 p-5 text-center")}>
        <p className="text-lg font-semibold text-[#ffd98a]">기록을 찾지 못했어요</p>
        <p className="text-sm leading-6 text-[#fff3d7]/72">기록함으로 돌아가 다시 선택해보세요.</p>
        <Link
          href="/archive/records"
          className="inline-flex rounded-full border border-[#b98255]/55 px-4 py-2 text-sm font-semibold text-[#f0bc7d] transition hover:border-[#ffd08a]/70 hover:text-[#ffd98a]"
        >
          기록함으로 돌아가기
        </Link>
      </section>
    );
  }

  return <RoutineRecordDetailContent view={view} onOpenDream={handleOpenDream} />;
}
