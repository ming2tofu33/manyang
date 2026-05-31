"use client";

import Image from "next/image";
import { FormEvent, type ReactNode, useEffect, useState, useSyncExternalStore } from "react";

import { AssetImageTextButton, AssetTextButton } from "@/components/asset-primitives";
import {
  createMorningMoodRecord,
  getEmptyMorningMoodRecordsSnapshot,
  getMorningMoodRecordsSnapshotFromBrowser,
  morningThoughtMaxLength,
  saveMorningMoodRecordToBrowser,
  subscribeToMorningMood,
  type MorningMoodRecord,
} from "@/lib/morning-mood";
import {
  createPawprintRecord,
  getPawprintAppDate,
  savePawprintToBrowser,
} from "@/lib/pawprints";
import { savePawprintToApi } from "@/lib/routine-record-api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mergeRemotePawprintResult } from "@/lib/use-routine-records";
import {
  morningBodyFeelings,
  morningMoodCopy,
  morningMoodOptions,
} from "@/lib/morning-mood-options";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

type IconName = keyof typeof manyangAssets.semanticIcons;

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

type ChoiceChipProps = {
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
};

function ChoiceChip({ label, icon, isSelected, onClick, compact = false }: ChoiceChipProps) {
  const iconSrc = manyangAssets.semanticIcons[icon as IconName] ?? manyangAssets.semanticIcons.paw;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-[0.95rem] border border-[#7c4a38]/72 bg-[rgba(8,6,18,0.70)] px-1.5 font-semibold leading-tight text-[#e8c7b8] shadow-[inset_0_0_14px_rgba(255,201,124,0.03)] transition hover:border-[#ffd08a]/70 hover:text-[#fff0dc] focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
        compact ? "min-h-[2.55rem] text-[12.5px]" : "min-h-[2.9rem] text-[13.5px]",
        isSelected
          ? "border-[#e29cff] bg-[linear-gradient(135deg,rgba(87,36,118,0.88),rgba(18,11,30,0.92))] text-[#ffe7b5] shadow-[0_0_22px_rgba(199,117,255,0.32),inset_0_0_18px_rgba(255,216,138,0.08)]"
          : "",
      )}
    >
      <span className="relative h-[18px] w-[18px] shrink-0">
        <Image src={iconSrc} alt="" fill sizes="18px" unoptimized className="object-contain opacity-90" />
      </span>
      <span>{label}</span>
    </button>
  );
}

type PanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

