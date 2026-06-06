"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import {
  createDailyTarotOptions,
  createDailyTarotUserIdentityKey,
  dailyTarotDisplayTitle,
  dailyTarotStorageKey,
  getDailyTarotReadingFromBrowser,
  getOrCreateDailyTarotGuestIdentityFromBrowser,
  pendingDailyTarotDrawIdentityKey,
  saveDailyTarotReadingToBrowser,
  subscribeToDailyTarot,
  type DailyTarotCardSelection,
  type DailyTarotOption,
  type DailyTarotPosition,
  type DailyTarotReading,
  type TarotSpread,
} from "@/lib/daily-tarot";
import { manyangAssets } from "@/lib/manyang-assets";
import {
  createTarotReadingFileName,
  createTarotReadingShareText,
  createTarotReadingSvg,
} from "@/lib/result-actions";
import { cn, ui } from "@/lib/styles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTarotMajorCardById } from "@/lib/tarot-major-cards";
import { canUseTarotThreeCardReading, tarotThreeCardFreeEvent } from "@/lib/tarot-event";
import { useAccessPlan } from "@/lib/use-access-plan";

type DailyTarotClientProps = {
  appDate: string;
  ignoreStoredReading?: boolean;
  initialReading: DailyTarotReading | null;
  initialUserId?: string | null;
};

type DailyTarotSnapshotCache = {
  appDate: string;
  drawIdentityKey: string | null;
  spread: TarotSpread;
  reading: DailyTarotReading | null;
  storageValue: string | null;
};

type GenerationStatus = "idle" | "revealing" | "generating" | "error";
type DailyTarotRevealState = {
  options: DailyTarotOption[];
  selectedOptionId: string;
  selectedOptionIndex: number;
  selection: DailyTarotCardSelection;
};
type GenerationRequestStatus = "idle" | "pending" | "resolved" | "rejected";
type SubmitSelectionsOptions = {
  showLoadingImmediately?: boolean;
  updatePendingSelections?: boolean;
  requestSpread?: TarotSpread;
  requestKey?: string;
};

let dailyTarotSnapshotCache: DailyTarotSnapshotCache | null = null;

export const tarotCardRevealMs = 1800;
const tarotShuffleCardCount = 7;

const orientationLabels = {
  upright: "정방향",
  reversed: "역방향",
} as const;

const spreadPositions = {
  daily_one_card: ["today"],
  daily_three_card: ["situation", "flow", "advice"],
} satisfies Record<TarotSpread, DailyTarotPosition[]>;

const positionLabels = {
  today: "오늘",
  situation: "지금의 상태",
  flow: "이어지는 흐름",
  advice: "오늘의 조언",
} satisfies Record<DailyTarotPosition, string>;

const initialDrawInstruction = "마음이 닿는 뒷면을 터치해 오늘의 카드를 열어보세요.";

function getDailyTarotStorageValueFromBrowser(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(dailyTarotStorageKey);
  } catch {
    return null;
  }
}

function isCompletedLlmReading(reading: DailyTarotReading | null | undefined): reading is DailyTarotReading {
  return reading?.source === "llm" && Boolean(reading.generated);
}

const trailingLlmArtifactPatterns = [
  /\s*[}\])]{2,}\s*(?:PMID|PMCID|DOI|ID)?:?[}\])]*\s*$/iu,
  /\s*(?:PMID|PMCID):?[}\])]*\s*$/iu,
  /\s*[}\])]{2,}\s*$/u,
] as const;

function cleanTarotDisplayText(value: string): string {
  let cleaned = value.trim();
  let previous = "";

  while (cleaned && cleaned !== previous) {
    previous = cleaned;

    for (const pattern of trailingLlmArtifactPatterns) {
      cleaned = cleaned.replace(pattern, "").trim();
    }
  }

  return cleaned;
}

function cleanUniqueTarotDisplayTexts(values: readonly string[] | undefined, maxCount: number): string[] {
  const seen = new Set<string>();
  const cleanedValues: string[] = [];

  for (const value of values ?? []) {
    const cleaned = cleanTarotDisplayText(value);

    if (!cleaned || seen.has(cleaned)) {
      continue;
    }

    seen.add(cleaned);
    cleanedValues.push(cleaned);

    if (cleanedValues.length >= maxCount) {
      break;
    }
  }

  return cleanedValues;
}

function clampTarotCardZoom(value: number): number {
  return Math.min(Math.max(value, 1), 2.8);
}

function getTouchDistance(touches: TouchEvent<HTMLDivElement>["touches"]): number {
  const firstTouch = touches.item(0);
  const secondTouch = touches.item(1);

  if (!firstTouch || !secondTouch) {
    return 0;
  }

  return Math.hypot(firstTouch.clientX - secondTouch.clientX, firstTouch.clientY - secondTouch.clientY);
}

export function getStableDailyTarotReadingSnapshot(
  appDate: string,
  spread: TarotSpread = "daily_one_card",
  drawIdentityKey: string | null = null,
): DailyTarotReading | null {
  const storageValue = getDailyTarotStorageValueFromBrowser();

  if (
    dailyTarotSnapshotCache?.appDate === appDate &&
    dailyTarotSnapshotCache.drawIdentityKey === drawIdentityKey &&
    dailyTarotSnapshotCache.spread === spread &&
    dailyTarotSnapshotCache.storageValue === storageValue
  ) {
    return dailyTarotSnapshotCache.reading;
  }

  const reading = getDailyTarotReadingFromBrowser(appDate, { spread, drawIdentityKey });
  dailyTarotSnapshotCache = { appDate, drawIdentityKey, spread, reading, storageValue };

  return reading;
}

function createInitialDailyTarotDrawIdentityKey(initialUserId: string | null | undefined): string {
  return initialUserId ? createDailyTarotUserIdentityKey(initialUserId) : pendingDailyTarotDrawIdentityKey;
}

function isMatchingDailyTarotDrawIdentity(reading: DailyTarotReading, drawIdentityKey: string): boolean {
  return !reading.drawIdentityKey || reading.drawIdentityKey === drawIdentityKey;
}

function wrapDeckIndex(index: number, length: number): number {
  return (index + length) % length;
}

function getCircularDeckOffset(index: number, activeIndex: number, length: number): number {
  let offset = index - activeIndex;
  const halfLength = length / 2;

  if (offset > halfLength) {
    offset -= length;
  }

  if (offset < -halfLength) {
    offset += length;
  }

  return offset;
}

export function createPreparedDailyTarotSelections(
  options: DailyTarotOption[],
  positions: readonly DailyTarotPosition[],
): DailyTarotCardSelection[] {
  if (options.length === 0 || positions.length === 0) {
    return [];
  }

  const centerIndex = Math.floor(options.length / 2);

  return positions.flatMap((position, index) => {
    const option = options[wrapDeckIndex(centerIndex + index, options.length)];
    const card = option ? getTarotMajorCardById(option.cardId) : null;

    return option && card
      ? [
          {
            position,
            card,
            orientation: option.orientation,
          },
        ]
      : [];
  });
}

