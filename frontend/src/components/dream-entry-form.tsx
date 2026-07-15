"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";
import type { DreamReadingUnavailableReason } from "@manyang/backend";
import type { DreamAnalysisResponse, DreamNightContext } from "@manyang/contracts/dream";

import { CatReaderPicker } from "./cat-reader-picker";
import { DreamLoadingOverlay } from "./dream-loading-overlay";
import {
  canRequestReading,
  getReadingKindForCatReader,
  hasUsedBasicReadingOnDate,
} from "@/lib/access-policy";
import { getManyangAppDate } from "@/lib/app-date";
import { useLocale } from "@/lib/use-locale";
import {
  getCatReaderDreamReadingState,
  getCatReaderById,
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  resolveCatReaderForDreamReading,
  subscribeToSelectedCatReader,
  type CatReaderId,
} from "@/lib/cat-readers";
import {
  createDreamMoodLabel,
  dreamAtmosphereMaxSelection,
  dreamAtmosphereOptions,
  dreamEntryMaxLength,
  dreamSensationMaxSelection,
  dreamSensationOptions,
  dreamSensationOtherMaxLength,
  type DreamEntryOption,
} from "@/lib/dream-entry-options";
import {
  clearDreamDraftFromBrowser,
  getDreamDraftFromBrowser,
  getLatestAnalysisSnapshotFromBrowser,
  saveDreamDraftToBrowser,
  saveDreamRecordToBrowser,
  saveLatestAnalysisToBrowser,
  subscribeToDreamStorage,
  type DreamUnavailablePayload,
} from "@/lib/dream-storage";
import { guestLocalDreamArchiveLimit, shouldSaveReadingToLocalArchive } from "@/lib/dream-result-persistence";
import { DREAM_LOADING_MINIMUM_MS } from "@/lib/dream-loading-sequence";
import { manyangAssets } from "@/lib/manyang-assets";
import {
  getNightCheckInSnapshotFromBrowser,
  isNightCheckInRelatedToDreamDate,
  type NightCheckInRecord,
} from "@/lib/night-checkin";
import { cn, ui } from "@/lib/styles";
import { useAccessPlan } from "@/lib/use-access-plan";

type OptionButtonProps = {
  option: DreamEntryOption;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  iconSize?: "default" | "large";
};

type DreamUnavailableApiResponse = {
  status: "unavailable";
  error: string;
  reason: DreamReadingUnavailableReason;
  retryable: boolean;
  safetyNotice?: string;
};

type DreamLockedApiResponse = {
  error: "dream reading is locked";
  reason: string;
  ctaLabel: string | null;
  message: string | null;
};

function isDreamUnavailableApiResponse(value: unknown): value is DreamUnavailableApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as DreamUnavailableApiResponse).status === "unavailable" &&
    typeof (value as DreamUnavailableApiResponse).reason === "string" &&
    typeof (value as DreamUnavailableApiResponse).retryable === "boolean"
  );
}

function isDreamLockedApiResponse(value: unknown): value is DreamLockedApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    body.error === "dream reading is locked" &&
    typeof body.reason === "string" &&
    (typeof body.ctaLabel === "string" || body.ctaLabel === null) &&
    (typeof body.message === "string" || body.message === null)
  );
}

export function getDreamAnalyzeFailureMessage(status: number, body: unknown): string | null {
  if (status === 403 && isDreamLockedApiResponse(body)) {
    return body.message ?? "지금은 이 꿈 해몽을 열 수 없어요.";
  }

  return null;
}

function createDreamNightContext(record: NightCheckInRecord | null, dreamDate: string): DreamNightContext | undefined {
  if (!record || !isNightCheckInRelatedToDreamDate(record, dreamDate)) {
    return undefined;
  }

  return {
    checkInDate: record.checkInDate,
    moodLabel: record.moodLabel,
    conditionLabel: record.conditionLabel,
    ...(record.note ? { note: record.note } : {}),
  };
}

