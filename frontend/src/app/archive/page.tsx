import { AppShell } from "@/components/app-shell";
import { cn, ui } from "@/lib/styles";

const days = Array.from({ length: 35 }, (_, index) => index + 1);
const dreamDays = new Set([2, 7, 12, 15, 20, 24, 29, 31]);

export default function ArchivePage() {
  return (
    <AppShell background="/manyang/background-default.png" title="꿈 기록" subtitle="내가 꾼 꿈들을 돌아보는 시간" backHref="/">
      <div className="mt-8 space-y-4 pb-5">
        <section className={cn(ui.panel, "p-4")}>
          <div className="mb-4 text-center text-xl text-[#ffd98a]">2026년 5월</div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm text-[#f5c77f]">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <span key={day}>{day}</span>
            ))}
            {days.map((day) => (
              <span
                key={day}
                className={[
                  "grid aspect-square place-items-center rounded-full",
                  dreamDays.has(day)
                    ? "bg-[#4a2069] text-[#ffd98a] shadow-[0_0_18px_rgba(199,117,255,0.5)]"
                    : "text-[#d6ad78]/80",
                  day === 24 ? "ring-2 ring-[#c775ff]" : "",
                ].join(" ")}
              >
                {day}
              </span>
            ))}
          </div>
        </section>

        <section className={cn(ui.panel, "p-4")}>
          <p className="text-sm text-[#f0bc7d]">2026.05.24</p>
          <h2 className="mt-2 text-2xl text-[#ffd98a]">맨발로 복도를 달린 꿈</h2>
          <p className="mt-3 leading-7 text-[#fff3d7]/86">
            복도를 맨발로 빠르게 달렸어요. 누군가 뒤에서 부르는 것 같았지만 멈추지 않았어요.
          </p>
          <div className="mt-4 flex gap-2">
            {["복도", "신발", "문"].map((symbol) => (
              <span key={symbol} className={ui.chip}>
                {symbol}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
