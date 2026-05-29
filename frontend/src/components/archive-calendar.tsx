"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import {
  countMonthlyDreamRecords,
  countMonthlyDreamSymbols,
  getDayInMonth,
} from "@/lib/archive-records";
import {
  archiveCalendarDateGridStyle,
  archiveCalendarDayCellClassName,
  archiveCalendarDreamIconClassName,
  archiveCalendarPawprintIconClassName,
  archiveCalendarSeedIconClassName,
} from "@/lib/archive-calendar-layout";
import { getMonthGrid } from "@/lib/calendar";
import {
  countMonthlyDreamSeeds,
  getDreamSeedRecordsSnapshotFromBrowser,
  getEmptyDreamSeedRecordsSnapshot,
  subscribeToDreamSeed,
} from "@/lib/dream-seed";
import {
  getDreamRecordsSnapshotFromBrowser,
  getEmptyDreamRecordsSnapshot,
  subscribeToDreamStorage,
} from "@/lib/dream-storage";
import { manyangAssets } from "@/lib/manyang-assets";
import {
  countMonthlyPawprints,
  getEmptyPawprintSnapshot,
  getPawprintSnapshotFromBrowser,
  subscribeToPawprints,
} from "@/lib/pawprints";
import { cn } from "@/lib/styles";

const archiveYear = 2026;
const archiveMonth = 5;
const calendarCells = getMonthGrid(archiveYear, archiveMonth);

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
  const dreamRecords = useSyncExternalStore(
    subscribeToDreamStorage,
    getDreamRecordsSnapshotFromBrowser,
    getEmptyDreamRecordsSnapshot,
  );
  const pawprints = useSyncExternalStore(
    subscribeToPawprints,
    getPawprintSnapshotFromBrowser,
    getEmptyPawprintSnapshot,
  );
  const seedRecords = useSyncExternalStore(
    subscribeToDreamSeed,
    getDreamSeedRecordsSnapshotFromBrowser,
    getEmptyDreamSeedRecordsSnapshot,
  );

  const dreamDays = new Set<number>();
  const pawprintDays = new Set<number>();
  const seedDays = new Set<number>();
  const monthlyDreams = countMonthlyDreamRecords(dreamRecords, archiveYear, archiveMonth);
  const monthlyPawprints = countMonthlyPawprints(pawprints, archiveYear, archiveMonth);
  const monthlySeeds = countMonthlyDreamSeeds(seedRecords, archiveYear, archiveMonth);
  const monthlySymbols = countMonthlyDreamSymbols(dreamRecords, archiveYear, archiveMonth);

  for (const record of dreamRecords) {
    const day = getDayInMonth(record.dreamDate, archiveYear, archiveMonth);

    if (day) {
      dreamDays.add(day);
    }
  }

  for (const pawprint of pawprints) {
    const day = getDayInMonth(pawprint.appDate, archiveYear, archiveMonth);

    if (day) {
      pawprintDays.add(day);
    }
  }

  for (const seed of seedRecords) {
    const day = getDayInMonth(seed.seedDate, archiveYear, archiveMonth);

    if (day) {
      seedDays.add(day);
    }
  }

  return (
    <section className="space-y-4">
      <div className="mx-auto grid w-full max-w-[382px] grid-cols-4 gap-1.5 rounded-[1.35rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.74)] p-2.5 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <ArchiveSummaryCard icon={manyangAssets.icons.moon} label="꿈 기록" value={monthlyDreams} />
        <ArchiveSummaryCard icon={manyangAssets.icons.paw} label="발자국 기록" value={monthlyPawprints} />
        <ArchiveSummaryCard
          icon={manyangAssets.icons.sparkles}
          label="꿈 씨앗"
          value={monthlySeeds}
          accentClassName="hue-rotate-[58deg] saturate-[1.35]"
        />
        <ArchiveSummaryCard icon={manyangAssets.icons.crystalBall} label="이번 달 상징" value={monthlySymbols} />
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
        <h2 className="absolute inset-x-[27%] top-[15.7%] text-center text-[15px] font-semibold text-[#ffd98a]">
          {archiveYear}년 {archiveMonth}월
        </h2>
        <div
          data-calendar-grid
          className="absolute grid grid-cols-7 grid-rows-6 text-center text-[11px] text-[#f5c77f]"
          style={archiveCalendarDateGridStyle}
        >
          {calendarCells.map((day, index) => {
            const hasDream = day ? dreamDays.has(day) : false;
            const hasPawprint = day ? pawprintDays.has(day) : false;
            const hasSeed = day ? seedDays.has(day) : false;
            const hasActivity = hasDream || hasPawprint || hasSeed;

            return (
              <span key={`${day ?? "blank"}-${index}`} className={archiveCalendarDayCellClassName}>
                {day ? (
                  <span
                    className={[
                      "relative grid h-6 w-6 place-items-center rounded-full",
                      hasDream
                        ? "bg-[#4a2069] text-[#ffd98a] shadow-[0_0_18px_rgba(199,117,255,0.55)]"
                        : hasActivity
                          ? "bg-[#2b1738]/75 text-[#ffd98a] ring-1 ring-[#d79a34]/60"
                          : "text-[#d6ad78]/82",
                      day === 24 ? "ring-2 ring-[#c775ff]" : "",
                    ].join(" ")}
                  >
                    {hasDream ? (
                      <span className={archiveCalendarDreamIconClassName}>
                        <Image
                          src={manyangAssets.icons.moon}
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
                          src={manyangAssets.icons.paw}
                          alt=""
                          fill
                          sizes="12px"
                          unoptimized
                          className="object-contain"
                        />
                      </span>
                    ) : null}
                    {hasSeed ? (
                      <span className={archiveCalendarSeedIconClassName}>
                        <Image
                          src={manyangAssets.icons.sparkles}
                          alt=""
                          fill
                          sizes="12px"
                          unoptimized
                          className="object-contain hue-rotate-[58deg] saturate-[1.35]"
                        />
                      </span>
                    ) : null}
                    {day}
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
