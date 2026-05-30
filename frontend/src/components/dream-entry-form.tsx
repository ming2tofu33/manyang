"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";
import type { DreamAnalysisResponse } from "@manyang/backend";

import { CatReaderPicker } from "./cat-reader-picker";
import { DreamLoadingOverlay } from "./dream-loading-overlay";
import {
  getCatReaderDreamReadingState,
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  subscribeToSelectedCatReader,
  type CatReaderId,
} from "@/lib/cat-readers";
import {
  createDreamMoodLabel,
  dreamAtmosphereOptions,
  dreamEntryMaxLength,
  dreamSensationMaxSelection,
  dreamSensationOptions,
  type DreamEntryOption,
} from "@/lib/dream-entry-options";
import { saveDreamRecordToBrowser, saveLatestAnalysisToBrowser } from "@/lib/dream-storage";
import { DREAM_LOADING_MINIMUM_MS } from "@/lib/dream-loading-sequence";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

type OptionButtonProps = {
  option: DreamEntryOption;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  iconSize?: "default" | "large";
};

function OptionButton({ option, isSelected, onClick, disabled = false, iconSize = "default" }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      disabled={disabled}
      className={cn(
        "group flex min-h-[2.45rem] items-center justify-center gap-1 rounded-[0.85rem] border border-[#71433f]/75 bg-[rgba(12,8,24,0.72)] px-2 text-[0.82rem] font-semibold text-[#f0c7b9] shadow-[inset_0_0_14px_rgba(255,201,124,0.03)] transition hover:border-[#d799ff]/70 hover:text-[#ffe3b3] focus:outline-none focus:ring-2 focus:ring-[#d799ff] disabled:cursor-not-allowed disabled:opacity-40",
        isSelected
          ? "border-[#f2a6ff] bg-[linear-gradient(135deg,rgba(100,45,134,0.88),rgba(31,16,49,0.92))] text-[#ffe7b5] shadow-[0_0_22px_rgba(199,117,255,0.34),inset_0_0_18px_rgba(255,216,138,0.08)]"
          : "",
      )}
    >
      <span
        className={cn(
          "relative shrink-0 opacity-86 transition group-hover:brightness-125",
          iconSize === "large" ? "h-[1.25rem] w-[1.25rem]" : "h-[0.95rem] w-[0.95rem]",
        )}
      >
        <Image
          src={manyangAssets.semanticIcons[option.icon]}
          alt=""
          fill
          sizes={iconSize === "large" ? "28px" : "22px"}
          unoptimized
          className="object-contain"
        />
      </span>
      <span className="min-w-0 whitespace-nowrap">{option.label}</span>
    </button>
  );
}

