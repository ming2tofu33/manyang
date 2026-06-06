"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import { RoutineRecordAvailabilityNotice } from "@/components/routine-record-availability-notice";
import { manyangAssets, type KeywordIconName } from "@/lib/manyang-assets";
import {
  createNightCheckInRecord,
  getNightCheckInAppDate,
  getNightCheckInSnapshotFromBrowser,
  saveNightCheckInToBrowser,
  subscribeToNightCheckIn,
  type NightCheckInRecord,
} from "@/lib/night-checkin";
import {
  defaultNightCheckInCondition,
  defaultNightCheckInMood,
  getNightCheckInConditionById,
  getNightCheckInMoodById,
  nightCheckInConditions,
  nightCheckInCopy,
  nightCheckInMoods,
  nightCheckInNoteMaxLength,
} from "@/lib/night-checkin-options";
import { getArchiveRecordEntryState } from "@/lib/record-entry-availability";
import { saveNightCheckInToApi } from "@/lib/routine-record-api";
import { cn, ui } from "@/lib/styles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mergeRemoteNightCheckInRecord } from "@/lib/use-routine-records";
import { useCurrentAppDate } from "@/lib/use-current-app-date";

type OptionButtonProps = {
  label: string;
  icon: KeywordIconName;
  isSelected: boolean;
  onClick: () => void;
};

