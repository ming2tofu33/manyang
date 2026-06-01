"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { countMonthlyDreamRecords, countMonthlyDreamSymbols } from "@/lib/archive-records";
import {
  addArchiveMonths,
  canMoveArchiveMonth,
  formatArchiveMonth,
  getArchiveMonthRange,
  getSelectedArchiveMonthServerSnapshot,
  getSelectedArchiveMonthSnapshot,
  resolveArchiveMonth,
  saveSelectedArchiveMonth,
  subscribeToArchiveMonth,
} from "@/lib/archive-month";
import {
  archiveCalendarDateGridStyle,
  archiveCalendarDayCellClassName,
  archiveCalendarDreamIconClassName,
  archiveCalendarNightCheckInIconClassName,
  archiveCalendarPawprintIconClassName,
} from "@/lib/archive-calendar-layout";
import { formatMonthGridCellDate, getMonthGridCells } from "@/lib/calendar";
import { manyangAssets } from "@/lib/manyang-assets";
import { countMonthlyNightCheckIns } from "@/lib/night-checkin";
import { countMonthlyPawprints } from "@/lib/pawprints";
import { cn } from "@/lib/styles";
import { useArchiveDreamRecords } from "@/lib/use-archive-dream-records";
import { useRoutineRecords } from "@/lib/use-routine-records";

type ArchiveSummaryCardProps = {
  icon: string;
  label: string;
  value: number;
  accentClassName?: string;
};

function ArchiveSummaryCard({ icon, label, value, accentClassName }: ArchiveSummaryCardProps) {
  return (
    <div className="relative min-w-0 rounded-[1rem] border border-[#5b3a42]/70 bg-[linear-gradient(180deg,rgba(30,21,40,0.86),rgba(9,7,18,0.82))] px-1.5 py-3 text-center shadow-[inset_0_1px_0_rgba(255,226,176,0.08),0_12px_30px_rgba(0,0,0,0.26)]">
      <span className="relative mx-auto block h-7 w-7" aria-hidden="true">
        <Image
          src={icon}
          alt=""
          fill
          sizes="28px"
          unoptimized
          className={cn("object-contain drop-shadow-[0_0_12px_rgba(255,191,96,0.32)]", accentClassName)}
        />
      </span>
      <p className="mt-2 truncate text-[10px] font-semibold text-[#f3c78d]">{label}</p>
      <p className="mt-0.5 text-2xl leading-none text-[#ffd98a] [text-shadow:0_0_14px_rgba(255,199,104,0.28)]">
        {value}
        <span className="ml-0.5 text-[0.92rem]">개</span>
      </p>
    </div>
  );
}