function OptionButton({ option, isSelected, onClick, disabled = false, iconSize = "default" }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      disabled={disabled}
      className={cn(
        "group flex min-h-[2.45rem] items-center justify-center gap-1 rounded-[0.85rem] border border-[#71433f]/75 bg-[rgba(12,8,24,0.72)] px-2 text-[0.82rem] font-semibold text-[#f0c7b9] shadow-[inset_0_0_14px_rgba(255,201,124,0.03)] transition hover:border-[#d799ff]/70 hover:text-[#ffe3b3] disabled:cursor-not-allowed disabled:opacity-40",
        ui.insetFocus,
        isSelected ? ui.selectedControl : "",
      )}
    >
      <span
        className={cn(
          "relative shrink-0 opacity-86 transition group-hover:brightness-125",
          iconSize === "large" ? "h-[1.5rem] w-[1.5rem]" : "h-[1.15rem] w-[1.15rem]",
        )}
      >
        <Image
          src={manyangAssets.keywordIcons[option.icon]}
          alt=""
          fill
          sizes={iconSize === "large" ? "32px" : "26px"}
          unoptimized
          className="object-contain"
        />
      </span>
      <span className="min-w-0 whitespace-nowrap">{option.label}</span>
    </button>
  );
}

type DreamSubmitButtonProps = {
  isSubmitting: boolean;
  isReadingAvailable: boolean;
  canSubmit?: boolean;
  submitButtonLabel: string;
  unavailableLabel: string;
};

export function DreamSubmitButton({
  isSubmitting,
  isReadingAvailable,
  canSubmit = isReadingAvailable,
  submitButtonLabel,
  unavailableLabel,
}: DreamSubmitButtonProps) {
  const isPrimaryVisual = canSubmit;
  const content = (
    <>
      <Image
        src={manyangAssets.buttons.dreammemorySubmit}
        alt={
          !canSubmit
            ? unavailableLabel
            : isSubmitting
              ? "고양이가 꿈을 읽는 중"
              : "해몽 받기"
        }
        width={857}
        height={200}
        sizes="382px"
        unoptimized
        className={cn("manyang-button-glow h-auto w-full", !isPrimaryVisual ? "grayscale-[0.28]" : "")}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center pb-1 font-semibold tracking-normal text-[#ffc978] [text-shadow:0_2px_2px_rgba(34,10,20,0.88),0_0_14px_rgba(255,198,104,0.26)]",
          !isPrimaryVisual ? "px-9 text-[1.05rem] leading-tight" : "text-[1.72rem] leading-none",
        )}
      >
        {submitButtonLabel}
      </span>
    </>
  );
  const className =
    "relative mx-auto -my-2 mt-0 block w-[92%] max-w-[21rem] px-2 py-0 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b] disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <button
      type="submit"
      disabled={isSubmitting || !canSubmit}
      title={submitButtonLabel}
      aria-label={
        !canSubmit
          ? unavailableLabel
          : isSubmitting
            ? "고양이가 꿈을 읽는 중"
            : "해몽 받기"
      }
      className={className}
    >
      {content}
    </button>
  );
}