function OptionButton({ label, icon, isSelected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex min-h-[2.45rem] items-center gap-1.5 rounded-[0.78rem] border border-[#7c4a38]/70 bg-[rgba(8,6,18,0.70)] px-2 text-left text-[11px] font-semibold leading-[1.16] text-[#e8c7b8] shadow-[inset_0_0_14px_rgba(255,201,124,0.03)] transition hover:border-[#d799ff]/70 hover:text-[#fff0dc]",
        ui.insetFocus,
        isSelected ? ui.selectedControl : "",
      )}
    >
      <span className="relative h-[1.45rem] w-[1.45rem] shrink-0" aria-hidden="true">
        <Image src={manyangAssets.keywordIcons[icon]} alt="" fill sizes="28px" unoptimized className="object-contain opacity-90" />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function NightCheckInForm({ currentDate }: { currentDate?: Date } = {}) {
  const storedCheckIn = useSyncExternalStore(subscribeToNightCheckIn, getNightCheckInSnapshotFromBrowser, () => null);
  const liveDate = useCurrentAppDate();
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [savedCheckInOverride, setSavedCheckInOverride] = useState<NightCheckInRecord | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSavingRoutineRecord, setIsSavingRoutineRecord] = useState(false);
  const [routineSaveError, setRoutineSaveError] = useState(false);
  const [showGuestPersistencePrompt, setShowGuestPersistencePrompt] = useState(true);
  const availabilityDate = currentDate ?? liveDate;
  const nightAvailability = availabilityDate ? getArchiveRecordEntryState(availabilityDate).night : null;
  const todayDate = getNightCheckInAppDate();
  const savedCheckIn = savedCheckInOverride ?? storedCheckIn;
  const hasSavedCheckInToday = savedCheckIn?.checkInDate === todayDate;
  const activeMoodId = selectedMoodId ?? (hasSavedCheckInToday ? savedCheckIn.moodId : defaultNightCheckInMood.id);
  const activeConditionId =
    selectedConditionId ?? (hasSavedCheckInToday ? savedCheckIn.conditionId : defaultNightCheckInCondition.id);
  const selectedMood = getNightCheckInMoodById(activeMoodId) ?? defaultNightCheckInMood;
  const selectedCondition = getNightCheckInConditionById(activeConditionId) ?? defaultNightCheckInCondition;
  const savedNote = hasSavedCheckInToday ? savedCheckIn.note : "";
  const displayedNote = note ?? savedNote;

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

    if (!nightAvailability?.isAvailable) {
      return;
    }

    const record = createNightCheckInRecord({
      moodId: selectedMood.id,
      moodLabel: selectedMood.label,
      conditionId: selectedCondition.id,
      conditionLabel: selectedCondition.label,
      note: displayedNote,
      checkInDate: todayDate,
    });

    saveNightCheckInToBrowser(record, { isAuthenticated });
    setSavedCheckInOverride(record);
    setSelectedMoodId(record.moodId);
    setSelectedConditionId(record.conditionId);
    setNote(record.note);

    if (!isAuthenticated) {
      setShowGuestPersistencePrompt(true);
      return;
    }

    setIsSavingRoutineRecord(true);
    setRoutineSaveError(false);

    const saveResult = await saveNightCheckInToApi(record);

    setIsSavingRoutineRecord(false);

    if (saveResult.status === "unauthenticated") {
      setIsAuthenticated(false);
      setShowGuestPersistencePrompt(true);
      return;
    }

    if (saveResult.status === "error") {
      setRoutineSaveError(true);
      return;
    }

    mergeRemoteNightCheckInRecord(saveResult.record);
    saveNightCheckInToBrowser(saveResult.record, { isAuthenticated });
  }

  if (!nightAvailability) {
    return (
      <RoutineRecordAvailabilityNotice
        title="기록 가능 시간을 확인하고 있어요"
        description="잠시 후 지금 남길 수 있는 기록이 열려요."
        ctaHref="/"
        ctaLabel="오늘 화면으로 돌아가기"
        iconSrc={manyangAssets.pageIcons.nightRecord}
      />
    );
  }

  if (!nightAvailability.isAvailable) {
    return (
      <RoutineRecordAvailabilityNotice
        title="지금은 꿈의 발자국 시간이에요"
        description={nightAvailability.disabledReason ?? "저녁 6시부터 밤의 기록을 남길 수 있어요."}
        ctaHref="/morning"
        ctaLabel="꿈의 발자국 남기기"
        iconSrc={manyangAssets.pageIcons.morningPawprint}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-0 space-y-1.5 pb-2">
      <section className="relative -mt-7 h-[17.25rem]">
        <div className="absolute right-7 top-[3.35rem] max-w-[9.6rem] rounded-[1rem] border border-[#8b563f]/70 bg-[rgba(7,6,17,0.72)] px-3 py-2 text-center text-[12px] font-semibold leading-[1.35] text-[#d8c7bc] shadow-[0_0_18px_rgba(0,0,0,0.34)]">
          오늘의 느낌은
          <br />
          내일의 단서다냥.
          <span className="relative ml-1 inline-block h-4 w-4 translate-y-0.5">
            <Image src={manyangAssets.semanticIcons.paw} alt="" fill sizes="16px" unoptimized className="object-contain opacity-80" />
          </span>
          <span className="absolute -bottom-2 left-5 h-4 w-4 rotate-45 border-b border-r border-[#8b563f]/70 bg-[rgba(7,6,17,0.72)]" />
        </div>
      </section>

      <section className="relative z-10 -mt-2 rounded-[1.05rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.78)] p-2 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2 text-[#ffd98a]">
          <span className="relative h-5 w-5">
            <Image src={manyangAssets.sectionIcons.nightMood} alt="" fill sizes="20px" unoptimized className="object-contain opacity-90" />
          </span>
          <h2 className={cn("text-[0.96rem] font-semibold", ui.textGlow)}>{nightCheckInCopy.moodTitle}</h2>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {nightCheckInMoods.map((mood) => (
            <OptionButton
              key={mood.id}
              label={mood.label}
              icon={mood.icon}
              isSelected={mood.id === selectedMood.id}
              onClick={() => setSelectedMoodId(mood.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.05rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.74)] p-2 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <p className="mb-2 flex items-center gap-2 text-[0.96rem] font-semibold text-[#ffd98a]">
          <span className="relative h-5 w-5">
            <Image src={manyangAssets.sectionIcons.nightCondition} alt="" fill sizes="20px" unoptimized className="object-contain opacity-90" />
          </span>
          {nightCheckInCopy.conditionTitle}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {nightCheckInConditions.map((condition) => (
            <OptionButton
              key={condition.id}
              label={condition.label}
              icon={condition.icon}
              isSelected={condition.id === selectedCondition.id}
              onClick={() => setSelectedConditionId(condition.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.05rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.74)] p-2 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <label htmlFor="night-checkin-note" className="mb-1.5 flex items-center gap-2 text-[0.96rem] font-semibold text-[#ffd98a]">
          <span className="relative h-5 w-5">
            <Image src={manyangAssets.sectionIcons.oneLineNote} alt="" fill sizes="20px" unoptimized className="object-contain" />
          </span>
          {nightCheckInCopy.noteLabel} <span className="text-sm font-normal text-[#fff3d7]/58">{nightCheckInCopy.optionalLabel}</span>
        </label>
        <div className="relative">
          <textarea
            id="night-checkin-note"
            value={displayedNote}
            onChange={(event) => setNote(event.target.value)}
            maxLength={nightCheckInNoteMaxLength}
            rows={2}
            placeholder={nightCheckInCopy.notePlaceholder}
            className={cn(ui.field, "min-h-[3.85rem] resize-none rounded-[0.85rem] p-2.5 pr-10 text-[13px] leading-5")}
          />
          <span className="absolute bottom-2.5 right-3 text-[12px] text-[#fff3d7]/62">
            {displayedNote.length}/{nightCheckInNoteMaxLength}
          </span>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-4 text-[#fff3d7]/70">{nightCheckInCopy.noteHint}</p>
      </section>

      {hasSavedCheckInToday ? (
        <section className="rounded-[1.25rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_24px_rgba(164,82,255,0.24)]">
          <p className="flex items-center gap-2 font-semibold text-[#ffd98a]">
            <span className="relative h-6 w-6">
              <Image src={manyangAssets.semanticIcons.star} alt="" fill sizes="24px" unoptimized className="object-contain" />
            </span>
            {nightCheckInCopy.savedTitle}
          </p>
          {routineSaveError ? <p className="mt-1 text-[#f0bc7d]">밤의 기록 저장이 잠시 지연됐어요. 다시 시도해 주세요.</p> : null}
          <p className="mt-1 text-[#fff3d7]/78">
            {savedCheckIn.moodLabel} · {savedCheckIn.conditionLabel}
          </p>
        </section>
      ) : null}

      {routineSaveError && !hasSavedCheckInToday ? (
        <section className="rounded-[1.05rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#f0bc7d] shadow-[0_0_24px_rgba(164,82,255,0.24)]">
          밤의 기록 저장이 잠시 지연됐어요. 다시 시도해 주세요.
        </section>
      ) : null}

      {showGuestPersistencePrompt ? (
        <section
          className="rounded-[1.05rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_24px_rgba(164,82,255,0.24)]"
          data-routine-login-cta="night-checkin"
        >
          <p className="font-semibold text-[#ffd98a]">밤의 기록은 이 기기에 저장됐어요.</p>
          <p className="mt-1 text-[#fff3d7]/78">로그인하면 이 기록을 계정에 백업하고 다음 꿈 해몽에도 이어서 참고할 수 있어요.</p>
          <AssetTextButton
            href="/auth?next=%2Fnight"
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

      <button
        type="submit"
        aria-label={hasSavedCheckInToday ? nightCheckInCopy.submitAgain : nightCheckInCopy.submit}
        disabled={isSavingRoutineRecord}
        className="relative mx-auto -mt-1 block w-[66%] px-2 py-0 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b] disabled:cursor-wait disabled:opacity-70"
      >
        <Image
          src={manyangAssets.buttons.dreamseed}
          alt=""
          width={852}
          height={300}
          sizes="340px"
          unoptimized
          className="manyang-button-glow h-auto w-full"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center pb-1 text-[1.38rem] font-semibold leading-none tracking-normal text-[#ffc978] [text-shadow:0_2px_2px_rgba(34,10,20,0.88),0_0_14px_rgba(255,198,104,0.26)]">
          {hasSavedCheckInToday ? nightCheckInCopy.submitAgain : nightCheckInCopy.submit}
        </span>
      </button>

      {hasSavedCheckInToday ? (
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

      <p className="text-center text-[11.5px] text-[#fff3d7]/70">{nightCheckInCopy.footer}</p>
    </form>
  );
}
