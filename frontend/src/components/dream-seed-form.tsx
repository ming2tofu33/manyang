"use client";

import {
  Check,
  CloudMoon,
  Heart,
  MoonStar,
  PencilLine,
  Sparkles,
  Sprout,
  Users,
  WandSparkles,
} from "lucide-react";
import { FormEvent, useState, useSyncExternalStore } from "react";

import {
  createDreamSeedRecord,
  getDreamSeedSnapshotFromBrowser,
  saveDreamSeedToBrowser,
  subscribeToDreamSeed,
  type DreamSeedRecord,
} from "@/lib/dream-seed";
import { cn, ui } from "@/lib/styles";

const intents = [
  { id: "question", label: "지금 내 마음이 궁금해", icon: Heart },
  { id: "project", label: "프로젝트 힌트가 필요해", icon: WandSparkles },
  { id: "meet", label: "누군가를 다시 만나고 싶어", icon: Users },
  { id: "strange", label: "그냥 이상한 꿈을 보고 싶어", icon: CloudMoon },
  { id: "comfort", label: "아무것도 무섭지 않고 편안했으면", icon: MoonStar },
  { id: "custom", label: "직접 적을래", icon: PencilLine },
];

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DreamSeedForm() {
  const storedSeed = useSyncExternalStore(subscribeToDreamSeed, getDreamSeedSnapshotFromBrowser, () => null);
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [savedSeedOverride, setSavedSeedOverride] = useState<DreamSeedRecord | null>(null);
  const todayDate = getTodayDate();
  const savedSeed = savedSeedOverride ?? storedSeed;
  const hasSavedSeedToday = savedSeed?.seedDate === todayDate;
  const activeIntentId = selectedIntentId ?? (hasSavedSeedToday ? savedSeed.intentId : intents[0].id);
  const selectedIntent = intents.find((intent) => intent.id === activeIntentId) ?? intents[0];
  const displayedNote = note ?? (hasSavedSeedToday ? savedSeed.note : "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const record = createDreamSeedRecord({
      intentId: selectedIntent.id,
      intentLabel: selectedIntent.label,
      note: displayedNote,
      seedDate: todayDate,
    });

    saveDreamSeedToBrowser(record);
    setSavedSeedOverride(record);
    setSelectedIntentId(record.intentId);
    setNote(record.note);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-auto space-y-4 pb-5">
      <section className="relative min-h-[19rem] overflow-hidden rounded-[1.5rem] border border-[#b98255]/35 bg-[rgba(5,4,11,0.38)] shadow-[0_18px_60px_rgba(0,0,0,0.34)]">
        <div className="absolute inset-x-5 top-5 text-center">
          <p className="text-sm text-[#f0bc7d]">검은냥의 작은 주문</p>
          <p className="mt-2 text-[1.65rem] font-semibold leading-tight text-[#ffd98a]">
            오늘 밤 꿈에게
            <br />
            작은 질문을 맡겨보자냥.
          </p>
        </div>
        <div className="absolute bottom-5 left-5 max-w-[15rem] rounded-[1.4rem] border border-[#b98255]/45 bg-[#070612]/72 px-4 py-3 text-sm leading-6 text-[#fff3d7]/86 backdrop-blur-md">
          기억하지 못해도 괜찮아요. 마음이 가는 씨앗 하나만 남겨두면 돼요.
        </div>
      </section>

      <section className={cn(ui.panel, "space-y-4 p-4")}>
        <div className="flex items-center gap-2 text-[#ffd98a]">
          <Sprout size={20} aria-hidden="true" />
          <h2 className="text-lg font-semibold">오늘 밤 꿈에게 묻고 싶은 건?</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {intents.map((intent) => {
            const Icon = intent.icon;
            const isSelected = intent.id === activeIntentId;

            return (
              <button
                key={intent.id}
                type="button"
                onClick={() => setSelectedIntentId(intent.id)}
                className={cn(
                  "flex min-h-[4.6rem] items-center gap-2 rounded-[1.15rem] border px-3 py-3 text-left text-sm leading-5 transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                  isSelected
                    ? "border-[#e29cff] bg-[rgba(98,45,132,0.74)] text-[#ffe7b5] shadow-[0_0_24px_rgba(199,117,255,0.32)]"
                    : "border-[#b98255]/45 bg-[#06040c]/58 text-[#f2c27d] hover:border-[#ffd08a]/70",
                )}
                aria-pressed={isSelected}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{intent.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn(ui.panel, "space-y-3 p-4")}>
        <label htmlFor="dream-seed-note" className="flex items-center gap-2 text-lg font-semibold text-[#ffd98a]">
          <PencilLine size={20} aria-hidden="true" />
          꿈에게 남길 말 <span className="text-sm font-normal text-[#fff3d7]/58">(선택)</span>
        </label>
        <div className="relative">
          <textarea
            id="dream-seed-note"
            value={displayedNote}
            onChange={(event) => setNote(event.target.value)}
            maxLength={100}
            rows={4}
            placeholder="예: 요즘 내가 놓치고 있는 걸 보여줘..."
            className={cn(ui.field, "min-h-[8.5rem] resize-none rounded-[1.25rem] p-4 pr-12 text-base leading-7")}
          />
          <PencilLine
            className="pointer-events-none absolute right-4 top-4 h-6 w-6 text-[#8f745f]"
            aria-hidden="true"
          />
          <span className="absolute bottom-3 right-4 text-sm text-[#fff3d7]/62">{displayedNote.length}/100</span>
        </div>
        <p className="text-sm leading-6 text-[#fff3d7]/72">
          너무 거창하지 않아도 괜찮아요. 마음이 가는 대로 남겨보세요.
        </p>
      </section>

      {hasSavedSeedToday ? (
        <section className="rounded-[1.25rem] border border-[#d799ff]/35 bg-[rgba(25,11,39,0.78)] px-4 py-3 text-sm leading-6 text-[#fff3d7] shadow-[0_0_24px_rgba(164,82,255,0.24)]">
          <p className="flex items-center gap-2 font-semibold text-[#ffd98a]">
            <Check size={18} aria-hidden="true" />
            오늘 밤 씨앗을 심어두었어요.
          </p>
          <p className="mt-1 text-[#fff3d7]/78">{savedSeed.intentLabel}</p>
        </section>
      ) : null}

      <button type="submit" className={cn(ui.primaryAction, "gap-3")}>
        <Sparkles size={23} aria-hidden="true" />
        {hasSavedSeedToday ? "씨앗을 다시 심기" : "오늘 밤 씨앗 심기"}
      </button>

      <p className="text-center text-sm text-[#fff3d7]/70">내일 아침, 꿈을 기억했을 때 연결할 수 있어요.</p>
    </form>
  );
}
