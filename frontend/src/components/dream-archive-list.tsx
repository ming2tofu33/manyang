"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  deleteDreamRecordToBrowser,
  getDreamRecordsSnapshotFromBrowser,
  getEmptyDreamRecordsSnapshot,
  subscribeToDreamStorage,
  type DreamRecord,
} from "@/lib/dream-storage";
import { cn, ui } from "@/lib/styles";

function formatDreamDate(date: string): string {
  return date.replaceAll("-", ".");
}

export function DreamArchiveList() {
  const records = useSyncExternalStore(
    subscribeToDreamStorage,
    getDreamRecordsSnapshotFromBrowser,
    getEmptyDreamRecordsSnapshot,
  );

  function handleDelete(record: DreamRecord) {
    const confirmed = window.confirm(
      `"${record.analysis.summary}" 기록을 삭제할까요?\n삭제한 기록은 다시 불러올 수 없어요.`,
    );

    if (confirmed) {
      deleteDreamRecordToBrowser(record.id);
    }
  }

  if (records.length === 0) {
    return (
      <section className={cn(ui.panel, "space-y-4 p-5 text-center")}>
        <p className="text-lg font-semibold text-[#ffd98a]">아직 기록된 꿈이 없어요.</p>
        <p className="text-sm leading-6 text-[#fff3d7]/76">
          꿈을 쓰고 해몽을 받으면 이곳에 자동으로 남아요.
        </p>
        <Link href="/write" className={cn(ui.secondaryAction, "min-h-[3.25rem] text-base")}>
          꿈쓰기
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <section key={record.id} className={cn(ui.panel, "p-4")}>
          <header className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#f0bc7d]">{formatDreamDate(record.dreamDate)}</p>
              <h2 className="mt-2 text-2xl leading-snug text-[#ffd98a]">{record.analysis.summary}</h2>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(record)}
              aria-label={`${record.analysis.summary} 기록 삭제`}
              title="기록 삭제"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#b98255]/45 bg-[#06040c]/55 text-[#ffb49f] transition hover:border-[#ffb49f]/70 hover:bg-[#2a1217]/72 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </header>
          <p className="mt-3 leading-7 text-[#fff3d7]/86">{record.dreamText}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {record.analysis.symbols.slice(0, 5).map((symbol) => (
              <span key={symbol} className={ui.chip}>
                {symbol}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