function DailyTarotFanDeck({
  options,
  onSelect,
  disabled,
  initialActiveIndex,
  revealOptionId,
}: {
  options: DailyTarotOption[];
  onSelect: (option: DailyTarotOption, index: number) => void;
  disabled?: boolean;
  initialActiveIndex?: number;
  revealOptionId?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(() => initialActiveIndex ?? Math.floor(options.length / 2));
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const dragDistanceRef = useRef(0);
  const removeWindowDragListenersRef = useRef<(() => void) | null>(null);
  const isDragging = dragStartX !== null;
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, options.length - 1));
  const isRevealMode = Boolean(revealOptionId);

  useEffect(() => {
    return () => removeWindowDragListenersRef.current?.();
  }, []);

  function moveDeckBy(delta: number) {
    if (disabled || isRevealMode || options.length === 0) {
      return;
    }

    setActiveIndex((currentIndex) => wrapDeckIndex(currentIndex + delta, options.length));
  }

  function detachWindowDragListeners() {
    removeWindowDragListenersRef.current?.();
    removeWindowDragListenersRef.current = null;
  }

  function attachWindowDragListeners() {
    detachWindowDragListeners();

    function handleWindowPointerMove(event: globalThis.PointerEvent) {
      updateDrag(event.clientX);
    }

    function handleWindowPointerUp(event: globalThis.PointerEvent) {
      finishDrag(event.clientX);
    }

    function handleWindowMouseMove(event: globalThis.MouseEvent) {
      updateDrag(event.clientX);
    }

    function handleWindowMouseUp(event: globalThis.MouseEvent) {
      finishDrag(event.clientX);
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    removeWindowDragListenersRef.current = () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }

  function startDrag(clientX: number) {
    if (disabled || isRevealMode) {
      return;
    }

    dragStartXRef.current = clientX;
    setDragStartX(clientX);
    setDragDelta(0);
    dragDistanceRef.current = 0;
    attachWindowDragListeners();
  }

  function updateDrag(clientX: number) {
    const startX = dragStartXRef.current;

    if (startX === null) {
      return;
    }

    setDragDelta(clientX - startX);
  }

  function finishDrag(clientX: number) {
    const startX = dragStartXRef.current;

    if (startX === null) {
      return;
    }

    const nextDragDelta = clientX - startX;
    dragDistanceRef.current = Math.abs(nextDragDelta);

    if (nextDragDelta <= -34) {
      moveDeckBy(1);
    } else if (nextDragDelta >= 34) {
      moveDeckBy(-1);
    }

    dragStartXRef.current = null;
    detachWindowDragListeners();
    setDragStartX(null);
    setDragDelta(0);
  }

  function cancelDrag() {
    dragDistanceRef.current = 999;
    dragStartXRef.current = null;
    detachWindowDragListeners();
    setDragStartX(null);
    setDragDelta(0);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    startDrag(event.clientX);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStartXRef.current !== null) {
      event.preventDefault();
    }

    updateDrag(event.clientX);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    finishDrag(event.clientX);
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    startDrag(event.clientX);
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (dragStartXRef.current !== null) {
      event.preventDefault();
    }

    updateDrag(event.clientX);
  }

  function handleMouseUp(event: MouseEvent<HTMLDivElement>) {
    finishDrag(event.clientX);
  }

  function handleCardClick(option: DailyTarotOption, index: number) {
    if (disabled || isRevealMode) {
      return;
    }

    if (dragDistanceRef.current > 10) {
      dragDistanceRef.current = 0;
      return;
    }

    if (index === safeActiveIndex) {
      onSelect(option, index);
      return;
    }

    setActiveIndex(index);
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div
      data-daily-tarot-deck
      data-daily-tarot-reveal-deck={isRevealMode ? "true" : undefined}
      aria-hidden={isRevealMode ? "true" : undefined}
      className={cn("mt-5", isRevealMode ? "tarot-fan-deck-revealing" : "")}
    >
      <div
        role="group"
        aria-label="22장 메이저 아르카나 덱"
        className="relative mx-[-2.5rem] h-[23rem] overflow-hidden touch-pan-y select-none"
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerUp}
        onPointerCancelCapture={cancelDrag}
        onMouseDownCapture={handleMouseDown}
        onMouseMoveCapture={handleMouseMove}
        onMouseUpCapture={handleMouseUp}
      >
        {options.map((option, index) => {
          const circularOffset = getCircularDeckOffset(index, safeActiveIndex, options.length);

          if (Math.abs(circularOffset) > 3) {
            return null;
          }

          const adjustedOffset = circularOffset + dragDelta / 118;
          const absoluteOffset = Math.abs(circularOffset);
          const isActive = index === safeActiveIndex;
          const orientationLabel = orientationLabels[option.orientation];
          const translateX = adjustedOffset * 46;
          const translateY = Math.abs(adjustedOffset) * 10 + Math.abs(adjustedOffset) ** 2 * 2.4;
          const rotation = adjustedOffset * 7;
          const scale = isActive ? 1.03 : 1 - absoluteOffset * 0.035;
          const isRevealOrigin = revealOptionId === option.id;
          const opacity = isRevealOrigin ? 0 : isRevealMode ? (absoluteOffset > 2 ? 0.24 : 0.38) : absoluteOffset > 2 ? 0.72 : 1;

          return (
            <button
              key={option.id}
              type="button"
              data-daily-tarot-option={option.id}
              data-daily-tarot-card-id={option.cardId}
              data-daily-tarot-orientation={option.orientation}
              data-daily-tarot-active={isActive ? "true" : "false"}
              data-daily-tarot-reveal-origin={isRevealOrigin ? "true" : undefined}
              data-daily-tarot-reveal-side={isRevealMode && !isRevealOrigin ? "true" : undefined}
              aria-label={
                isActive
                  ? `${orientationLabel} 중앙 카드 ${index + 1} / ${options.length} 뽑기`
                  : `${orientationLabel} 카드 ${index + 1} / ${options.length}로 이동`
              }
              disabled={disabled || isRevealMode}
              onClick={() => handleCardClick(option, index)}
              className={cn(
                "absolute left-1/2 top-[48%] w-[9.25rem] cursor-grab outline-none active:cursor-grabbing disabled:cursor-wait",
                "focus-visible:drop-shadow-[0_0_20px_rgba(215,153,255,0.72)]",
                isActive
                  ? "drop-shadow-[0_18px_28px_rgba(255,208,95,0.28)]"
                  : "drop-shadow-[0_12px_22px_rgba(0,0,0,0.28)]",
              )}
              style={{
                opacity,
                transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                transition: isDragging
                  ? "none"
                  : "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease, filter 180ms ease",
                zIndex: 50 - absoluteOffset,
              }}
            >
              <span className="relative block aspect-[5/8] w-full">
                <Image
                  src={manyangAssets.tarot.cardBack}
                  alt=""
                  fill
                  sizes="148px"
                  className={cn("object-contain", option.orientation === "reversed" ? "rotate-180" : "")}
                  priority={absoluteOffset <= 1}
                />
              </span>
              <span className="sr-only">{orientationLabel}</span>
            </button>
          );
        })}
      </div>

      <div data-daily-tarot-deck-controls="true" className="mx-auto -mt-3 flex max-w-[15rem] items-center justify-center gap-3">
        <button
          type="button"
          aria-label="이전 카드"
          onClick={() => moveDeckBy(-1)}
          disabled={disabled}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#b98255]/45 bg-[#05040b]/58 text-lg font-bold text-[#f2c27d] shadow-[0_0_16px_rgba(0,0,0,0.28)] transition hover:border-[#ffd08a]/70 hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff] disabled:opacity-45"
        >
          ‹
        </button>
        <p className="min-w-[5.25rem] text-center text-[12px] font-semibold text-[#c7a98a]">
          {safeActiveIndex + 1} / {options.length}
        </p>
        <button
          type="button"
          aria-label="다음 카드"
          onClick={() => moveDeckBy(1)}
          disabled={disabled}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#b98255]/45 bg-[#05040b]/58 text-lg font-bold text-[#f2c27d] shadow-[0_0_16px_rgba(0,0,0,0.28)] transition hover:border-[#ffd08a]/70 hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff] disabled:opacity-45"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function DailyTarotShuffleIntro() {
  return (
    <div
      data-daily-tarot-shuffle-intro="true"
      role="status"
      aria-live="polite"
      className="tarot-shuffle-intro pointer-events-auto absolute inset-0 z-30 flex items-start justify-center px-2 pb-4 pt-1 text-center"
    >
      <div className="w-full max-w-[22rem] rounded-[1.1rem] border border-[#b98255]/34 bg-[#05040b] px-4 py-5 ring-1 ring-[#d799ff]/10">
        <div className="relative mx-auto h-[14.5rem] w-full max-w-[18rem] overflow-hidden">
          {Array.from({ length: tarotShuffleCardCount }).map((_, index) => {
            const offset = index - Math.floor(tarotShuffleCardCount / 2);

            return (
              <span
                key={`shuffle-${index}`}
                data-daily-tarot-shuffle-card="true"
                className="tarot-shuffle-card absolute left-1/2 top-1/2 block h-[10.6rem] w-[6.6rem] drop-shadow-[0_16px_28px_rgba(0,0,0,0.32)]"
                style={
                  {
                    "--shuffle-offset": offset,
                    animationDelay: `${index * 120}ms`,
                    zIndex: 20 + index,
                  } as CSSProperties
                }
              >
                <Image
                  src={manyangAssets.tarot.cardBack}
                  alt=""
                  fill
                  sizes="106px"
                  className="object-contain"
                  priority={index <= 3}
                />
              </span>
            );
          })}
        </div>

        <p className={cn("mt-1 text-[15px] font-bold text-[#ffe7b5]", ui.textGlow)}>
          카드를 섞고 있어요
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[#c7a98a]">
          {initialDrawInstruction}
        </p>
      </div>
    </div>
  );
}

