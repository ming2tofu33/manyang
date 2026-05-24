import { AppShell } from "@/components/app-shell";
import { cn, ui } from "@/lib/styles";

const moods = ["가벼움", "흐림", "불안", "차분", "졸림"];

export default function MorningPage() {
  return (
    <AppShell background="/manyang/background-default.png" title="아침 기분" subtitle="꿈이 사라져도 기분은 남겨요" backHref="/">
      <div className="mt-auto space-y-5 pb-5">
        <section className={cn(ui.panel, "p-5")}>
          <p className="text-lg leading-7 text-[#fff2d6]">
            오늘 꿈은 발자국만 남기고 사라졌다냥. 그래도 아침의 기분은 기록해둘 수 있어요.
          </p>
        </section>
        <section className={cn(ui.panel, "p-4")}>
          <p className="text-sm text-[#f0bc7d]">지금 기분</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button key={mood} type="button" className={ui.chip}>
                {mood}
              </button>
            ))}
          </div>
        </section>
        <section className={cn(ui.panel, "p-4")}>
          <label htmlFor="thought" className="text-sm text-[#f0bc7d]">
            가장 먼저 든 생각
          </label>
          <input
            id="thought"
            placeholder="오늘은 천천히 시작하고 싶어"
            className={cn(ui.field, "mt-3 h-12 rounded-full px-4")}
          />
        </section>
        <button type="button" className={ui.primaryAction}>
          발자국 카드 남기기
        </button>
      </div>
    </AppShell>
  );
}