function Panel({ title, children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.05rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.74)] p-2.5 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-center gap-2 text-[#ffd98a]">
        <span className="relative h-5 w-5">
          <Image src={manyangAssets.semanticIcons.paw} alt="" fill sizes="20px" unoptimized className="object-contain opacity-90" />
        </span>
        <h2 className={cn("text-[1.05rem] font-semibold", ui.textGlow)}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function MorningMoodForm() {
  const storedRecords = useSyncExternalStore(
    subscribeToMorningMood,
    getMorningMoodRecordsSnapshotFromBrowser,
    getEmptyMorningMoodRecordsSnapshot,
  );
  const todayDate = getTodayDate();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedBodyFeeling, setSelectedBodyFeeling] = useState<string | null>(null);
  const [thought, setThought] = useState<string | null>(null);
  const [savedRecordOverride, setSavedRecordOverride] = useState<MorningMoodRecord | null>(null);
  const [pawprintCreated, setPawprintCreated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSavingRoutineRecord, setIsSavingRoutineRecord] = useState(false);
  const [routineSaveError, setRoutineSaveError] = useState(false);
  const [showGuestPersistencePrompt, setShowGuestPersistencePrompt] = useState(true);
  const savedRecord =
    savedRecordOverride ?? storedRecords.find((record) => record.moodDate === todayDate) ?? null;
  const activeMood = selectedMood ?? savedRecord?.mood ?? "";
  const activeBodyFeeling = selectedBodyFeeling ?? savedRecord?.bodyFeeling ?? "";
  const displayedThought = thought ?? savedRecord?.thought ?? "";
  const hasSavedToday = savedRecord !== null;

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          setIsAuthenticated(Boolean(data.session));
          setShowGuestPersistencePrompt(!data.session);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setShowGuestPersistencePrompt(true);
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const record = createMorningMoodRecord({
      mood: activeMood,
      moodColor: "",
      bodyFeeling: activeBodyFeeling,
      thought: displayedThought,
      moodDate: todayDate,
    });

    if (!isAuthenticated) {
      setShowGuestPersistencePrompt(true);
      setPawprintCreated(false);
      return;
    }

    saveMorningMoodRecordToBrowser(record);
    const pawprintInput = {
      appDate: getPawprintAppDate(),
      source: "morning_record" as const,
      sourceId: record.id,
    };

    setIsSavingRoutineRecord(true);
    setRoutineSaveError(false);

    const pawprintResult = await savePawprintToApi(pawprintInput);

    setIsSavingRoutineRecord(false);

    setSavedRecordOverride(record);
    setSelectedMood(record.mood);
    setSelectedBodyFeeling(record.bodyFeeling);
    setThought(record.thought);

    if (pawprintResult.status === "unauthenticated") {
      setIsAuthenticated(false);
      setShowGuestPersistencePrompt(true);
      setPawprintCreated(false);
      return;
    }

    if (pawprintResult.status === "error") {
      setRoutineSaveError(true);
      setPawprintCreated(false);
      return;
    }

    mergeRemotePawprintResult(pawprintResult);
    savePawprintToBrowser(createPawprintRecord(pawprintInput), { isAuthenticated });
    setPawprintCreated(pawprintResult.created);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-0 space-y-2.5 pb-5">
      <section className="h-[13rem]" aria-hidden="true" />

      <Panel title={morningMoodCopy.moodTitle}>
        <div className="grid grid-cols-4 gap-1.5">
          {morningMoodOptions.map((mood) => (
            <ChoiceChip
              key={mood.label}
              label={mood.label}
              icon={mood.icon}
              isSelected={activeMood === mood.label}
              onClick={() => setSelectedMood(activeMood === mood.label ? "" : mood.label)}
            />
          ))}
        </div>
      </Panel>

      <Panel title={morningMoodCopy.bodyTitle}>
        <div className="grid grid-cols-3 gap-1.5">
          {morningBodyFeelings.map((feeling) => (
            <ChoiceChip
              key={feeling.label}
              label={feeling.label}
              icon={feeling.icon}
              isSelected={activeBodyFeeling === feeling.label}
              onClick={() => setSelectedBodyFeeling(activeBodyFeeling === feeling.label ? "" : feeling.label)}
              compact
            />
          ))}
        </div>
      </Panel>

      <Panel title={`${morningMoodCopy.thoughtTitle} (선택)`} className="space-y-2">
        <div className="relative">
          <input
            id="morning-thought"
            aria-label={morningMoodCopy.thoughtTitle}
            value={displayedThought}
            maxLength={morningThoughtMaxLength}
            onChange={(event) => setThought(event.target.value)}
            placeholder={morningMoodCopy.thoughtPlaceholder}
            className={cn(ui.field, "h-14 rounded-[0.95rem] px-4 pr-16 text-[15px]")}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2">
            <Image src={manyangAssets.semanticIcons.feather} alt="" fill sizes="24px" unoptimized className="object-contain opacity-60" />
          </span>
        </div>
      </Panel>

      {hasSavedToday ? (
        <section className="rounded-[1.05rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_24px_rgba(164,82,255,0.24)]">
          <p className="font-semibold text-[#ffd98a]">{morningMoodCopy.savedTitle}</p>
          <p className="mt-1 text-[#fff3d7]/78">{morningMoodCopy.savedDescription}</p>
          {routineSaveError ? <p className="mt-1 text-[#f0bc7d]">발자국 저장이 잠시 지연됐어요. 다시 시도해 주세요.</p> : null}
          {pawprintCreated ? <p className="mt-1 font-semibold text-[#f0bc7d]">오늘의 발자국이 남았어요.</p> : null}
        </section>
      ) : null}

      {showGuestPersistencePrompt ? (
        <section
          className="rounded-[1.05rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_24px_rgba(164,82,255,0.24)]"
          data-routine-login-cta="pawprint"
        >
          <p className="font-semibold text-[#ffd98a]">로그인하면 오늘의 발자국이 기록장에 남아요.</p>
          <p className="mt-1 text-[#fff3d7]/78">
            비로그인 상태에서는 발자국을 누적하지 않고, 계정에 로그인하면 달력과 기록장에 남길 수 있어요.
          </p>
          <AssetTextButton
            href="/auth?next=%2Fmorning"
            frame={manyangAssets.buttons.mediumSecondary}
            iconSrc={manyangAssets.actionIcons.profile}
            className="mt-3 max-w-[15rem]"
            contentClassName="min-h-[3.05rem] px-4 text-sm"
            iconClassName="h-6 w-6"
          >
            Google로 로그인하기
          </AssetTextButton>
        </section>
      ) : null}

      <AssetImageTextButton
        type="submit"
        frame={manyangAssets.buttons.morningPawprint}
        width={852}
        height={300}
        sizes="340px"
        className="mx-auto -mt-1 block w-[82%] px-2 py-0"
        imageClassName="manyang-button-glow"
        contentClassName="text-[1.35rem]"
        disabled={isSavingRoutineRecord}
      >
        {isSavingRoutineRecord ? "저장 중" : hasSavedToday ? morningMoodCopy.submitAgain : morningMoodCopy.submit}
      </AssetImageTextButton>

      {hasSavedToday ? (
        <AssetTextButton
          href="/"
          frame={manyangAssets.buttons.mediumSecondary}
          iconSrc={manyangAssets.actionIcons.arrowLeft}
          className="mx-auto max-w-[15rem]"
          contentClassName="min-h-[3.05rem] px-4 text-sm"
          iconClassName="h-6 w-6"
        >
          오늘 화면으로 돌아가기
        </AssetTextButton>
      ) : null}

      <p className="text-center text-sm text-[#fff3d7]/70">{morningMoodCopy.footer}</p>
    </form>
  );
}
