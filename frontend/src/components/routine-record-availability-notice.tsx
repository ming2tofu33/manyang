import Image from "next/image";
import Link from "next/link";

import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

type RoutineRecordAvailabilityNoticeProps = {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  iconSrc: string;
};

export function RoutineRecordAvailabilityNotice({
  title,
  description,
  ctaHref,
  ctaLabel,
  iconSrc,
}: RoutineRecordAvailabilityNoticeProps) {
  return (
    <section
      className={cn(ui.panel, "mx-auto mt-[15.5rem] space-y-4 p-4 text-center")}
      data-routine-record-unavailable="true"
    >
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-[rgba(255,217,138,0.06)] ring-1 ring-[#d799ff]/18">
        <span className="relative h-9 w-9">
          <Image src={iconSrc} alt="" fill sizes="36px" unoptimized className="object-contain" />
        </span>
      </span>
      <div className="space-y-1.5">
        <h2 className={cn("text-[1.2rem] font-semibold text-[#ffd98a]", ui.textGlow)}>{title}</h2>
        <p className="text-sm leading-6 text-[#fff3d7]/76">{description}</p>
      </div>
      <Link
        href={ctaHref}
        className={cn(
          "mx-auto flex min-h-11 max-w-[15rem] items-center justify-center rounded-full border border-[#9d6545]/58 bg-[rgba(10,8,21,0.68)] px-5 text-sm font-semibold text-[#ffd98a] transition hover:border-[#ffd08a]/68 hover:bg-[rgba(20,11,34,0.78)]",
          ui.insetFocus,
        )}
      >
        {ctaLabel}
        <span className="relative ml-2 h-5 w-5" aria-hidden="true">
          <Image src={manyangAssets.actionIcons.arrowRight} alt="" fill sizes="20px" unoptimized className="object-contain" />
        </span>
      </Link>
    </section>
  );
}