export function ArchiveCalendar() {
  const { dreamRecords, isLoadingServerRecords, source } = useArchiveDreamRecords();
  const { pawprints, nightCheckInRecords, source: routineSource } = useRoutineRecords();
  const selectedArchiveMonth = useSyncExternalStore(
    subscribeToArchiveMonth,
    getSelectedArchiveMonthSnapshot,
    getSelectedArchiveMonthServerSnapshot,
  );
  const visiblePawprints = pawprints;
  const visibleNightCheckInRecords = nightCheckInRecords;
  const hasLocalArchiveRecords = source === "local" || routineSource === "local";
  const monthRange = getArchiveMonthRange({
    dreamRecords,
    pawprints: visiblePawprints,
    nightCheckInRecords: visibleNightCheckInRecords,
  });
  const archiveMonth = resolveArchiveMonth(selectedArchiveMonth, monthRange);
  const calendarCells = getMonthGridCells(archiveMonth.year, archiveMonth.month);
  const canGoPreviousMonth = canMoveArchiveMonth(archiveMonth, monthRange, -1);
  const canGoNextMonth = canMoveArchiveMonth(archiveMonth, monthRange, 1);
  const monthlyDreams = countMonthlyDreamRecords(dreamRecords, archiveMonth.year, archiveMonth.month);
  const monthlyPawprints = countMonthlyPawprints(visiblePawprints, archiveMonth.year, archiveMonth.month);
  const monthlyNightCheckIns = countMonthlyNightCheckIns(
    visibleNightCheckInRecords,
    archiveMonth.year,
    archiveMonth.month,
  );
  const monthlySymbols = countMonthlyDreamSymbols(dreamRecords, archiveMonth.year, archiveMonth.month);
  const dreamDates = new Set<string>();
  const pawprintDates = new Set<string>();
  const nightCheckInDates = new Set<string>();

  function moveMonth(delta: number) {
    if (canMoveArchiveMonth(archiveMonth, monthRange, delta)) {
      saveSelectedArchiveMonth(addArchiveMonths(archiveMonth, delta));
    }
  }

  for (const record of dreamRecords) {
    dreamDates.add(record.dreamDate);
  }

  for (const pawprint of visiblePawprints) {
    pawprintDates.add(pawprint.appDate);
  }

  for (const checkIn of visibleNightCheckInRecords) {
    nightCheckInDates.add(checkIn.checkInDate);
  }

  return (
    <section className="space-y-4">
      <div className="mx-auto grid w-full max-w-[382px] grid-cols-4 gap-1.5 rounded-[1.35rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.74)] p-2.5 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <ArchiveSummaryCard icon={manyangAssets.semanticIcons.moon} label="꿈 기록" value={monthlyDreams} />
        <ArchiveSummaryCard icon={manyangAssets.semanticIcons.paw} label="발자국 기록" value={monthlyPawprints} />
        <ArchiveSummaryCard icon={manyangAssets.semanticIcons.sparkles} label="밤의 기록" value={monthlyNightCheckIns} />
        <ArchiveSummaryCard icon={manyangAssets.semanticIcons.crystalBall} label="이 달 상징" value={monthlySymbols} />
      </div>

      <div className="relative mx-auto aspect-[962/1452] w-full max-w-[382px]">
        <Image
          src="/manyang/ui/calendar.webp"
          alt=""
          fill
          sizes="382px"
          unoptimized
          className="object-contain drop-shadow-[0_18px_48px_rgba(0,0,0,0.36)]"
        />
        <div className="absolute inset-x-[12%] top-[14.8%] flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="이전 달 보기"
            disabled={!canGoPreviousMonth}
            onClick={() => moveMonth(-1)}
            className="relative h-8 w-8 shrink-0 rounded-full transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-28"
          >
            <Image src={manyangAssets.actionIcons.arrowLeft} alt="" fill sizes="32px" unoptimized className="object-contain" />
          </button>
          <h2 className="min-w-0 flex-1 text-center text-[15px] font-semibold text-[#ffd98a]">
            {formatArchiveMonth(archiveMonth)}
          </h2>
          <button
            type="button"
            aria-label="다음 달 보기"
            disabled={!canGoNextMonth}
            onClick={() => moveMonth(1)}
            className="relative h-8 w-8 shrink-0 rounded-full transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-28"
          >
            <Image src={manyangAssets.actionIcons.arrowRight} alt="" fill sizes="32px" unoptimized className="object-contain" />
          </button>
        </div>
        <div
          data-calendar-grid
          className="absolute grid grid-cols-7 grid-rows-6 text-center text-[11px] text-[#f5c77f]"
          style={archiveCalendarDateGridStyle}
        >
          {calendarCells.map((cell, index) => {
            const cellDate = formatMonthGridCellDate(cell);
            const hasDream = dreamDates.has(cellDate);
            const hasPawprint = pawprintDates.has(cellDate);
            const hasNightCheckIn = nightCheckInDates.has(cellDate);
            const hasActivity = hasDream || hasPawprint || hasNightCheckIn;

            return (
              <span
                key={`${cellDate}-${index}`}
                data-calendar-cell-scope={cell.isCurrentMonth ? "current-month" : "adjacent-month"}
                className={cn(archiveCalendarDayCellClassName, !cell.isCurrentMonth && "opacity-45")}
              >
                  <span
                    className={[
                      "relative grid h-6 w-6 place-items-center rounded-full",
                      hasDream
                        ? "bg-[#4a2069] text-[#ffd98a] shadow-[0_0_18px_rgba(199,117,255,0.55)]"
                        : hasActivity
                          ? "bg-[#2b1738]/75 text-[#ffd98a] ring-1 ring-[#d79a34]/60"
                          : cell.isCurrentMonth
                            ? "text-[#d6ad78]/82"
                            : "text-[#b88c63]/78",
                    ].join(" ")}
                  >
                    {hasDream ? (
                      <span className={archiveCalendarDreamIconClassName}>
                        <Image
                          src={manyangAssets.semanticIcons.moon}
                          alt=""
                          fill
                          sizes="14px"
                          unoptimized
                          className="object-contain"
                        />
                      </span>
                    ) : null}
                    {hasPawprint ? (
                      <span className={archiveCalendarPawprintIconClassName}>
                        <Image
                          src={manyangAssets.semanticIcons.paw}
                          alt=""
                          fill
                          sizes="12px"
                          unoptimized
                          className="object-contain"
                        />
                      </span>
                    ) : null}
                    {hasNightCheckIn ? (
                      <span className={archiveCalendarNightCheckInIconClassName}>
                        <Image
                          src={manyangAssets.semanticIcons.sparkles}
                          alt=""
                          fill
                          sizes="12px"
                          unoptimized
                          className="object-contain"
                        />
                      </span>
                    ) : null}
                    {cell.day}
                  </span>
              </span>
            );
          })}
        </div>
      </div>

      {hasLocalArchiveRecords && !isLoadingServerRecords ? (
        <p className="mx-auto max-w-[382px] rounded-[1rem] border border-[#7c4a38]/45 bg-[rgba(5,4,12,0.58)] px-4 py-3 text-center text-sm leading-6 text-[#fff3d7]/74">
          이 기기에 저장된 기록이에요. 로그인하면 계정에 백업할 수 있어요.
        </p>
      ) : null}
    </section>
  );
}
