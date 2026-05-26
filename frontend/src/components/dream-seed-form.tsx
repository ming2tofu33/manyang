"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import {
  Cloud,
  Heart,
  Moon,
  MoreHorizontal,
  UsersRound,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import {
  createDreamSeedRecord,
  getDreamSeedSnapshotFromBrowser,
  saveDreamSeedToBrowser,
  subscribeToDreamSeed,
  type DreamSeedRecord,
} from "@/lib/dream-seed";
import {
  defaultDreamSeedAtmosphere,
  defaultDreamSeedIntent,
  dreamSeedAtmospheres,
  dreamSeedCopy,
  dreamSeedIntents,
  dreamSeedNoteMaxLength,
  getDreamSeedIntentById,
  type DreamSeedIntentId,
} from "@/lib/dream-seed-options";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

const intentIcons: Record<DreamSeedIntentId, LucideIcon> = {
  question: Heart,
  strange: Cloud,
  project: WandSparkles,
  meet: UsersRound,
  comfort: Moon,
  custom: MoreHorizontal,
};

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

type SeedIntentButtonProps = {
  intent: (typeof dreamSeedIntents)[number];
  isSelected: boolean;
  onClick: () => void;
};

function SeedIntentButton({ intent, isSelected, onClick }: SeedIntentButtonProps) {
  const Icon = intentIcons[intent.id];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex min-h-[2.45rem] items-center gap-1.5 rounded-[0.78rem] border border-[#7c4a38]/70 bg-[rgba(8,6,18,0.70)] px-1.5 text-left text-[10.2px] font-semibold leading-[1.16] text-[#e8c7b8] shadow-[inset_0_0_14px_rgba(255,201,124,0.03)] transition hover:border-[#d799ff]/70 hover:text-[#fff0dc] focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
        isSelected
          ? "border-[#e29cff] bg-[linear-gradient(135deg,rgba(87,36,118,0.88),rgba(18,11,30,0.92))] text-[#ffe7b5] shadow-[0_0_20px_rgba(199,117,255,0.28),inset_0_0_18px_rgba(255,216,138,0.08)]"
          : "",
      )}
    >
      <Icon size={17} strokeWidth={1.85} className="shrink-0 text-[#c88963]" aria-hidden="true" />
      <span>{intent.label}</span>
    </button>
  );
}

type AtmosphereButtonProps = {
  label: (typeof dreamSeedAtmospheres)[number];
  isSelected: boolean;
  onClick: () => void;
};

function AtmosphereButton({ label, isSelected, onClick }: AtmosphereButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "min-h-[1.95rem] rounded-full border border-[#7c4a38]/72 bg-[rgba(8,6,18,0.68)] px-1.5 text-[10.5px] font-semibold text-[#e8c7b8] transition hover:border-[#ffd98a]/75 hover:text-[#ffe7b5] focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
        isSelected
          ? "border-[#ffd98a]/85 bg-[rgba(87,36,118,0.58)] text-[#ffe7b5] shadow-[0_0_16px_rgba(199,117,255,0.22)]"
          : "",
      )}
    >
      {label}
    </button>
  );
}

