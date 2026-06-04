"use client";

import Link from "next/link";
import { Gauge, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DailyTarotPendingResult,
  DailyTarotRevealPanel,
  tarotCardRevealMs,
} from "@/components/daily-tarot-client";
import { DreamLoadingOverlay } from "@/components/dream-loading-overlay";
import {
  DREAM_LOADING_INTERPRETATION_SCENE_MS,
  DREAM_LOADING_MINIMUM_MS,
  DREAM_LOADING_READER_SCENE_MS,
  getDreamLoadingSequence,
} from "@/lib/dream-loading-sequence";
import { catReaders, getCatReaderById, type CatReaderId } from "@/lib/cat-readers";
import {
  createDailyTarotOptions,
  type DailyTarotCardSelection,
  type DailyTarotOption,
  type DailyTarotPosition,
} from "@/lib/daily-tarot";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";
import { getTarotMajorCardById } from "@/lib/tarot-major-cards";
import { useAccessPlan } from "@/lib/use-access-plan";

type LoadingLabMode = "dream" | "tarot";
type PlaybackSpeed = 1 | 2 | 4;
type TarotCardCount = 1 | 3;

type AdminLoadingLabProps = {
  initialDreamElapsedMs?: number;
  initialControlPanelExpanded?: boolean;
  initialMode?: LoadingLabMode;
  initialTarotElapsedMs?: number;
};

const dreamTimelineMaxMs = 55_000;
const tarotPreviewAppDate = "2026-06-01";
const tarotPreviewIdentity = "admin-loading-lab";
const tarotDefaultApiWaitMs = 8_000;
const tarotApiWaitOptions = [3_000, 8_000, 17_000, 30_000] as const;

const dreamJumpPoints = [
  { label: "0s", elapsedMs: 0 },
  { label: "3s", elapsedMs: DREAM_LOADING_READER_SCENE_MS },
  { label: "10s", elapsedMs: DREAM_LOADING_READER_SCENE_MS + DREAM_LOADING_INTERPRETATION_SCENE_MS },
  { label: "20s", elapsedMs: DREAM_LOADING_MINIMUM_MS },
  { label: "25s", elapsedMs: 25_000 },
  { label: "55s", elapsedMs: 55_000 },
] as const;

const playbackSpeeds: PlaybackSpeed[] = [1, 2, 4];

const positionOrder: DailyTarotPosition[] = ["situation", "flow", "advice"];

function formatSeconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSelectedTarotOptions(cardCount: TarotCardCount): DailyTarotOption[] {
  return createDailyTarotOptions(tarotPreviewAppDate, {
    count: 7,
    drawIdentityKey: tarotPreviewIdentity,
  }).slice(0, cardCount);
}

function createTarotSelections(cardCount: TarotCardCount): DailyTarotCardSelection[] {
  return getSelectedTarotOptions(cardCount)
    .map((option, index): DailyTarotCardSelection | null => {
      const card = getTarotMajorCardById(option.cardId);

      if (!card) {
        return null;
      }

      return {
        card,
        orientation: option.orientation,
        position: cardCount === 1 ? "today" : positionOrder[index] ?? "advice",
      };
    })
    .filter((selection): selection is DailyTarotCardSelection => Boolean(selection));
}

function createTarotRevealState(cardCount: TarotCardCount) {
  const options = createDailyTarotOptions(tarotPreviewAppDate, {
    count: 7,
    drawIdentityKey: tarotPreviewIdentity,
  });
  const selectedOptionIndex = cardCount === 1 ? 2 : 1;
  const selectedOption = options[selectedOptionIndex] ?? options[0];
  const card = selectedOption ? getTarotMajorCardById(selectedOption.cardId) : null;

  if (!selectedOption || !card) {
    return null;
  }

  return {
    options,
    selectedOptionId: selectedOption.id,
    selectedOptionIndex,
    selection: {
      card,
      orientation: selectedOption.orientation,
      position: cardCount === 1 ? "today" : "situation",
    } satisfies DailyTarotCardSelection,
  };
}

function getTarotTimelineState(elapsedMs: number, apiWaitMs: number) {
  const safeElapsedMs = Math.max(0, elapsedMs);
  const completeMs = Math.max(tarotCardRevealMs, apiWaitMs);

  if (safeElapsedMs < tarotCardRevealMs) {
    return {
      completeMs,
      stage: "reveal" as const,
      stageElapsedMs: safeElapsedMs,
      stageLabel: "카드 공개",
    };
  }

  if (safeElapsedMs < completeMs) {
    return {
      completeMs,
      stage: "generating" as const,
      stageElapsedMs: safeElapsedMs - tarotCardRevealMs,
      stageLabel: "해석 대기",
    };
  }

  return {
    completeMs,
    stage: "complete" as const,
    stageElapsedMs: safeElapsedMs - completeMs,
    stageLabel: "결과 표시",
  };
}

function AdminLoadingPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-md border border-[#7c4a38]/55 bg-[rgba(7,6,17,0.86)] p-3 ring-1 ring-[#d799ff]/10">
      <h2 className="mb-3 text-[0.95rem] font-semibold text-[#ffd98a]">{title}</h2>
      {children}
    </section>
  );
}

function AdminLoadingControlButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-admin-loading-control-active={active ? "true" : "false"}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
        active
          ? "border-[#ffd08a]/80 bg-[#24172e] text-[#fff3d7]"
          : "border-[#7c4a38]/48 bg-[#06040c]/66 text-[#fff3d7]/78 hover:border-[#ffd08a]/58",
      )}
    >
      {children}
    </button>
  );
}

function TimelineRow({ active, label, time }: { active?: boolean; label: string; time: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#7c4a38]/35 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className={cn("text-[12px]", active ? "font-semibold text-[#ffd98a]" : "text-[#fff3d7]/64")}>
        {label}
      </span>
      <span className={cn("text-[12px] font-semibold", active ? "text-[#9fe6bd]" : "text-[#f0bc7d]/74")}>
        {time}
      </span>
    </div>
  );
}

export function AdminLoadingLab({
  initialControlPanelExpanded = false,
  initialDreamElapsedMs = 0,
  initialMode = "dream",
  initialTarotElapsedMs = 0,
}: AdminLoadingLabProps = {}) {
  const accessState = useAccessPlan();
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(initialControlPanelExpanded);
  const [mode, setMode] = useState<LoadingLabMode>(initialMode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [dreamElapsedMs, setDreamElapsedMs] = useState(initialDreamElapsedMs);
  const [tarotElapsedMs, setTarotElapsedMs] = useState(initialTarotElapsedMs);
  const [tarotCardCount, setTarotCardCount] = useState<TarotCardCount>(1);
  const [tarotApiWaitMs, setTarotApiWaitMs] = useState<number>(tarotDefaultApiWaitMs);
  const [catReaderId, setCatReaderId] = useState<CatReaderId>("black_cat");

  const reader = getCatReaderById(catReaderId);
  const dreamSequence = getDreamLoadingSequence(dreamElapsedMs);
  const tarotSelections = useMemo(() => createTarotSelections(tarotCardCount), [tarotCardCount]);
  const tarotRevealState = useMemo(() => createTarotRevealState(tarotCardCount), [tarotCardCount]);
  const tarotTimelineState = getTarotTimelineState(tarotElapsedMs, tarotApiWaitMs);
  const activeElapsedMs = mode === "dream" ? dreamElapsedMs : tarotElapsedMs;
  const activeMaxMs = mode === "dream" ? dreamTimelineMaxMs : tarotTimelineState.completeMs;
  const progress = activeMaxMs > 0 ? `${(clamp(activeElapsedMs / activeMaxMs, 0, 1) * 100).toFixed(1)}%` : "0%";

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let previousTime = Date.now();
    const timer = window.setInterval(() => {
      const nextTime = Date.now();
      const deltaMs = (nextTime - previousTime) * speed;
      previousTime = nextTime;

      if (mode === "dream") {
        setDreamElapsedMs((value) => {
          const nextValue = clamp(value + deltaMs, 0, dreamTimelineMaxMs);

          if (nextValue >= dreamTimelineMaxMs) {
            setIsPlaying(false);
          }

          return nextValue;
        });
        return;
      }

      setTarotElapsedMs((value) => {
        const nextValue = clamp(value + deltaMs, 0, tarotTimelineState.completeMs);

        if (nextValue >= tarotTimelineState.completeMs) {
          setIsPlaying(false);
        }

        return nextValue;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [isPlaying, mode, speed, tarotTimelineState.completeMs]);

  function resetActiveTimeline() {
    setIsPlaying(false);

    if (mode === "dream") {
      setDreamElapsedMs(0);
      return;
    }

    setTarotElapsedMs(0);
  }

  function jumpToNextStep() {
    setIsPlaying(false);

    if (mode === "dream") {
      const nextPoint = dreamJumpPoints.find((point) => point.elapsedMs > dreamElapsedMs + 50);
      setDreamElapsedMs(nextPoint?.elapsedMs ?? dreamTimelineMaxMs);
      return;
    }

    const nextPoint = Array.from(new Set([tarotCardRevealMs, tarotTimelineState.completeMs]))
      .sort((left, right) => left - right)
      .find((point) => point > tarotElapsedMs + 50);
    setTarotElapsedMs(nextPoint ?? tarotTimelineState.completeMs);
  }

  if (accessState.role !== "admin") {
    return (
      <section
        data-admin-loading-lab-state="restricted"
        className="mt-4 rounded-md border border-[#7c4a38]/55 bg-[rgba(7,6,17,0.82)] p-4"
      >
        <p className="text-[0.95rem] font-semibold text-[#ffd98a]">Admin only</p>
        <p className="mt-2 text-[12px] leading-5 text-[#fff3d7]/72">
          어드민 권한을 확인하는 중이거나, 현재 계정에는 로딩 체험 접근 권한이 없습니다.
        </p>
        <Link
          href="/admin/lab"
          className="mt-3 inline-flex rounded-md border border-[#b98255]/55 bg-[#06040c]/70 px-3 py-2 text-[12px] font-semibold text-[#ffe7b5]"
        >
          Admin Lab으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <div
      data-admin-loading-lab-state="active"
      data-admin-loading-lab-mode={mode}
      className={cn("min-h-[calc(100dvh-11rem)]", isControlPanelExpanded ? "pb-[18.5rem]" : "pb-[4.5rem]")}
    >
      {mode === "dream" ? (
        <DreamLoadingOverlay
          isActive
          elapsedMs={dreamElapsedMs}
          background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
          readerImage={manyangAssets.loadingReaders[reader.assetKey]}
          introImage={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
        />
      ) : (
        <div className="mt-4 pb-5" data-admin-loading-tarot-preview="true">
          {tarotTimelineState.stage === "reveal" && tarotRevealState ? (
            <DailyTarotRevealPanel {...tarotRevealState} />
          ) : tarotTimelineState.stage === "generating" ? (
            <DailyTarotPendingResult selections={tarotSelections} />
          ) : (
            <AdminLoadingPanel title="결과 표시">
              <p className="text-[13px] leading-6 text-[#fff3d7]/74">
                카드 공개가 끝나고 해석 응답도 준비되면 결과 화면의 카드와 본문이 바로 fade-in 됩니다.
              </p>
            </AdminLoadingPanel>
          )}
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[430px] px-3 pb-3"
        data-admin-loading-controls-expanded={isControlPanelExpanded ? "true" : "false"}
      >
        <div
          className={cn(
            "rounded-t-[1.15rem] rounded-b-md border border-[#d799ff]/32 bg-[#05040b]/95 shadow-[0_-18px_46px_rgba(0,0,0,0.52)] ring-1 ring-[#ffd98a]/10 backdrop-blur-xl transition-[max-height,padding] duration-300 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            isControlPanelExpanded ? "max-h-[52dvh] overflow-y-auto p-3" : "max-h-[3.6rem] overflow-hidden px-3 py-2",
          )}
        >
          <button
            type="button"
            aria-expanded={isControlPanelExpanded}
            data-admin-loading-controls-handle="true"
            onClick={() => setIsControlPanelExpanded((value) => !value)}
            className={cn(
              "flex w-full flex-col items-center gap-1 rounded-md py-1 text-[11px] font-semibold text-[#e7b3ff]/88 focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
              isControlPanelExpanded ? "mb-2" : "mb-0",
            )}
          >
            <span className="h-1.5 w-12 rounded-full bg-[#e7b3ff]/45" aria-hidden="true" />
            <span>{isControlPanelExpanded ? "메뉴 내리기" : "메뉴 올리기"}</span>
          </button>

          {isControlPanelExpanded ? (
            <>
              <div className="mb-3">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#e7b3ff]/85">
                  Loading Lab
                </p>
                <h1 className="mt-0.5 text-[1rem] font-semibold text-[#ffd98a]">
                  {mode === "dream" ? "꿈해몽 로딩" : "타로 로딩"}
                </h1>
                <p className="mt-0.5 text-[11px] font-semibold text-[#fff3d7]/64">
                  현재 {formatSeconds(activeElapsedMs)} · {mode === "dream" ? dreamSequence.scene : tarotTimelineState.stageLabel}
                </p>
              </div>

              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#25162c]">
                <div className="h-full rounded-full bg-[#ffd08a]" style={{ width: progress }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <AdminLoadingControlButton active={mode === "dream"} onClick={() => setMode("dream")}>
                  꿈해몽
                </AdminLoadingControlButton>
                <AdminLoadingControlButton active={mode === "tarot"} onClick={() => setMode("tarot")}>
                  타로
                </AdminLoadingControlButton>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <AdminLoadingControlButton active={isPlaying} onClick={() => setIsPlaying((value) => !value)}>
                  {isPlaying ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
                  {isPlaying ? "정지" : "재생"}
                </AdminLoadingControlButton>
                <AdminLoadingControlButton onClick={resetActiveTimeline}>
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  리셋
                </AdminLoadingControlButton>
                <AdminLoadingControlButton onClick={jumpToNextStep}>
                  <SkipForward aria-hidden="true" className="h-3.5 w-3.5" />
                  다음
                </AdminLoadingControlButton>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {playbackSpeeds.map((playbackSpeed) => (
                  <AdminLoadingControlButton
                    key={playbackSpeed}
                    active={speed === playbackSpeed}
                    onClick={() => setSpeed(playbackSpeed)}
                  >
                    <Gauge aria-hidden="true" className="h-3.5 w-3.5" />
                    {playbackSpeed}x
                  </AdminLoadingControlButton>
                ))}
              </div>

              {mode === "dream" ? (
                <div className="mt-3 space-y-3">
                  <AdminLoadingPanel title="꿈해몽 타임라인">
                    <TimelineRow active={dreamSequence.scene === "reader"} label="고양이 등장" time="0.0s - 3.0s" />
                    <TimelineRow active={dreamSequence.scene === "interpretation"} label="해석 배경" time="3.0s - 10.0s" />
                    <TimelineRow active={dreamSequence.scene === "orb"} label={`오브 단계 ${dreamSequence.stepLabel}`} time="10.0s - 20.0s+" />
                    <TimelineRow active={dreamSequence.canFinish} label="결과 이동 가능" time="20.0s+" />
                    <TimelineRow active={dreamElapsedMs >= 25_000} label="긴 대기 문구" time="25.0s / 55.0s" />
                  </AdminLoadingPanel>

                  <div className="flex flex-wrap gap-2">
                    {dreamJumpPoints.map((point) => (
                      <AdminLoadingControlButton
                        key={point.label}
                        active={Math.abs(dreamElapsedMs - point.elapsedMs) < 50}
                        onClick={() => {
                          setIsPlaying(false);
                          setDreamElapsedMs(point.elapsedMs);
                        }}
                      >
                        {point.label}
                      </AdminLoadingControlButton>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {catReaders.map((catReader) => (
                      <AdminLoadingControlButton
                        key={catReader.id}
                        active={catReaderId === catReader.id}
                        onClick={() => setCatReaderId(catReader.id)}
                      >
                        {catReader.nameEn}
                      </AdminLoadingControlButton>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <AdminLoadingPanel title="타로 타임라인">
                    <TimelineRow active={tarotTimelineState.stage === "reveal"} label="카드 공개" time={formatSeconds(tarotCardRevealMs)} />
                    <TimelineRow
                      active={tarotTimelineState.stage === "generating"}
                      label="해석 대기"
                      time={`API 응답까지 (${formatSeconds(tarotApiWaitMs)} 시뮬레이션)`}
                    />
                    <TimelineRow
                      active={tarotTimelineState.stage === "complete"}
                      label="결과 표시"
                      time={formatSeconds(tarotTimelineState.completeMs)}
                    />
                  </AdminLoadingPanel>

                  <div className="grid grid-cols-2 gap-2">
                    <AdminLoadingControlButton active={tarotCardCount === 1} onClick={() => setTarotCardCount(1)}>
                      1장
                    </AdminLoadingControlButton>
                    <AdminLoadingControlButton active={tarotCardCount === 3} onClick={() => setTarotCardCount(3)}>
                      3장
                    </AdminLoadingControlButton>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tarotApiWaitOptions.map((waitMs) => (
                      <AdminLoadingControlButton
                        key={waitMs}
                        active={tarotApiWaitMs === waitMs}
                        onClick={() => {
                          setIsPlaying(false);
                          setTarotApiWaitMs(waitMs);
                          setTarotElapsedMs((value) => Math.min(value, getTarotTimelineState(value, waitMs).completeMs));
                        }}
                      >
                        API {formatSeconds(waitMs)}
                      </AdminLoadingControlButton>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "공개", elapsedMs: 0 },
                      { label: "해석", elapsedMs: tarotCardRevealMs },
                      { label: "결과", elapsedMs: tarotTimelineState.completeMs },
                    ].map((point) => (
                      <AdminLoadingControlButton
                        key={point.label}
                        active={Math.abs(tarotElapsedMs - point.elapsedMs) < 50}
                        onClick={() => {
                          setIsPlaying(false);
                          setTarotElapsedMs(point.elapsedMs);
                        }}
                      >
                        {point.label}
                      </AdminLoadingControlButton>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-3 rounded-md border border-[#7c4a38]/38 bg-[#06040c]/58 px-3 py-2 text-[12px] leading-5 text-[#fff3d7]/70">
                현재 {formatSeconds(activeElapsedMs)} · {mode === "dream" ? dreamSequence.scene : tarotTimelineState.stageLabel}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