export function DreamEntryForm() {
  const router = useRouter();
  const [initialDraft] = useState(() => getDreamDraftFromBrowser());
  const storedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const latestAnalysis = useSyncExternalStore(
    subscribeToDreamStorage,
    getLatestAnalysisSnapshotFromBrowser,
    () => null,
  );
  const todayDate = getManyangAppDate();
  const { accessPlan, role, bypassDailyLimit, bypassAccessGate } = useAccessPlan();
  const { locale, t } = useLocale();
  const [dreamText, setDreamText] = useState(initialDraft?.dreamText ?? "");
  const [dreamAtmospheres, setDreamAtmospheres] = useState<string[]>([]);
  const [dreamSensations, setDreamSensations] = useState<string[]>([]);
  const [otherSensation, setOtherSensation] = useState("");
  const [draftCatReaderId, setDraftCatReaderId] = useState<CatReaderId | null>(initialDraft?.catReaderType ?? null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedCatReaderId = draftCatReaderId ?? storedCatReaderId;
  const selectedCatReader = getCatReaderById(selectedCatReaderId);
  const readingState = getCatReaderDreamReadingState(selectedCatReaderId, accessPlan);
  const readingResolution = resolveCatReaderForDreamReading(selectedCatReaderId, accessPlan);
  const requestCatReaderId = selectedCatReaderId;
  const isFallbackReading = readingResolution.isFallback;
  const readingKind = getReadingKindForCatReader(requestCatReaderId);
  const readingGate = canRequestReading({
    accessPlan,
    readingKind,
    hasUsedBasicReadingToday: hasUsedBasicReadingOnDate(latestAnalysis, todayDate),
    bypassDailyLimit,
    bypassAccessGate,
  });
  const isDailyLimitGate = readingGate.reason === "guest_daily_limit" || readingGate.reason === "free_daily_limit";
  const isReadingAvailable = readingGate.allowed && (!isFallbackReading || Boolean(readingState.fallbackReaderId));
  const canSubmitReading = isReadingAvailable || isDailyLimitGate;
  const unavailableLabel = readingGate.ctaLabel ?? readingState.blockedLabel ?? "지금은 해몽을 받을 수 없어요";
  const blockedNoticeTitle = isDailyLimitGate ? "오늘의 꿈 영수증은 이미 받았어요" : unavailableLabel;
  const accessNoticeTitle = isFallbackReading
    ? (readingResolution.blockedLabel ?? unavailableLabel)
    : blockedNoticeTitle;
  const accessNoticeMessage = isFallbackReading
    ? `선택한 ${selectedCatReader.name} 테마로 기본 꿈 영수증을 만들 수 있어요.`
    : readingGate.message;
  const submitButtonLabel = isSubmitting
      ? t("dreamEntry.submitting")
      : isFallbackReading
        ? `${selectedCatReader.name} 테마로 해몽 받기`
        : t("dreamEntry.submit");

  function toggleDreamAtmosphere(label: string): void {
    setDreamAtmospheres((currentAtmospheres) => {
      if (currentAtmospheres.includes(label)) {
        return currentAtmospheres.filter((atmosphere) => atmosphere !== label);
      }

      if (currentAtmospheres.length >= dreamAtmosphereMaxSelection) {
        return currentAtmospheres;
      }

      return [...currentAtmospheres, label];
    });
  }

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
      setError(t("dreamEntry.emptyError"));
      return;
    }

    if (!readingGate.allowed) {
      setError(readingGate.message ?? unavailableLabel);
      return;
    }

    if (!readingState.isAvailable && !isFallbackReading) {
      setError(unavailableLabel);
      return;
    }

    setError("");
    setIsSubmitting(true);
    if (isFallbackReading) {
      setDraftCatReaderId(requestCatReaderId);
    }

    try {
      const dreamDate = todayDate;
      const trimmedOtherSensation = otherSensation.trim();
      const sensations = trimmedOtherSensation
        ? [...dreamSensations, trimmedOtherSensation]
        : dreamSensations;
      const wakeMood = createDreamMoodLabel(dreamAtmospheres, sensations);
      const atmosphereIds = dreamAtmosphereOptions
        .filter((option) => dreamAtmospheres.includes(option.label))
        .map((option) => option.id);
      const sensationIds = dreamSensationOptions
        .filter((option) => dreamSensations.includes(option.label))
        .map((option) => option.id);
      const nightContext = createDreamNightContext(getNightCheckInSnapshotFromBrowser(), dreamDate);
      // 요청·저장에 공통으로 쓰는 구조화 감정/감각 신호(재분석 대비).
      const selectedSignals = {
        ...(atmosphereIds.length > 0 ? { dreamAtmospheres: atmosphereIds } : {}),
        ...(sensationIds.length > 0 ? { dreamSensations: sensationIds } : {}),
        ...(trimmedOtherSensation ? { dreamSensationOther: trimmedOtherSensation } : {}),
        ...(nightContext ? { nightContext } : {}),
      };

      const minDelay = new Promise((resolve) => setTimeout(resolve, DREAM_LOADING_MINIMUM_MS));

      const fetchPromise = fetch("/api/dreams/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dreamText: trimmedDreamText,
          dreamDate,
          locale,
          ...(wakeMood ? { wakeMood } : {}),
          ...selectedSignals,
          catReaderType: requestCatReaderId,
        }),
      });

      const [response] = await Promise.all([fetchPromise, minDelay]);
      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        if (response.status === 503 && isDreamUnavailableApiResponse(responseBody)) {
          const unavailablePayload: DreamUnavailablePayload = {
            status: "unavailable",
            dreamText: trimmedDreamText,
            dreamDate,
            catReaderType: requestCatReaderId,
            ...(wakeMood ? { wakeMood } : {}),
            ...selectedSignals,
            reason: responseBody.reason,
            retryable: responseBody.retryable,
            ...(responseBody.safetyNotice ? { safetyNotice: responseBody.safetyNotice } : {}),
            failedAt: new Date().toISOString(),
          };

          saveLatestAnalysisToBrowser(unavailablePayload);
          saveDreamDraftToBrowser({
            dreamText: trimmedDreamText,
            catReaderType: requestCatReaderId,
            ...(wakeMood ? { wakeMood } : {}),
          });
          router.push("/result");
          return;
        }

        const failureMessage = getDreamAnalyzeFailureMessage(response.status, responseBody);

        if (failureMessage) {
          setError(failureMessage);
          saveDreamDraftToBrowser({
            dreamText: trimmedDreamText,
            catReaderType: requestCatReaderId,
            ...(wakeMood ? { wakeMood } : {}),
          });
          return;
        }

        throw new Error("analysis failed");
      }

      const analysis = responseBody as DreamAnalysisResponse;
      const savedAt = new Date().toISOString();
      const payload = {
        dreamText: trimmedDreamText,
        dreamDate,
        catReaderType: requestCatReaderId,
        ...(wakeMood ? { wakeMood } : {}),
        ...selectedSignals,
        analysis,
      };

      saveLatestAnalysisToBrowser(payload);

      if (shouldSaveReadingToLocalArchive({ isAuthenticated: accessPlan !== "guest", status: "completed" })) {
        saveDreamRecordToBrowser(
          {
            ...payload,
            id: `local-dream-${savedAt}`,
            savedAt,
          },
          { maxRecords: guestLocalDreamArchiveLimit },
        );
      }

      clearDreamDraftFromBrowser();

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
        readerImage={manyangAssets.loadingReaders[selectedCatReader.assetKey]}
        introImage={manyangAssets.backgrounds[selectedCatReader.interpretationBackgroundKey]}
        orbImage={manyangAssets.orbs.catWithStand[selectedCatReader.assetKey]}
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
          accessRole={role}
        />

        {isFallbackReading || !isReadingAvailable ? (
          <div className="rounded-[1rem] border border-[#d799ff]/28 bg-[rgba(24,12,38,0.72)] px-3 py-2 text-[12px] leading-5 text-[#fff3d7]/82">
            <p className="font-semibold text-[#e7b3ff]">{accessNoticeTitle}</p>
            {accessNoticeMessage ? <p className="mt-1 text-[#fff3d7]/72">{accessNoticeMessage}</p> : null}
            {readingState.fallbackReaderId ? (
              <button
                type="button"
                onClick={() => {
                  setDraftCatReaderId(readingState.fallbackReaderId);
                  setError("");
                }}
                className={cn(
                  "mt-2 rounded-full border border-[#b98255]/48 px-3 py-1.5 text-[12px] font-semibold text-[#f4b65f] transition hover:border-[#d799ff]/60 hover:text-[#ffd98a]",
                  ui.insetFocus,
                )}
              >
                검은냥으로 바꾸기
              </button>
            ) : null}
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
          <span className="pointer-events-none absolute bottom-5 right-[4.9rem] h-7 w-7 rotate-[12deg]">
            <Image src={manyangAssets.sectionIcons.dreamInput} alt="" fill sizes="48px" unoptimized className="object-contain opacity-70" />
          </span>
          <span className="absolute bottom-6 right-5 text-[0.85rem] font-semibold text-[#c6a3a4]">
            {dreamText.length} / {dreamEntryMaxLength}
          </span>
        </section>

        <section className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative h-6 w-6 shrink-0">
                <Image src={manyangAssets.sectionIcons.dreamAtmosphere} alt="" fill sizes="24px" unoptimized className="object-contain" />
              </span>
              <h2 className={cn("text-[1.08rem] font-semibold text-[#ffd98a]", ui.textGlow)}>
                꿈의 분위기는 어땠나요?
              </h2>
            </div>
            <p className="text-[0.78rem] font-medium text-[#d9b5a4]/78">
              선택하지 않아도 괜찮고, 최대 {dreamAtmosphereMaxSelection}개까지 고를 수 있어요.
            </p>
          </div>
          <div data-dream-atmosphere-grid="true" className="grid grid-cols-3 gap-2">
            {dreamAtmosphereOptions.map((option) => {
              const isSelected = dreamAtmospheres.includes(option.label);

              return (
                <OptionButton
                  key={option.id}
                  option={option}
                  isSelected={isSelected}
                  iconSize="large"
                  disabled={!isSelected && dreamAtmospheres.length >= dreamAtmosphereMaxSelection}
                  onClick={() => toggleDreamAtmosphere(option.label)}
                />
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative h-6 w-6 shrink-0">
                <Image src={manyangAssets.sectionIcons.dreamSensation} alt="" fill sizes="24px" unoptimized className="object-contain" />
              </span>
              <h2 className={cn("text-[1.08rem] font-semibold text-[#ffd98a]", ui.textGlow)}>
                꿈에서 어떤 감각이 남았나요?
              </h2>
            </div>
            <p className="text-[0.78rem] font-medium text-[#d9b5a4]/78">
              선택하지 않아도 괜찮고, 최대 {dreamSensationMaxSelection}개까지 고를 수 있어요.
            </p>
          </div>
          <div data-dream-sensation-grid="true" className="grid grid-cols-3 gap-2">
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
          <label htmlFor="dream-sensation-other" className="sr-only">
            그 외 감각 직접 입력
          </label>
          <input
            id="dream-sensation-other"
            type="text"
            value={otherSensation}
            maxLength={dreamSensationOtherMaxLength}
            onChange={(event) => setOtherSensation(event.target.value)}
            placeholder="그 외 감각이 있다면 직접 적어주세요"
            className="min-h-[2.45rem] w-full rounded-[0.85rem] border border-[#71433f]/75 bg-[rgba(12,8,24,0.72)] px-3 text-[0.82rem] font-semibold text-[#f0c7b9] placeholder:text-[#9d7f9b] focus:border-[#d799ff]/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d799ff]/72"
          />
        </section>

        {error ? <p className="px-2 text-sm text-[#ffd98a]">{error}</p> : null}

        <DreamSubmitButton
          isSubmitting={isSubmitting}
          isReadingAvailable={isReadingAvailable}
          canSubmit={canSubmitReading}
          submitButtonLabel={submitButtonLabel}
          unavailableLabel={unavailableLabel}
        />

      </form>
    </>
  );
}
