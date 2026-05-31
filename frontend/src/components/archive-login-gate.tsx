import Image from "next/image";

import { AssetTextButton } from "@/components/asset-primitives";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

export const archiveLoginHref = "/auth?next=%2Farchive";

export function getArchiveLoginGateCopy(): {
  title: string;
  body: string;
  buttonLabel: string;
} {
  return {
    title: "꿈 기록장은 로그인하면 열려요",
    body: "꿈 영수증은 바로 볼 수 있지만, 달력에 남기고 반복되는 상징을 모으려면 계정이 필요해요.",
    buttonLabel: "Google로 로그인하고 기록장 열기",
  };
}

export function ArchiveLoginGate() {
  const copy = getArchiveLoginGateCopy();

  return (
    <section
      className={cn(ui.panel, "space-y-4 p-5 text-center")}
      data-archive-login-gate="true"
    >
      <span className="relative mx-auto block h-16 w-16">
        <Image
          src={manyangAssets.semanticIcons.moon}
          alt=""
          fill
          sizes="64px"
          unoptimized
          className="object-contain drop-shadow-[0_0_18px_rgba(255,217,138,0.32)]"
        />
      </span>
      <div className="space-y-2">
        <p className={cn("text-lg font-semibold text-[#ffd98a]", ui.textGlow)}>{copy.title}</p>
        <p className="text-sm leading-6 text-[#fff3d7]/76">{copy.body}</p>
      </div>
      <AssetTextButton
        href={archiveLoginHref}
        frame={manyangAssets.buttons.mediumSecondary}
        iconSrc={manyangAssets.actionIcons.calendar}
        className="mx-auto max-w-[17rem]"
        contentClassName="min-h-[3.2rem] px-4 text-base"
        iconClassName="h-6 w-6"
      >
        {copy.buttonLabel}
      </AssetTextButton>
    </section>
  );
}