export function DailyTarotRevealPanel({
  options,
  selectedOptionId,
  selectedOptionIndex,
  selection,
}: DailyTarotRevealState) {
  const orientationLabel = orientationLabels[selection.orientation];

  return (
    <div
      data-daily-tarot-reveal="true"
      role="status"
      aria-live="polite"
      className="relative mt-4 min-h-[25rem] text-center"
    >
      <p className="text-[12px] font-semibold text-[#f2c27d]">고른 카드가 열리고 있어요.</p>
      <DailyTarotFanDeck
        disabled
        initialActiveIndex={selectedOptionIndex}
        onSelect={() => undefined}
        options={options}
        revealOptionId={selectedOptionId}
      />

      <div
        data-daily-tarot-selected-card-reveal="true"
        className="tarot-selected-card-reveal pointer-events-none absolute left-1/2 top-[48%] z-[80] w-[9.25rem]"
      >
        <div data-daily-tarot-flip-card="true" className="tarot-flip-card relative aspect-[5/8] w-full">
          <div className="tarot-selected-card-reveal-inner relative h-full w-full">
            <span
              data-daily-tarot-flip-back="true"
              className="tarot-flip-card-face tarot-selected-card-reveal-back absolute inset-0"
            >
              <Image
                src={manyangAssets.tarot.cardBack}
                alt=""
                fill
                sizes="148px"
                className={cn("object-contain", selection.orientation === "reversed" ? "rotate-180" : "")}
                priority
              />
            </span>
            <span
              data-daily-tarot-flip-front="true"
              className="tarot-flip-card-face tarot-selected-card-reveal-front absolute inset-0"
            >
              <Image
                src={selection.card.image}
                alt={`${selection.card.nameKo} ${orientationLabel}`}
                fill
                sizes="148px"
                className={cn("object-contain", selection.orientation === "reversed" ? "rotate-180" : "")}
                priority
              />
            </span>
          </div>
        </div>
      </div>

      <p className={cn("absolute inset-x-0 bottom-8 text-[13px] font-bold text-[#ffe7b5]", ui.textGlow)}>
        {selection.card.nameKo} · {orientationLabel}
      </p>
    </div>
  );
}

