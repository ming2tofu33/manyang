import { AppShell } from "@/components/app-shell";
import { cn, ui } from "@/lib/styles";

export default function EncyclopediaDetailPage() {
  return (
    <AppShell background="/manyang/background-default.png" title="복도" subtitle="전환 구간과 이동 중인 마음" backHref="/encyclopedia">
      <div className="mt-auto space-y-4 pb-5">
        <section className={cn(ui.panel, "p-5")}>
          <p className="text-sm text-[#f0bc7d]">핵심 의미</p>
          <h1 className="mt-3 text-3xl text-[#ffd98a]">목적지에 닿기 전의 길</h1>
          <p className="mt-4 leading-7 text-[#fff3d7]/88">
            복도는 아직 목적지에 도착하기 전의 전환 구간을 의미할 수 있어요. 선택 전 상태,
            이동 중인 마음, 아직 결정되지 않은 방향성과 연결됩니다.
          </p>
        </section>
        <section className={cn(ui.panel, "p-5")}>
          <p className="text-sm text-[#f0bc7d]">검은냥 힌트</p>
          <p className="mt-3 leading-7 text-[#fff3d7]/88">
            요즘 꿈에 복도가 자주 보인다면, 아직 목적지를 찾는 중일지도 모르겠다냥.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
