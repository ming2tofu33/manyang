"use client";

import Link from "next/link";
import { Clock, RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminToolNav } from "@/components/admin-tool-nav";
import {
  adminLabBoundaryTimePresets,
  adminLabPrimaryTimePresets,
  type AdminLabTimeOverride,
  type AdminLabTimePreset,
  getAdminLabTimePreset,
} from "@/lib/admin-lab-mode";
import { getHomeState } from "@/lib/home-mode";
import { getArchiveRecordEntryState } from "@/lib/record-entry-availability";
import { cn } from "@/lib/styles";
import { useAccessPlan } from "@/lib/use-access-plan";
import { useAdminLabTimeOverride } from "@/lib/use-admin-lab-time-override";

const fallbackAdminLabDate = new Date("2026-06-01T10:00:00.000+09:00");

const kstDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

function formatKstDateTime(date: Date): string {
  return `${kstDateTimeFormatter.format(date)} KST`;
}

function getModeLabel(mode: "morning" | "night"): string {
  return mode === "night" ? "밤" : "낮";
}

function getAvailabilityLabel(isAvailable: boolean): string {
  return isAvailable ? "가능" : "비활성";
}

function AdminLabPanel({
  children,
  title,
  icon,
}: {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#7c4a38]/55 bg-[rgba(7,6,17,0.82)] p-3 ring-1 ring-[#d799ff]/10">
      <div className="mb-3 flex items-center gap-2">
        {icon ? <span className="grid h-7 w-7 place-items-center rounded-md bg-[#140d22] text-[#e7b3ff]">{icon}</span> : null}
        <h2 className="text-[0.95rem] font-semibold text-[#ffd98a]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AdminLabStatusRow({ label, value, tone }: { label: string; value: string; tone?: "warn" | "ok" }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 border-t border-[#7c4a38]/35 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-[12px] text-[#fff3d7]/66">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right text-[12px] font-semibold",
          tone === "warn" ? "text-[#ffca7a]" : tone === "ok" ? "text-[#9fe6bd]" : "text-[#fff3d7]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AdminLabPresetButton({
  active,
  onClick,
  preset,
}: {
  active: boolean;
  onClick: () => void;
  preset: AdminLabTimePreset;
}) {
  return (
    <button
      type="button"
      data-admin-lab-time-preset={preset.id}
      data-admin-lab-time-preset-active={active ? "true" : "false"}
      onClick={onClick}
      className={cn(
        "min-h-[4.7rem] rounded-md border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
        active
          ? "border-[#ffd08a]/80 bg-[#24172e] text-[#fff3d7]"
          : "border-[#7c4a38]/48 bg-[#06040c]/62 text-[#fff3d7]/78 hover:border-[#ffd08a]/58",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold">{preset.label}</span>
        <span className="shrink-0 text-[11px] text-[#f0bc7d]">{preset.timeLabel}</span>
      </span>
      <span className="mt-1 block text-[11px] leading-4 text-[#fff3d7]/62">{preset.description}</span>
    </button>
  );
}

export function AdminLab() {
  const accessState = useAccessPlan();
  const adminLabTime = useAdminLabTimeOverride(accessState.role);
  const [now, setNow] = useState<Date>(fallbackAdminLabDate);

  useEffect(() => {
    const syncCurrentDate = () => setNow(new Date());

    const initialTimer = window.setTimeout(syncCurrentDate, 0);
    const timer = window.setInterval(syncCurrentDate, 60_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const activeDate = adminLabTime.forcedDate ?? now;
  const homeState = useMemo(() => getHomeState(activeDate, null), [activeDate]);
  const recordEntryState = useMemo(() => getArchiveRecordEntryState(activeDate), [activeDate]);
  const activePreset = getAdminLabTimePreset(adminLabTime.override);
  const recordMode = recordEntryState.night.isAvailable ? "night" : "morning";
  const hasBoundaryMismatch = homeState.mode !== recordMode;

  if (accessState.role !== "admin") {
    return (
      <section
        data-admin-lab-state="restricted"
        className="mt-4 rounded-md border border-[#7c4a38]/55 bg-[rgba(7,6,17,0.82)] p-4"
      >
        <p className="text-[0.95rem] font-semibold text-[#ffd98a]">Admin only</p>
        <p className="mt-2 text-[12px] leading-5 text-[#fff3d7]/72">
          어드민 권한을 확인하는 중이거나, 현재 계정에는 Admin Lab 접근 권한이 없습니다.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-flex rounded-md border border-[#b98255]/55 bg-[#06040c]/70 px-3 py-2 text-[12px] font-semibold text-[#ffe7b5]"
        >
          프로필로 돌아가기
        </Link>
      </section>
    );
  }

  const setOverride = (override: AdminLabTimeOverride) => adminLabTime.setOverride(override);

  return (
    <div data-admin-lab-state="active" data-admin-lab-time-override={adminLabTime.override} className="mt-4 space-y-3 pb-5">
      <AdminToolNav activeId="admin-lab" />

      <AdminLabPanel title="시간 모드" icon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            data-admin-lab-time-preset="auto"
            data-admin-lab-time-preset-active={adminLabTime.override === "auto" ? "true" : "false"}
            onClick={() => setOverride("auto")}
            className={cn(
              "min-h-[4.3rem] rounded-md border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
              adminLabTime.override === "auto"
                ? "border-[#ffd08a]/80 bg-[#24172e] text-[#fff3d7]"
                : "border-[#7c4a38]/48 bg-[#06040c]/62 text-[#fff3d7]/78 hover:border-[#ffd08a]/58",
            )}
          >
            <RotateCcw aria-hidden="true" className="mb-1 h-4 w-4 text-[#f0bc7d]" />
            <span className="block text-[13px] font-semibold">자동</span>
            <span className="mt-1 block text-[11px] leading-4 text-[#fff3d7]/62">실제 현재 시간</span>
          </button>
          {adminLabPrimaryTimePresets.map((preset) => (
            <AdminLabPresetButton
              key={preset.id}
              preset={preset}
              active={adminLabTime.override === preset.id}
              onClick={() => setOverride(preset.id)}
            />
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {adminLabBoundaryTimePresets.map((preset) => (
            <AdminLabPresetButton
              key={preset.id}
              preset={preset}
              active={adminLabTime.override === preset.id}
              onClick={() => setOverride(preset.id)}
            />
          ))}
        </div>
      </AdminLabPanel>

      <AdminLabPanel title="계산 결과" icon={<Clock aria-hidden="true" className="h-4 w-4" />}>
        <AdminLabStatusRow label="적용 시간" value={formatKstDateTime(activeDate)} />
        <AdminLabStatusRow
          label="override"
          value={activePreset ? `${activePreset.label} (${activePreset.timeLabel})` : "자동"}
        />
        <AdminLabStatusRow label="홈 모드" value={getModeLabel(homeState.mode)} />
        <AdminLabStatusRow label="홈 CTA" value={`꿈 해몽 / 타로${homeState.secondary ? " / 기억나지 않아요" : ""}`} />
        <AdminLabStatusRow
          label="기록 모드"
          value={recordMode === "night" ? "밤 기록 가능" : "아침 기록 가능"}
        />
        <AdminLabStatusRow
          label="경계 상태"
          value={hasBoundaryMismatch ? "홈/기록 기준 다름" : "홈/기록 기준 같음"}
          tone={hasBoundaryMismatch ? "warn" : "ok"}
        />
      </AdminLabPanel>

      <AdminLabPanel title="기록 입력 상태">
        <AdminLabStatusRow label="꿈 해몽" value={getAvailabilityLabel(recordEntryState.dream.isAvailable)} tone="ok" />
        <AdminLabStatusRow
          label="아침 기록"
          value={
            recordEntryState.morning.isAvailable
              ? "가능"
              : (recordEntryState.morning.disabledReason ?? "비활성")
          }
        />
        <AdminLabStatusRow
          label="밤 기록"
          value={recordEntryState.night.isAvailable ? "가능" : (recordEntryState.night.disabledReason ?? "비활성")}
        />
      </AdminLabPanel>

      <AdminLabPanel title="어드민 접근" icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />}>
        <AdminLabStatusRow label="access plan" value={accessState.accessPlan} />
        <AdminLabStatusRow label="daily limit" value={accessState.bypassDailyLimit ? "우회" : "기본 정책"} />
        <AdminLabStatusRow label="Moon Pass gate" value={accessState.bypassAccessGate ? "우회" : "기본 정책"} />
      </AdminLabPanel>
    </div>
  );
}