export function DreamEntryForm() {
  const router = useRouter();
  const storedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const [dreamText, setDreamText] = useState("");
  const [dreamAtmosphere, setDreamAtmosphere] = useState<string | null>(null);
  const [dreamSensations, setDreamSensations] = useState<string[]>([]);
  const [draftCatReaderId, setDraftCatReaderId] = useState<CatReaderId | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedCatReaderId = draftCatReaderId ?? storedCatReaderId;
  const selectedCatReader = getCatReaderById(selectedCatReaderId);
  const readingState = getCatReaderDreamReadingState(selectedCatReaderId);

  function toggleDreamSensation(label: string): void {
    setDreamSensations((currentSensations) => {
      if (currentSensations.includes(label)) {
        return currentSensations.filter((sensation) => sensation !== label);
      }

      if (currentSensations.length >= dreamSensationMaxSelection) {
        return currentSensations;
      }

      return [...currentSensations, label];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDreamText = dreamText.trim();

    if (!trimmedDreamText) {
      setError("꿈 내용을 한 문장이라도 적어주세요.");
      return;
    }

    if (!readingState.isAvailable) {
      setError(`${readingState.blockedLabel ?? "선택한 고양이"} 아직은 무료 해몽을 받을 수 없어요.`);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const dreamDate = getTodayDate();
      const wakeMood = createDreamMoodLabel(dreamAtmosphere, dreamSensations);

      const minDelay = new Promise((resolve) => setTimeout(resolve, DREAM_LOADING_MINIMUM_MS));

      const fetchPromise = fetch("/api/dreams/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dreamText: trimmedDreamText,
          dreamDate,
          ...(wakeMood ? { wakeMood } : {}),
          catReaderType: selectedCatReaderId,
        }),
      });

      const [response] = await Promise.all([fetchPromise, minDelay]);

      if (!response.ok) {
        throw new Error("analysis failed");
      }

      const analysis = (await response.json()) as DreamAnalysisResponse;
      const payload = {
        dreamText: trimmedDreamText,
        dreamDate,
        catReaderType: selectedCatReaderId,
        ...(wakeMood ? { wakeMood } : {}),
        analysis,
      };

      saveLatestAnalysisToBrowser(payload);
      saveDreamRecordToBrowser({
        ...payload,
        id: analysis.dreamId,
        savedAt: new Date().toISOString(),
      });

      router.push("/result");
    } catch {
      setError("지금은 꿈을 읽지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DreamLoadingOverlay
        key={isSubmitting ? `reading-${selectedCatReaderId}` : "idle-reading"}
        isActive={isSubmitting}
        background={manyangAssets.backgrounds[selectedCatReader.interpretationBackgroundKey]}
        catImage={manyangAssets.illustrations[selectedCatReader.assetKey]}
      />
      <form onSubmit={handleSubmit} className="mt-1 space-y-4 pb-4">
        <section className="flex items-center gap-3">
          <div className="relative h-[4.25rem] w-[4.25rem] shrink-0">
            <Image
              src={manyangAssets.illustrations[selectedCatReader.assetKey]}
              alt={`${selectedCatReader.name} 프로필`}
              fill
              priority
              sizes="68px"
              unoptimized
              className="rounded-full object-cover drop-shadow-[0_0_22px_rgba(185,97,255,0.35)]"
            />
          </div>
          <div className="dream-entry-speech relative flex min-h-[4.25rem] flex-1 items-center rounded-[1.15rem] border border-[#b25fbd]/58 bg-[linear-gradient(135deg,rgba(27,18,43,0.92),rgba(12,8,25,0.9))] px-4 py-3 shadow-[0_0_26px_rgba(90,42,120,0.24)]">
            <p className="whitespace-pre-line pr-7 text-[0.98rem] font-semibold leading-6 text-[#fff0dc]">
              짧아도 괜찮고,{"\n"}뒤죽박죽이어도 괜찮다냥.
            </p>
            <span className="absolute bottom-3 right-4 h-5 w-5">
              <Image src={manyangAssets.semanticIcons.paw} alt="" fill sizes="20px" unoptimized className="object-contain opacity-78" />
            </span>
          </div>
        </section>

        <CatReaderPicker
          value={selectedCatReaderId}
          onChange={setDraftCatReaderId}
          variant="compact"
        />

        {!readingState.isAvailable ? (
          <div className="rounded-[1rem] border border-[#d799ff]/28 bg-[rgba(24,12,38,0.72)] px-3 py-2 text-[12px] leading-5 text-[#fff3d7]/82">
            <p className="font-semibold text-[#e7b3ff]">{readingState.blockedLabel}</p>
            <button
              type="button"
              onClick={() => {
                if (readingState.fallbackReaderId) {
                  setDraftCatReaderId(readingState.fallbackReaderId);
                  setError("");
                }
              }}
              className="mt-2 rounded-full border border-[#b98255]/48 px-3 py-1.5 text-[12px] font-semibold text-[#f4b65f] transition hover:border-[#d799ff]/60 hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
            >
              검은냥으로 바꾸기
            </button>
          </div>
        ) : null}

        <section className="relative min-h-[10.6rem] overflow-hidden rounded-[1.35rem] border border-[#bd7429]/78 bg-[radial-gradient(circle_at_82%_90%,rgba(99,51,132,0.24),transparent_34%),linear-gradient(180deg,rgba(17,11,33,0.86),rgba(8,5,17,0.92))] p-4 shadow-[0_0_30px_rgba(4,3,10,0.42),inset_0_0_24px_rgba(255,189,92,0.04)]">
          <span className="pointer-events-none absolute right-2 top-1 text-lg text-[#ffd98a]/70">✧</span>
          <span className="pointer-events-none absolute bottom-2 left-2 text-lg text-[#ffd98a]/70">✧</span>
          <span className="pointer-events-none absolute bottom-2 right-2 text-lg text-[#ffd98a]/70">✧</span>
          <label htmlFor="dream" className="sr-only">
            어젯밤 꿈 내용
          </label>
          <textarea
            id="dream"
            maxLength={dreamEntryMaxLength}
            rows={10}
            value={dreamText}
            onChange={(event) => setDreamText(event.target.value)}
            placeholder="어젯밤 꿈을 자유롭게 적어주세요..."
            className={cn(
              ui.field,
              "h-[8.05rem] resize-none border-0 bg-transparent p-0 pl-3 pr-2 pb-9 text-[0.98rem] leading-7 text-[#fff0dc] placeholder:text-[#9d7f9b] focus:border-transparent",
            )}
          />
          <span className="pointer-events-none absolute bottom-8 right-12 h-9 w-9 rotate-[12deg]">
            <Image src={manyangAssets.semanticIcons.feather} alt="" fill sizes="48px" unoptimized className="object-contain opacity-70" />
          </span>
          <span className="absolute bottom-6 right-5 text-[0.85rem] font-semibold text-[#c6a3a4]">
            {dreamText.length} / {dreamEntryMaxLength}
          </span>
        </section>

        <section className="space-y-2.5">
          <h2 className={cn("text-[1.08rem] font-semibold text-[#ffd98a]", ui.textGlow)}>
            꿈의 분위기는 어땠나요?
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {dreamAtmosphereOptions.map((option) => (
              <OptionButton
                key={option.id}
                option={option}
                isSelected={dreamAtmosphere === option.label}
                iconSize="large"
                onClick={() =>
                  setDreamAtmosphere((currentAtmosphere) =>
                    currentAtmosphere === option.label ? null : option.label,
                  )
                }
              />
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="space-y-1">
            <h2 className={cn("text-[1.08rem] font-semibold text-[#ffd98a]", ui.textGlow)}>
              꿈에서 어떤 감각이 남았나요?
            </h2>
            <p className="text-[0.78rem] font-medium text-[#d9b5a4]/78">
              선택하지 않아도 괜찮고, 최대 {dreamSensationMaxSelection}개까지 고를 수 있어요.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {dreamSensationOptions.map((option) => {
              const isSelected = dreamSensations.includes(option.label);

              return (
                <OptionButton
                  key={option.id}
                  option={option}
                  isSelected={isSelected}
                  iconSize="large"
                  disabled={!isSelected && dreamSensations.length >= dreamSensationMaxSelection}
                  onClick={() => toggleDreamSensation(option.label)}
                />
              );
            })}
          </div>
        </section>

        {error ? <p className="px-2 text-sm text-[#ffd98a]">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || !readingState.isAvailable}
          aria-label={
            !readingState.isAvailable
              ? (readingState.blockedLabel ?? "Moon Pass에서 열려요")
              : isSubmitting
                ? "고양이가 꿈을 읽는 중"
                : "해몽 받기"
          }
          className="relative mx-auto -my-2 mt-0 block w-full px-3 py-2 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Image
            src={manyangAssets.buttons.dreammemorySubmit}
            alt={
              !readingState.isAvailable
                ? (readingState.blockedLabel ?? "Moon Pass에서 열려요")
                : isSubmitting
                  ? "고양이가 꿈을 읽는 중"
                  : "해몽 받기"
            }
            width={857}
            height={262}
            sizes="382px"
            unoptimized
            className={cn("manyang-button-glow h-auto w-full", !readingState.isAvailable ? "grayscale-[0.28]" : "")}
          />
          <span
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center pb-1 font-semibold tracking-normal text-[#ffc978] [text-shadow:0_2px_2px_rgba(34,10,20,0.88),0_0_14px_rgba(255,198,104,0.26)]",
              !readingState.isAvailable ? "px-9 text-[1.05rem] leading-tight" : "text-[2rem] leading-none",
            )}
          >
            {!readingState.isAvailable ? readingState.blockedLabel : isSubmitting ? "꿈 읽는 중" : "해몽 받기"}
          </span>
        </button>
      </form>
    </>
  );
}