export function DailyTarotLoadingPanel({
  selections,
}: {
  selections: DailyTarotCardSelection[];
}) {
  const selectedCards = selections.slice(0, 3);

  return (
    <div
      data-daily-tarot-loading="true"
      role="status"
      aria-live="polite"
      className="mx-auto mt-5 max-w-[22rem] rounded-[1.1rem] border border-[#b98255]/38 bg-[#05040b]/62 px-4 py-5 text-center shadow-[0_18px_42px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10"
    >
      <div className="mx-auto flex min-h-[12rem] items-center justify-center">
        <div
          data-daily-tarot-loading-card-stage="true"
          className="relative h-[11.75rem] w-[13rem]"
        >
          {selectedCards.length > 0 ? (
            selectedCards.map((selection, index) => {
              const offset = index - (selectedCards.length - 1) / 2;
              const offsetX = offset * 34;
              const rotation = offset * 6;

              return (
                <span
                  key={`${selection.position}-${selection.card.id}`}
                  data-daily-tarot-loading-card="true"
                  className={cn(
                    "absolute left-1/2 top-1/2 grid h-[8.45rem] w-[5.3rem] place-items-center drop-shadow-[0_16px_28px_rgba(0,0,0,0.34)]",
                    "animate-pulse",
                  )}
                  style={{
                    "--tarot-loading-card-offset-x": `${offsetX}px`,
                    "--tarot-loading-card-rotation": `${rotation}deg`,
                    animationDelay: `${index * 150}ms`,
                    transform: `translate(-50%, -50%) translateX(${offsetX}px) rotate(${rotation}deg)`,
                    zIndex: 10 + index,
                  } as CSSProperties}
                >
                  <Image
                    src={selection.card.image}
                    alt={`${selection.card.nameKo} ${orientationLabels[selection.orientation]}`}
                    fill
                    sizes="88px"
                    className={cn("object-contain", selection.orientation === "reversed" ? "rotate-180" : "")}
                    priority
                  />
                </span>
              );
            })
          ) : (
            <span
              data-daily-tarot-loading-card="true"
              className={cn(
                "absolute left-1/2 top-1/2 grid h-[8.45rem] w-[5.3rem] place-items-center drop-shadow-[0_16px_28px_rgba(0,0,0,0.34)]",
                "-translate-x-1/2 -translate-y-1/2 animate-pulse",
              )}
            >
              <Image
                src={manyangAssets.tarot.cardBack}
                alt=""
                fill
                sizes="88px"
                className="object-contain"
                priority
              />
            </span>
          )}
        </div>
      </div>

      <div
        data-daily-tarot-loading-copy="true"
      >
      <p className={cn("mt-2 text-[15px] font-bold text-[#ffe7b5]", ui.textGlow)}>
        해석을 완성하고 있어요
      </p>
      <p className="mt-2 text-[12px] leading-5 text-[#c7a98a]">
        선택한 카드의 상징과 방향을 연결해 오늘의 흐름을 읽는 중이에요.
      </p>
      {selectedCards.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {selectedCards.map((selection) => (
            <span
              key={`${selection.position}-${selection.card.id}-label`}
              className="rounded-full border border-[#f2c27d]/30 bg-[#f2c27d]/8 px-3 py-1 text-[11px] font-bold text-[#f2c27d]"
            >
              {selection.card.nameKo} · {orientationLabels[selection.orientation]}
            </span>
          ))}
        </div>
      ) : null}
      </div>
    </div>
  );
}

function DailyTarotResultCard({
  compact = false,
  onZoom,
  selection,
}: {
  compact?: boolean;
  onZoom?: (selection: DailyTarotCardSelection) => void;
  selection: DailyTarotCardSelection;
}) {
  const orientationLabel = orientationLabels[selection.orientation];
  const isLargeCard = !compact && selection.position === "today";
  const imageMaxWidth = compact ? "max-w-[7.25rem]" : isLargeCard ? "max-w-[15.5rem]" : "max-w-[9.5rem]";
  const imageSizes = compact ? "116px" : isLargeCard ? "248px" : "152px";
  const resultLabel =
    selection.position === "today" ? orientationLabel : `${positionLabels[selection.position]} · ${orientationLabel}`;
  const cardSize = isLargeCard ? "large" : compact ? "compact" : "standard";
  const cardImage = (
    <div className="relative aspect-[5/8] drop-shadow-[0_18px_34px_rgba(0,0,0,0.34)]">
      <Image
        src={selection.card.image}
        alt={`${selection.card.nameKo} ${orientationLabel}`}
        fill
        sizes={imageSizes}
        className={cn("object-contain", selection.orientation === "reversed" ? "rotate-180" : "")}
        priority
      />
    </div>
  );

  return (
    <div className="tarot-result-card-enter w-full text-center" data-daily-tarot-result-card-size={cardSize}>
      {onZoom ? (
        <button
          type="button"
          data-daily-tarot-card-zoom-trigger="true"
          aria-label={`${selection.card.nameKo} ${orientationLabel} 카드 크게 보기`}
          onClick={() => onZoom(selection)}
          className={cn(
            "mx-auto block w-full cursor-zoom-in touch-manipulation rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
            imageMaxWidth,
          )}
        >
          {cardImage}
        </button>
      ) : (
        <div className={cn("mx-auto w-full", imageMaxWidth)}>{cardImage}</div>
      )}
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f4b65f]">
        {resultLabel}
      </p>
      <h2 className={cn("mt-1 text-xl font-bold leading-tight text-[#ffe7b5]", ui.textGlow)}>
        {selection.card.nameKo}
      </h2>
      <p className="mt-1 text-[12px] font-semibold text-[#d9b6ff]">{selection.card.nameEn}</p>
      {onZoom ? (
        <button
          type="button"
          data-daily-tarot-zoom-trigger="true"
          onClick={() => onZoom(selection)}
          className="mt-2 text-[12px] font-bold text-[#f2c27d] underline decoration-[#f2c27d]/45 underline-offset-4 transition hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
        >
          카드 크게 보기
        </button>
      ) : null}
    </div>
  );
}

