"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  type ArchiveRecordEntryAvailability,
  type ArchiveRecordEntryKey,
  getArchiveRecordEntryState,
} from "@/lib/record-entry-availability";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { useAccessPlan } from "@/lib/use-access-plan";
import { useAdminLabTimeOverride } from "@/lib/use-admin-lab-time-override";

type ArchiveRecordEntryDefinition = {
  key: ArchiveRecordEntryKey;
  title: string;
  description: string;
  href: string;
  icon: string;
};

const fallbackArchiveEntryDate = new Date("2026-05-24T08:00:00.000+09:00");

let currentArchiveEntryDateSnapshot: Date | null = null;

function getCurrentArchiveEntryDateSnapshot(): Date {
  currentArchiveEntryDateSnapshot ??= new Date();

  return currentArchiveEntryDateSnapshot;
}

function getServerArchiveEntryDateSnapshot(): Date | null {
  return null;
}

function subscribeToArchiveEntryDate(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const timer = window.setInterval(() => {
    currentArchiveEntryDateSnapshot = new Date();
    onStoreChange();
  }, 60_000);

  return () => window.clearInterval(timer);
}

const recordEntries: ArchiveRecordEntryDefinition[] = [
  {
    key: "dream",
    title: "꿈 들려주기",
    description: "기억나는 꿈을 적고 고양이에게 해몽을 받아요.",
    href: "/write",
    icon: manyangAssets.pageIcons.write,
  },
  {
    key: "morning",
    title: "꿈의 발자국 남기기",
    description: "꿈이 흐릿한 날, 기분과 몸 상태만 남겨요.",
    href: "/morning",
    icon: manyangAssets.pageIcons.morningPawprint,
  },
  {
    key: "night",
    title: "밤의 기록 남기기",
    description: "잠들기 전 오늘의 마음과 컨디션을 남겨요.",
    href: "/night",
    icon: manyangAssets.pageIcons.nightRecord,
  },
];

function RecordEntryContent({
  entry,
  availability,
}: {
  entry: ArchiveRecordEntryDefinition;
  availability: ArchiveRecordEntryAvailability;
}) {
  return (
    <>
      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[rgba(255,217,138,0.06)] ring-1 ring-[#d799ff]/12">
        <span className="relative h-7 w-7">
          <Image src={entry.icon} alt="" fill sizes="28px" unoptimized className="object-contain" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1rem] font-semibold leading-6 text-[#ffd98a]">{entry.title}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-[#fff3d7]/70">
          {availability.disabledReason ?? entry.description}
        </span>
      </span>
      <span className="relative h-6 w-6 shrink-0 opacity-75" aria-hidden="true">
        <Image
          src={availability.isAvailable ? manyangAssets.actionIcons.arrowRight : manyangAssets.actionIcons.more}
          alt=""
          fill
          sizes="24px"
          unoptimized
          className="object-contain"
        />
      </span>
    </>
  );
}

function RecordEntryCard({
  entry,
  availability,
}: {
  entry: ArchiveRecordEntryDefinition;
  availability: ArchiveRecordEntryAvailability;
}) {
  const className = cn(
    "flex min-h-[4.85rem] items-center gap-3 rounded-[1.05rem] border px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,226,176,0.06)] transition",
    availability.isAvailable
      ? "border-[#9d6545]/58 bg-[rgba(10,8,21,0.68)] hover:border-[#ffd08a]/68 hover:bg-[rgba(20,11,34,0.78)] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
      : "border-[#5f3e34]/42 bg-[rgba(8,7,15,0.44)] opacity-62",
  );

  if (availability.isAvailable) {
    return (
      <Link
        href={entry.href}
        className={className}
        data-record-entry={entry.key}
        data-record-entry-available="true"
      >
        <RecordEntryContent entry={entry} availability={availability} />
      </Link>
    );
  }

  return (
    <div
      className={className}
      data-record-entry={entry.key}
      data-record-entry-available="false"
      aria-disabled="true"
    >
      <RecordEntryContent entry={entry} availability={availability} />
    </div>
  );
}

export function ArchiveRecordEntryPanel({ currentDate }: { currentDate?: Date }) {
  const accessState = useAccessPlan();
  const adminLabTime = useAdminLabTimeOverride(accessState.role);
  const liveDate = useSyncExternalStore(
    subscribeToArchiveEntryDate,
    getCurrentArchiveEntryDateSnapshot,
    getServerArchiveEntryDateSnapshot,
  );
  const activeDate = currentDate ?? adminLabTime.forcedDate ?? liveDate ?? fallbackArchiveEntryDate;
  const entryState = getArchiveRecordEntryState(activeDate);

  return (
    <section
      className={cn(ui.panel, "space-y-3 p-4")}
      data-archive-record-entry-panel="true"
      data-admin-lab-time-override={adminLabTime.override}
    >
      <header className="px-1">
        <h2 className={cn("text-lg font-semibold text-[#ffd98a]", ui.textGlow)}>기록하기</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#fff3d7]/68">지금 남길 수 있는 기록을 골라요.</p>
      </header>
      <div className="space-y-2">
        {recordEntries.map((entry) => (
          <RecordEntryCard key={entry.key} entry={entry} availability={entryState[entry.key]} />
        ))}
      </div>
    </section>
  );
}
