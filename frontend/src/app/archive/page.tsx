import Image from "next/image";

import { AppShell } from "@/components/app-shell";
import { DreamArchiveList } from "@/components/dream-archive-list";
import { getMonthGrid } from "@/lib/calendar";

const calendarCells = getMonthGrid(2026, 5);
const dreamDays = new Set([2, 7, 12, 15, 20, 24, 29, 31]);

export default function ArchivePage() {
  return (
    <AppShell background="/manyang/background-default.png" title="꿈 기록" subtitle="내가 꾼 꿈들을 돌아보는 시간" backHref="/">
      <div className="mt-8 space-y-4 pb-5">
        <section className="relative mx-auto aspect-[962/1452] w-full max-w-[382px]">
          <Image
            src="/manyang/calendar.png"
            alt=""
            fill
            sizes="382px"
            unoptimized
            className="object-contain drop-shadow-[0_18px_48px_rgba(0,0,0,0.36)]"
          />
          <h2 className="absolute inset-x-[27%] top-[15.7%] text-center text-[15px] font-semibold text-[#ffd98a]">
            2026년 5월
          </h2>
          <div className="absolute left-[8.25%] right-[8.25%] top-[28.55%] grid h-[56.05%] grid-cols-7 grid-rows-6 text-center text-[11px] text-[#f5c77f]">
            {calendarCells.map((day, index) => (
              <span key={`${day ?? "blank"}-${index}`} className="relative grid place-items-center">
                {day ? (
                  <span
                    className={[
                      "grid h-6 w-6 place-items-center rounded-full",
                      dreamDays.has(day)
                        ? "bg-[#4a2069] text-[#ffd98a] shadow-[0_0_18px_rgba(199,117,255,0.55)]"
                        : "text-[#d6ad78]/82",
                      day === 24 ? "ring-2 ring-[#c775ff]" : "",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </section>

        <DreamArchiveList />
      </div>
    </AppShell>
  );
}