function TarotCardZoomDialog({
  onClose,
  selection,
}: {
  onClose: () => void;
  selection: DailyTarotCardSelection;
}) {
  const [zoom, setZoom] = useState(1);
  const pinchDistanceRef = useRef<number | null>(null);
  const orientationLabel = orientationLabels[selection.orientation];
  const title = `${selection.card.nameKo} ${orientationLabel}`;

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      pinchDistanceRef.current = getTouchDistance(event.touches);
    }
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || pinchDistanceRef.current === null) {
      return;
    }

    const nextDistance = getTouchDistance(event.touches);

    if (nextDistance <= 0) {
      return;
    }

    event.preventDefault();
    setZoom((currentZoom) => clampTarotCardZoom(currentZoom * (nextDistance / pinchDistanceRef.current!)));
    pinchDistanceRef.current = nextDistance;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 카드 크게 보기`}
      className="fixed inset-0 z-50 flex flex-col bg-[#04030a]/96 px-4 py-5 text-[#fff3d7]"
    >
      <div className="mx-auto flex w-full max-w-[34rem] items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-bold text-[#ffe7b5]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#f2c27d]/45 bg-[#05040b]/72 px-4 py-2 text-[12px] font-bold text-[#f2c27d] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
        >
          닫기
        </button>
      </div>

      <div className="mx-auto mt-4 flex min-h-0 w-full max-w-[34rem] flex-1 flex-col items-center gap-3">
        <div
          data-daily-tarot-zoom-scroll-area="true"
          className="h-full max-h-[76vh] w-full overflow-y-auto overflow-x-hidden rounded-[0.75rem] bg-[#05040b]/36 p-2"
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
          style={{ touchAction: "pan-y" }}
        >
          <div
            className="relative mx-auto aspect-[5/8] min-w-full"
            style={{ width: `${Math.round(zoom * 100)}%` }}
          >
            <Image
              src={selection.card.image}
              alt={title}
              fill
              sizes="min(92vw, 34rem)"
              className={cn("object-contain", selection.orientation === "reversed" ? "rotate-180" : "")}
              priority
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="카드 축소"
            onClick={() => setZoom((currentZoom) => clampTarotCardZoom(currentZoom - 0.25))}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#f2c27d]/45 bg-[#05040b]/72 text-[16px] font-bold text-[#f2c27d] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            -
          </button>
          <p className="min-w-[3.5rem] text-center text-[12px] font-bold text-[#c7a98a]">
            {Math.round(zoom * 100)}%
          </p>
          <button
            type="button"
            aria-label="카드 확대"
            onClick={() => setZoom((currentZoom) => clampTarotCardZoom(currentZoom + 0.25))}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#f2c27d]/45 bg-[#05040b]/72 text-[16px] font-bold text-[#f2c27d] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            +
          </button>
        </div>

        <p className="text-center text-[12px] leading-5 text-[#c7a98a]">
          두 손가락으로 확대하거나 버튼으로 카드 상징을 자세히 볼 수 있어요.
        </p>
      </div>
    </div>
  );
}

function MoonPassTag({ active = false }: { active?: boolean }) {
  return (
    <span
      data-daily-tarot-premium-tag="moon-pass"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none",
        active
          ? "border-[#150b18]/25 bg-[#150b18]/10 text-[#150b18]"
          : "border-[#d9b6ff]/45 bg-[#d9b6ff]/10 text-[#d9b6ff]",
      )}
    >
      Moon Pass
    </span>
  );
}

function TarotThreeCardAccessTag({ active = false }: { active?: boolean }) {
  if (tarotThreeCardFreeEvent.isActive) {
    return (
      <span
        data-daily-tarot-free-event-tag="tarot-three-card"
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none",
          active
            ? "border-[#150b18]/25 bg-[#150b18]/10 text-[#150b18]"
            : "border-[#f2c27d]/50 bg-[#f2c27d]/10 text-[#f2c27d]",
        )}
      >
        {tarotThreeCardFreeEvent.label}
      </span>
    );
  }

  return <MoonPassTag active={active} />;
}

function resolveDailyTarotResultSelections(selections: DailyTarotCardSelection[]): DailyTarotCardSelection[] {
  return selections.map((selection) => ({
    ...selection,
    card: getTarotMajorCardById(selection.card.id) ?? selection.card,
  }));
}

function resolveDictionaryKeywordsFromSelections(selections: DailyTarotCardSelection[]): string[] {
  return cleanUniqueTarotDisplayTexts(
    selections.flatMap((selection) => selection.card.keywords),
    5,
  );
}

function resolveDictionaryCardMessagesFromSelections(selections: DailyTarotCardSelection[]) {
  return selections.flatMap((selection) => {
    const message = cleanTarotDisplayText(selection.card[selection.orientation].cardMessage);

    if (!message) {
      return [];
    }

    return [
      {
        key: `${selection.position}-${selection.card.id}-${selection.orientation}`,
        label:
          selections.length > 1
            ? `${positionLabels[selection.position]} · ${selection.card.nameKo} · ${orientationLabels[selection.orientation]}`
            : "카드 메시지",
        message,
      },
    ];
  });
}

function DailyTarotResultCardGrid({
  cards,
  onZoom,
}: {
  cards: DailyTarotCardSelection[];
  onZoom: (selection: DailyTarotCardSelection) => void;
}) {
  return (
    <div className={cn("grid gap-4", cards.length > 1 ? "grid-cols-3 items-start" : "justify-items-center")}>
      {cards.map((selection) => (
        <DailyTarotResultCard
          key={`${selection.position}-${selection.card.id}`}
          compact={cards.length > 1}
          onZoom={onZoom}
          selection={selection}
        />
      ))}
    </div>
  );
}

function DailyTarotFixedGuidanceSection({
  enterDelay = "140ms",
  showKeywords = true,
  selections,
}: {
  enterDelay?: string;
  showKeywords?: boolean;
  selections: DailyTarotCardSelection[];
}) {
  const keywords = showKeywords ? resolveDictionaryKeywordsFromSelections(selections) : [];
  const cardMessages = resolveDictionaryCardMessagesFromSelections(selections);

  if (keywords.length === 0 && cardMessages.length === 0) {
    return null;
  }

  return (
    <div
      data-daily-tarot-fixed-guidance="true"
      className="tarot-result-content-enter mt-4 rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/54 p-4 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)]"
      style={{ "--tarot-result-enter-delay": enterDelay } as CSSProperties}
    >
      {keywords.length > 0 ? (
        <>
          <p className="text-[12px] font-bold text-[#f4b65f]">카드 키워드</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-[#f2c27d]/32 bg-[#f2c27d]/8 px-2.5 py-1 text-[11px] font-bold text-[#f5c978]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </>
      ) : null}
      {cardMessages.length > 0 ? (
        <div className={keywords.length > 0 ? "mt-3 border-t border-[#b98255]/25 pt-3" : ""}>
          <p className="text-[12px] font-bold text-[#f4b65f]">카드 메시지</p>
          <div data-daily-tarot-card-messages="true" className="mt-2 space-y-3">
            {cardMessages.map((cardMessage) => (
              <div key={cardMessage.key} className="text-[13px] leading-6">
                {cardMessages.length > 1 ? (
                  <p className="mb-1 text-[11px] font-bold text-[#c7a98a]">{cardMessage.label}</p>
                ) : null}
                <p className="text-[#f2c27d]">{cardMessage.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DailyTarotReadingLoadingSection({ enterDelay = "220ms" }: { enterDelay?: string }) {
  return (
    <div
      data-daily-tarot-reading-loading="true"
      role="status"
      aria-live="polite"
      className="tarot-result-content-enter mt-4 rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/54 p-4 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)]"
      style={{ "--tarot-result-enter-delay": enterDelay } as CSSProperties}
    >
      <p className="text-[12px] font-bold text-[#f4b65f]">오늘의 리딩</p>
      <p className={cn("mt-2 text-[15px] font-bold leading-6 text-[#ffe7b5]", ui.textGlow)}>
        오늘의 리딩을 완성하고 있어요
      </p>
      <p className="mt-2 text-[13px] leading-6 text-[#fff3d7]/82">
        선택한 카드와 방향을 기준으로 오늘의 흐름을 읽고 있어요.
      </p>
      <div className="mt-4 space-y-2" aria-hidden="true">
        <span className="block h-2.5 w-11/12 rounded-full bg-[#f2c27d]/18 animate-pulse" />
        <span className="block h-2.5 w-8/12 rounded-full bg-[#d9b6ff]/14 animate-pulse" />
      </div>
    </div>
  );
}

function DailyTarotResultDisclaimer({ enterDelay = "520ms" }: { enterDelay?: string }) {
  return (
    <p
      className="tarot-result-content-enter mt-4 text-center text-[12px] leading-5 text-[#c7a98a]"
      style={{ "--tarot-result-enter-delay": enterDelay } as CSSProperties}
    >
      타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.
    </p>
  );
}

export function DailyTarotPendingResult({ selections }: { selections: DailyTarotCardSelection[] }) {
  const [zoomedSelection, setZoomedSelection] = useState<DailyTarotCardSelection | null>(null);
  const cards = resolveDailyTarotResultSelections(selections);

  return (
    <section
      data-daily-tarot-state="generating-result"
      className="mx-auto w-full max-w-[28rem] px-4 py-5 text-[#fff3d7]"
    >
      <DailyTarotResultCardGrid cards={cards} onZoom={setZoomedSelection} />
      <DailyTarotFixedGuidanceSection selections={cards} />
      <DailyTarotReadingLoadingSection enterDelay="260ms" />

      {zoomedSelection ? (
        <TarotCardZoomDialog onClose={() => setZoomedSelection(null)} selection={zoomedSelection} />
      ) : null}
    </section>
  );
}

function DailyTarotResult({
  reading,
  onSelectThreeCard,
}: {
  reading: DailyTarotReading;
  onSelectThreeCard?: () => void;
}) {
  const [zoomedSelection, setZoomedSelection] = useState<DailyTarotCardSelection | null>(null);
  const cards = resolveDailyTarotResultSelections(
    reading.cards ?? [{ position: reading.position, card: reading.card, orientation: reading.orientation }],
  );
  const generated = reading.generated;
  const cardReadings =
    reading.spread === "daily_three_card"
      ? generated?.cardReadings.map((cardReading) => ({
          ...cardReading,
          heading: cleanTarotDisplayText(cardReading.heading),
          reading: cleanTarotDisplayText(cardReading.reading),
        }))
      : [];
  const keywords = cleanUniqueTarotDisplayTexts(
    generated?.keywords && generated.keywords.length > 0 ? generated.keywords : reading.keywords,
    5,
  );

  function handleDownload() {
    const svg = createTarotReadingSvg(reading);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = createTarotReadingFileName(reading);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const text = createTarotReadingShareText(reading);

    if (navigator.share) {
      await navigator.share({
        title: "오늘의 타로",
        text,
      });
      return;
    }

    await navigator.clipboard?.writeText(text);
  }

  return (
    <section
      data-daily-tarot-state="result"
      className="mx-auto w-full max-w-[28rem] px-4 py-5 text-[#fff3d7]"
    >
      <DailyTarotResultCardGrid cards={cards} onZoom={setZoomedSelection} />

      <div
        data-daily-tarot-result-copy="true"
        className="tarot-result-content-enter mt-5 space-y-3 rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/54 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.22)]"
        style={{ "--tarot-result-enter-delay": "220ms" } as CSSProperties}
      >
        <p className="text-[12px] font-bold text-[#f4b65f]">오늘의 리딩</p>
        <p className="text-[15px] font-bold leading-6 text-[#ffe7b5]">{dailyTarotDisplayTitle}</p>
        {keywords.length > 0 ? (
          <div data-daily-tarot-keywords="true" className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-[#f2c27d]/32 bg-[#f2c27d]/8 px-2.5 py-1 text-[11px] font-bold text-[#f5c978]"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-[14px] leading-6 text-[#fff3d7]/88">{cleanTarotDisplayText(reading.message)}</p>
        {cardReadings?.map((cardReading) => (
          <div key={cardReading.position} className="border-t border-[#b98255]/25 pt-3 text-left">
            <p className="text-[12px] font-bold text-[#f4b65f]">{cardReading.heading}</p>
            <p className="mt-1 text-[13px] leading-6 text-[#fff3d7]/88">{cardReading.reading}</p>
          </div>
        ))}
      </div>

      <DailyTarotFixedGuidanceSection enterDelay="320ms" selections={cards} showKeywords={false} />

      <div
        className="tarot-result-content-enter mt-4 grid grid-cols-2 gap-3"
        data-daily-tarot-result-actions="true"
        style={{ "--tarot-result-enter-delay": "420ms" } as CSSProperties}
      >
        <AssetTextButton
          frame={manyangAssets.buttons.compactPrimary}
          iconSrc={manyangAssets.actionIcons.download}
          onClick={handleDownload}
          contentClassName="min-h-[3.45rem] px-2.5 text-[14px]"
          iconClassName="h-6 w-6"
        >
          저장하기
        </AssetTextButton>
        <AssetTextButton
          frame={manyangAssets.buttons.compactPrimary}
          iconSrc={manyangAssets.actionIcons.share}
          onClick={() => void handleShare()}
          contentClassName="min-h-[3.45rem] px-2.5 text-[14px]"
          iconClassName="h-6 w-6"
        >
          공유하기
        </AssetTextButton>
      </div>

      {reading.spread === "daily_one_card" && onSelectThreeCard ? (
        <button
          type="button"
          onClick={onSelectThreeCard}
          className="tarot-result-content-enter mx-auto mt-4 flex items-center justify-center gap-2 rounded-full border border-[#f2c27d]/55 bg-[#05040b]/54 px-5 py-2.5 text-[13px] font-bold text-[#f2c27d] shadow-[0_10px_24px_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          style={{ "--tarot-result-enter-delay": "520ms" } as CSSProperties}
        >
          3장 리딩
          <TarotThreeCardAccessTag />
        </button>
      ) : null}

      <DailyTarotResultDisclaimer enterDelay="620ms" />

      {zoomedSelection ? (
        <TarotCardZoomDialog onClose={() => setZoomedSelection(null)} selection={zoomedSelection} />
      ) : null}
    </section>
  );
}

function SpreadSelector({
  selectedSpread,
  onSelect,
}: {
  selectedSpread: TarotSpread;
  onSelect: (spread: TarotSpread) => void;
}) {
  return (
    <div className="mx-auto mt-4 grid max-w-[24rem] grid-cols-2 gap-2 rounded-[1rem] border border-[#b98255]/30 bg-[#05040b]/45 p-1.5">
      <button
        type="button"
        onClick={() => onSelect("daily_one_card")}
        className={cn(
          "rounded-[0.75rem] px-3 py-2 text-[12px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
          selectedSpread === "daily_one_card"
            ? "bg-[#f2c27d] text-[#150b18]"
            : "text-[#f2c27d] hover:bg-[#140d24]/80",
        )}
      >
        오늘의 한 장
      </button>
      <button
        type="button"
        onClick={() => onSelect("daily_three_card")}
        className={cn(
          "rounded-[0.75rem] px-3 py-2 text-[12px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
          selectedSpread === "daily_three_card"
            ? "bg-[#f2c27d] text-[#150b18]"
            : "text-[#f2c27d] hover:bg-[#140d24]/80",
        )}
      >
        <span className="flex items-center justify-center gap-2">
          <span>3장 리딩</span>
          <TarotThreeCardAccessTag active={selectedSpread === "daily_three_card"} />
        </span>
      </button>
    </div>
  );
}

function createGenerationRequestBody(
  appDate: string,
  spread: TarotSpread,
  selectedAt: string,
  selections: DailyTarotCardSelection[],
) {
  return {
    appDate,
    spread,
    selectedAt,
    selections: selections.map((selection) => ({
      cardId: selection.card.id,
      orientation: selection.orientation,
      position: selection.position,
    })),
  };
}

function createGenerationRequestKey(
  appDate: string,
  spread: TarotSpread,
  drawIdentityKey: string,
  selections: DailyTarotCardSelection[],
): string {
  const selectionKey = selections
    .map((selection) => `${selection.position}:${selection.card.id}:${selection.orientation}`)
    .join("|");

  return `${appDate}:${drawIdentityKey}:${spread}:${selectionKey}`;
}

export function DailyTarotClient({
  appDate,
  ignoreStoredReading = false,
  initialReading,
  initialUserId = null,
}: DailyTarotClientProps) {
  const [drawIdentityKey, setDrawIdentityKey] = useState(() => createInitialDailyTarotDrawIdentityKey(initialUserId));
  const options = useMemo(() => createDailyTarotOptions(appDate, { drawIdentityKey }), [appDate, drawIdentityKey]);
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread>(() =>
    !ignoreStoredReading && isCompletedLlmReading(initialReading) ? initialReading.spread : "daily_one_card",
  );
  const [selectedReading, setSelectedReading] = useState<DailyTarotReading | null>(
    !ignoreStoredReading && isCompletedLlmReading(initialReading) ? initialReading : null,
  );
  const [openedReadingRequestKey, setOpenedReadingRequestKey] = useState<string | null>(null);
  const [pendingSelections, setPendingSelections] = useState<DailyTarotCardSelection[]>([]);
  const [revealingState, setRevealingState] = useState<DailyTarotRevealState | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRequestStatusRef = useRef<GenerationRequestStatus>("idle");
  const generationRequestKeyRef = useRef<string | null>(null);
  const accessState = useAccessPlan();
  const canUseThreeCard = canUseTarotThreeCardReading({
    accessPlan: accessState.accessPlan,
    bypassAccessGate: accessState.bypassAccessGate,
    isAdmin: accessState.role === "admin",
  });
  const positions = spreadPositions[selectedSpread];
  const preparedSelections = useMemo(
    () => createPreparedDailyTarotSelections(options, positions),
    [options, positions],
  );
  const storedReading = useSyncExternalStore(
    subscribeToDailyTarot,
    () => (ignoreStoredReading ? null : getStableDailyTarotReadingSnapshot(appDate, selectedSpread, drawIdentityKey)),
    () => (!ignoreStoredReading && isCompletedLlmReading(initialReading) ? initialReading : null),
  );
  const storedReadingForDate =
    !ignoreStoredReading &&
    isCompletedLlmReading(storedReading) &&
    storedReading.appDate === appDate &&
    storedReading.spread === selectedSpread &&
    isMatchingDailyTarotDrawIdentity(storedReading, drawIdentityKey)
      ? storedReading
      : null;
  const selectedReadingForDate =
    isCompletedLlmReading(selectedReading) &&
    selectedReading.appDate === appDate &&
    selectedReading.spread === selectedSpread &&
    isMatchingDailyTarotDrawIdentity(selectedReading, drawIdentityKey)
      ? selectedReading
      : null;
  const selectedReadingRequestKey = selectedReadingForDate?.cards
    ? createGenerationRequestKey(appDate, selectedReadingForDate.spread, drawIdentityKey, selectedReadingForDate.cards)
    : null;
  const openedSelectedReadingForDate =
    selectedReadingForDate && selectedReadingRequestKey === openedReadingRequestKey ? selectedReadingForDate : null;
  const initialReadingForDate =
    !ignoreStoredReading &&
    isCompletedLlmReading(initialReading) &&
    initialReading.appDate === appDate &&
    initialReading.spread === selectedSpread &&
    isMatchingDailyTarotDrawIdentity(initialReading, drawIdentityKey)
      ? initialReading
      : null;
  const reading = ignoreStoredReading
    ? openedSelectedReadingForDate
    : (storedReadingForDate ?? openedSelectedReadingForDate ?? initialReadingForDate);
  const selectedCardIds = new Set(pendingSelections.map((selection) => selection.card.id));
  const availableOptions = options.filter((option) => !selectedCardIds.has(option.cardId));
  const nextPosition = positions[pendingSelections.length] ?? positions[positions.length - 1];
  const isGenerating = generationStatus === "generating";
  const isRevealing = Boolean(revealingState) || generationStatus === "revealing";
  const isBusy = isGenerating || isRevealing;
  const isDrawIdentityPending = drawIdentityKey === pendingDailyTarotDrawIdentityKey;
  const shouldShowShuffleIntro = pendingSelections.length === 0 && generationStatus === "idle";
  const preparedRequestKey = createGenerationRequestKey(appDate, selectedSpread, drawIdentityKey, preparedSelections);
  const drawStageInstruction =
    pendingSelections.length === 0
      ? initialDrawInstruction
      : selectedSpread === "daily_three_card"
        ? `${positionLabels[nextPosition]} 카드를 골라 주세요.`
        : initialDrawInstruction;

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function resolveDrawIdentity() {
      if (initialUserId) {
        setDrawIdentityKey(createDailyTarotUserIdentityKey(initialUserId));
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const sessionUserId = data.session?.user?.id;
        const nextIdentityKey = sessionUserId
          ? createDailyTarotUserIdentityKey(sessionUserId)
          : getOrCreateDailyTarotGuestIdentityFromBrowser();

        if (isMounted) {
          setDrawIdentityKey(nextIdentityKey);
        }
      } catch {
        if (isMounted) {
          setDrawIdentityKey(getOrCreateDailyTarotGuestIdentityFromBrowser());
        }
      }
    }

    void resolveDrawIdentity();

    return () => {
      isMounted = false;
    };
  }, [initialUserId]);

  function clearRevealTimer() {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }

  function resetDrawState(nextSpread: TarotSpread) {
    clearRevealTimer();
    generationRequestStatusRef.current = "idle";
    generationRequestKeyRef.current = null;
    setOpenedReadingRequestKey(null);
    setSelectedSpread(nextSpread);
    setPendingSelections([]);
    setRevealingState(null);
    setGenerationStatus("idle");
    setGenerationError(null);
  }

  const submitSelections = useCallback(async function submitSelections(
    selections: DailyTarotCardSelection[],
    {
      showLoadingImmediately = true,
      updatePendingSelections = true,
      requestSpread = selectedSpread,
      requestKey = createGenerationRequestKey(appDate, requestSpread, drawIdentityKey, selections),
    }: SubmitSelectionsOptions = {},
  ) {
    const selectedAt = new Date().toISOString();

    generationRequestKeyRef.current = requestKey;
    generationRequestStatusRef.current = "pending";
    if (updatePendingSelections) {
      setPendingSelections(selections);
    }
    if (showLoadingImmediately) {
      setRevealingState(null);
      setGenerationStatus("generating");
    }
    setGenerationError(null);

    try {
      const response = await fetch("/api/tarot/readings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(createGenerationRequestBody(appDate, requestSpread, selectedAt, selections)),
      });

      if (generationRequestKeyRef.current !== requestKey) {
        return;
      }

      if (!response.ok) {
        throw new Error("tarot reading unavailable");
      }

      const readingBody = (await response.json()) as DailyTarotReading;

      if (!isCompletedLlmReading(readingBody)) {
        throw new Error("tarot reading unavailable");
      }

      const readingForCurrentIdentity = { ...readingBody, drawIdentityKey };

      generationRequestStatusRef.current = "resolved";
      setSelectedReading(readingForCurrentIdentity);
      saveDailyTarotReadingToBrowser(readingForCurrentIdentity);
      setGenerationStatus((currentStatus) => (currentStatus === "generating" ? "idle" : currentStatus));
    } catch {
      if (generationRequestKeyRef.current !== requestKey) {
        return;
      }

      generationRequestStatusRef.current = "rejected";
      setGenerationStatus((currentStatus) =>
        currentStatus === "revealing" ? currentStatus : currentStatus === "generating" ? "error" : currentStatus,
      );
      setGenerationError("해석을 완성하지 못했어요. 선택한 카드는 그대로 남아 있어요.");
    }
  }, [appDate, drawIdentityKey, selectedSpread]);

  useEffect(() => {
    if (
      isDrawIdentityPending ||
      reading ||
      preparedSelections.length !== positions.length ||
      (selectedSpread === "daily_three_card" && !canUseThreeCard)
    ) {
      return;
    }

    if (generationRequestKeyRef.current === preparedRequestKey && generationRequestStatusRef.current !== "idle") {
      return;
    }

    void submitSelections(preparedSelections, {
      showLoadingImmediately: false,
      updatePendingSelections: false,
      requestSpread: selectedSpread,
      requestKey: preparedRequestKey,
    });
  }, [
    canUseThreeCard,
    isDrawIdentityPending,
    positions.length,
    preparedRequestKey,
    preparedSelections,
    reading,
    selectedSpread,
    submitSelections,
  ]);

  function handleSelect(option: DailyTarotOption, optionIndex: number) {
    if (isBusy || isDrawIdentityPending || (selectedSpread === "daily_three_card" && !canUseThreeCard)) {
      return;
    }

    const selectedPreparedSelection = preparedSelections[pendingSelections.length];
    const fallbackCard = getTarotMajorCardById(option.cardId);
    const nextSelection = selectedPreparedSelection ??
      (fallbackCard
        ? {
            position: nextPosition,
            card: fallbackCard,
            orientation: option.orientation,
          }
        : null);

    if (!nextSelection) {
      return;
    }

    const nextSelections = [...pendingSelections, nextSelection];

    clearRevealTimer();
    setRevealingState({
      options: availableOptions,
      selectedOptionId: option.id,
      selectedOptionIndex: optionIndex,
      selection: nextSelection,
    });
    setGenerationStatus("revealing");
    setGenerationError(null);

    if (nextSelections.length === positions.length) {
      setPendingSelections(nextSelections);
      setOpenedReadingRequestKey(preparedRequestKey);

      if (generationRequestKeyRef.current !== preparedRequestKey || generationRequestStatusRef.current === "idle") {
        void submitSelections(nextSelections, {
          showLoadingImmediately: false,
          updatePendingSelections: false,
          requestSpread: selectedSpread,
          requestKey: preparedRequestKey,
        });
      }
    }

    revealTimerRef.current = setTimeout(() => {
      revealTimerRef.current = null;
      setRevealingState(null);

      if (nextSelections.length < positions.length) {
        setPendingSelections(nextSelections);
        setGenerationStatus("idle");
        return;
      }

      if (generationRequestStatusRef.current === "resolved") {
        setGenerationStatus("idle");
        return;
      }

      if (generationRequestStatusRef.current === "rejected") {
        setGenerationStatus("error");
        return;
      }

      setGenerationStatus("generating");
    }, tarotCardRevealMs);
  }

  function handleRetry() {
    if (pendingSelections.length === positions.length) {
      void submitSelections(pendingSelections);
    }
  }

  if (reading && !isRevealing && !isGenerating) {
    return <DailyTarotResult reading={reading} onSelectThreeCard={() => resetDrawState("daily_three_card")} />;
  }

  if (isGenerating && pendingSelections.length === positions.length) {
    return <DailyTarotPendingResult selections={pendingSelections} />;
  }

  return (
    <section
      data-daily-tarot-state={
        isRevealing ? "revealing" : isGenerating ? "generating" : "draw-ready"
      }
      className="mx-auto w-full max-w-[30rem] px-4 py-5 text-center text-[#fff3d7]"
    >
      <div className="mx-auto max-w-[22rem]">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#f4b65f]">{appDate}</p>
        <p className={cn("mt-2 text-[15px] font-semibold leading-6 text-[#ffe7b5]", ui.textGlow)}>
          {initialDrawInstruction}
        </p>
      </div>

      <SpreadSelector selectedSpread={selectedSpread} onSelect={resetDrawState} />

      {selectedSpread === "daily_three_card" && !canUseThreeCard ? (
        <div className="mx-auto mt-5 max-w-[22rem] rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/56 p-4 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
          <p className="text-[13px] font-bold text-[#ffe7b5]">Moon Pass에서 3장 리딩이 열려요.</p>
          <p className="mt-2 text-[12px] leading-5 text-[#c7a98a]">
            지금의 상태, 이어지는 흐름, 오늘의 조언을 세 장으로 나눠 읽습니다.
          </p>
        </div>
      ) : isRevealing && revealingState ? (
        <DailyTarotRevealPanel {...revealingState} />
      ) : isGenerating ? (
        <DailyTarotLoadingPanel selections={pendingSelections} />
      ) : (
        <div
          data-daily-tarot-draw-stage="true"
          className={cn("relative mt-4 min-h-[25rem]", shouldShowShuffleIntro ? "tarot-draw-stage-shuffling" : "")}
        >
          <p className="text-[12px] font-semibold text-[#f2c27d]">
            {drawStageInstruction}
          </p>
          <DailyTarotFanDeck options={availableOptions} onSelect={handleSelect} disabled={isBusy || isDrawIdentityPending} />
          {shouldShowShuffleIntro ? <DailyTarotShuffleIntro /> : null}
        </div>
      )}

      {generationStatus === "error" && generationError ? (
        <div className="mx-auto mt-4 max-w-[21rem] rounded-[1rem] border border-[#b98255]/30 bg-[#05040b]/54 p-3 text-[13px] leading-6 text-[#ffe7b5]">
          <p>{generationError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-full border border-[#f2c27d]/55 px-4 py-2 text-[12px] font-bold text-[#f2c27d] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            같은 카드로 다시 해석하기
          </button>
        </div>
      ) : null}
    </section>
  );
}