export function DreamSeedForm() {
  const storedSeed = useSyncExternalStore(subscribeToDreamSeed, getDreamSeedSnapshotFromBrowser, () => null);
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [savedSeedOverride, setSavedSeedOverride] = useState<DreamSeedRecord | null>(null);
  const todayDate = getTodayDate();
  const savedSeed = savedSeedOverride ?? storedSeed;
  const hasSavedSeedToday = savedSeed?.seedDate === todayDate;
  const activeIntentId = selectedIntentId ?? (hasSavedSeedToday ? savedSeed.intentId : defaultDreamSeedIntent.id);
  const selectedIntent = getDreamSeedIntentById(activeIntentId) ?? defaultDreamSeedIntent;
  const activeAtmosphere =
    selectedAtmosphere ?? (hasSavedSeedToday ? savedSeed.atmosphere : defaultDreamSeedAtmosphere) ?? defaultDreamSeedAtmosphere;
  const savedNoteForActiveIntent = hasSavedSeedToday && savedSeed.intentId === selectedIntent.id ? savedSeed.note : "";
  const displayedNote = note ?? savedNoteForActiveIntent;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const record = createDreamSeedRecord({
      intentId: selectedIntent.id,
      intentLabel: selectedIntent.label,
      atmosphere: activeAtmosphere,
      note: displayedNote,
      seedDate: todayDate,
    });

    saveDreamSeedToBrowser(record);
    setSavedSeedOverride(record);
    setSelectedIntentId(record.intentId);
    setSelectedAtmosphere(record.atmosphere);
    setNote(record.note);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-0 space-y-1.5 pb-2">
      <section className="relative -mt-7 h-[16rem]">
        <div className="absolute right-7 top-[5.05rem] max-w-[8.7rem] rounded-[1rem] border border-[#8b563f]/70 bg-[rgba(7,6,17,0.72)] px-3 py-2 text-center text-[12px] font-semibold leading-[1.35] text-[#d8c7bc] shadow-[0_0_18px_rgba(0,0,0,0.34)]">
          기억하지 못해도
          <br />
          괜찮다냥.
          <span className="relative ml-1 inline-block h-4 w-4 translate-y-0.5">
            <Image src={manyangAssets.icons.paw} alt="" fill sizes="16px" unoptimized className="object-contain opacity-80" />
          </span>
          <span className="absolute -bottom-2 left-5 h-4 w-4 rotate-45 border-b border-r border-[#8b563f]/70 bg-[rgba(7,6,17,0.72)]" />
        </div>
      </section>

      <section className="relative z-10 -mt-8 rounded-[1.05rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.78)] p-2 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2 text-[#ffd98a]">
          <span className="relative h-5 w-5">
            <Image src={manyangAssets.icons.paw} alt="" fill sizes="20px" unoptimized className="object-contain opacity-90" />
          </span>
          <h2 className={cn("text-[0.96rem] font-semibold", ui.textGlow)}>{dreamSeedCopy.questionTitle}</h2>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {dreamSeedIntents.map((intent) => {
            const isSelected = intent.id === activeIntentId;

            return (
              <SeedIntentButton
                key={intent.id}
                intent={intent}
                isSelected={isSelected}
                onClick={() => setSelectedIntentId(intent.id)}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.05rem] border border-[#7c4a38]/72 bg-[rgba(5,4,12,0.74)] p-2 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md">
        <label htmlFor="dream-seed-note" className="mb-1.5 flex items-center gap-2 text-[0.96rem] font-semibold text-[#ffd98a]">
          <span className="relative h-5 w-5">
            <Image src={manyangAssets.icons.paw} alt="" fill sizes="28px" unoptimized className="object-contain" />
          </span>
          {dreamSeedCopy.noteLabel} <span className="text-sm font-normal text-[#fff3d7]/58">{dreamSeedCopy.optionalLabel}</span>
        </label>
        <div className="relative">
          <textarea
            id="dream-seed-note"
            value={displayedNote}
            onChange={(event) => setNote(event.target.value)}
            maxLength={dreamSeedNoteMaxLength}
            rows={2}
            placeholder={dreamSeedCopy.notePlaceholder}
            className={cn(ui.field, "min-h-[3.85rem] resize-none rounded-[0.85rem] p-2.5 pr-10 text-[13px] leading-5")}
          />
          <span className="pointer-events-none absolute right-3 top-3 h-6 w-6">
            <Image src={manyangAssets.icons.feather} alt="" fill sizes="28px" unoptimized className="object-contain opacity-50" />
          </span>
          <span className="absolute bottom-2.5 right-3 text-[12px] text-[#fff3d7]/62">
            {displayedNote.length}/{dreamSeedNoteMaxLength}
          </span>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-4 text-[#fff3d7]/70">{dreamSeedCopy.noteHint}</p>

        <div className="mt-2">
          <p className="mb-1.5 flex items-center gap-2 text-[0.92rem] font-semibold text-[#ffd98a]">
            <span className="relative h-[18px] w-[18px]">
              <Image src={manyangAssets.icons.star} alt="" fill sizes="18px" unoptimized className="object-contain opacity-90" />
            </span>
            {dreamSeedCopy.atmosphereTitle}
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {dreamSeedAtmospheres.map((atmosphere) => (
              <AtmosphereButton
                key={atmosphere}
                label={atmosphere}
                isSelected={atmosphere === activeAtmosphere}
                onClick={() => setSelectedAtmosphere(atmosphere)}
              />
            ))}
          </div>
        </div>
      </section>

      {hasSavedSeedToday ? (
        <section className="rounded-[1.25rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_24px_rgba(164,82,255,0.24)]">
          <p className="flex items-center gap-2 font-semibold text-[#ffd98a]">
            <span className="relative h-6 w-6">
              <Image src={manyangAssets.icons.star} alt="" fill sizes="24px" unoptimized className="object-contain" />
            </span>
            {dreamSeedCopy.savedTitle}
          </p>
          <p className="mt-1 text-[#fff3d7]/78">
            {savedSeed.intentLabel} · {savedSeed.atmosphere ?? defaultDreamSeedAtmosphere}
          </p>
        </section>
      ) : null}

      <button
        type="submit"
        aria-label={hasSavedSeedToday ? dreamSeedCopy.submitAgain : dreamSeedCopy.submit}
        className="relative mx-auto -mt-1 block w-[66%] px-2 py-0 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b]"
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
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center pb-1 text-[1.52rem] font-semibold leading-none tracking-normal text-[#ffc978] [text-shadow:0_2px_2px_rgba(34,10,20,0.88),0_0_14px_rgba(255,198,104,0.26)]">
          {hasSavedSeedToday ? "씨앗 다시 심기" : "꿈 씨앗 심기"}
        </span>
      </button>

      {hasSavedSeedToday ? (
        <Link
          href="/"
          className="block text-center text-sm font-semibold text-[#f0bc7d] transition hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
        >
          오늘 화면으로 돌아가기
        </Link>
      ) : null}

      <p className="text-center text-[11.5px] text-[#fff3d7]/70">{dreamSeedCopy.footer}</p>
    </form>
  );
}
