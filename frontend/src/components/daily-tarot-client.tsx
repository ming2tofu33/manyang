"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import {
  createDailyTarotOptions,
  dailyTarotStorageKey,
  getDailyTarotReadingFromBrowser,
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
import { getTarotMajorCardById } from "@/lib/tarot-major-cards";
import { useAccessPlan } from "@/lib/use-access-plan";

type DailyTarotClientProps = {
  appDate: string;
  initialReading: DailyTarotReading | null;
};

type DailyTarotSnapshotCache = {
  appDate: string;
  spread: TarotSpread;
  reading: DailyTarotReading | null;
  storageValue: string | null;
};

type GenerationStatus = "idle" | "generating" | "error";

let dailyTarotSnapshotCache: DailyTarotSnapshotCache | null = null;

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
  situation: "상황",
  flow: "흐름",
  advice: "조언",
} satisfies Record<DailyTarotPosition, string>;

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
): DailyTarotReading | null {
  const storageValue = getDailyTarotStorageValueFromBrowser();

  if (
    dailyTarotSnapshotCache?.appDate === appDate &&
    dailyTarotSnapshotCache.spread === spread &&
    dailyTarotSnapshotCache.storageValue === storageValue
  ) {
    return dailyTarotSnapshotCache.reading;
  }

  const reading = getDailyTarotReadingFromBrowser(appDate, spread);
  dailyTarotSnapshotCache = { appDate, spread, reading, storageValue };

  return reading;
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

function DailyTarotFanDeck({
  options,
  onSelect,
  disabled,
}: {
  options: DailyTarotOption[];
  onSelect: (option: DailyTarotOption) => void;
  disabled?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(options.length / 2));
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const dragDistanceRef = useRef(0);
  const removeWindowDragListenersRef = useRef<(() => void) | null>(null);
  const isDragging = dragStartX !== null;
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, options.length - 1));

  useEffect(() => {
    return () => removeWindowDragListenersRef.current?.();
  }, []);

  function moveDeckBy(delta: number) {
    if (disabled || options.length === 0) {
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
    if (disabled) {
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
    if (disabled) {
      return;
    }

    if (dragDistanceRef.current > 10) {
      dragDistanceRef.current = 0;
      return;
    }

    if (index === safeActiveIndex) {
      onSelect(option);
      return;
    }

    setActiveIndex(index);
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div data-daily-tarot-deck className="mt-5">
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
          const opacity = absoluteOffset > 2 ? 0.72 : 1;

          return (
            <button
              key={option.id}
              type="button"
              data-daily-tarot-option={option.id}
              data-daily-tarot-active={isActive ? "true" : "false"}
              aria-label={
                isActive
                  ? `${orientationLabel} 중앙 카드 ${index + 1} / ${options.length} 뽑기`
                  : `${orientationLabel} 카드 ${index + 1} / ${options.length}로 이동`
              }
              disabled={disabled}
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

      <div className="mx-auto -mt-3 flex max-w-[15rem] items-center justify-center gap-3">
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

export function DailyTarotLoadingPanel({ selections }: { selections: DailyTarotCardSelection[] }) {
  const selectedCards = selections.slice(0, 3);

  return (
    <div
      data-daily-tarot-loading="true"
      role="status"
      aria-live="polite"
      className="mx-auto mt-5 max-w-[22rem] rounded-[1.1rem] border border-[#b98255]/38 bg-[#05040b]/62 px-4 py-5 text-center shadow-[0_18px_42px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10"
    >
      <div className="mx-auto flex min-h-[10rem] items-center justify-center">
        <div className="relative h-[9.5rem] w-[13rem]">
          <span className="absolute left-1/2 top-1/2 h-[8.6rem] w-[8.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f2c27d]/24 bg-[#f2c27d]/8 blur-[0.2px]" />
          {selectedCards.length > 0 ? (
            selectedCards.map((selection, index) => {
              const offset = index - (selectedCards.length - 1) / 2;

              return (
                <span
                  key={`${selection.position}-${selection.card.id}`}
                  className="absolute left-1/2 top-1/2 block h-[8.8rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 animate-pulse drop-shadow-[0_16px_28px_rgba(0,0,0,0.34)]"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    transform: `translate(-50%, -50%) translateX(${offset * 44}px) rotate(${offset * 7}deg)`,
                    zIndex: 10 + index,
                  }}
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
            <span className="absolute left-1/2 top-1/2 block h-[8.8rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 animate-pulse drop-shadow-[0_16px_28px_rgba(0,0,0,0.34)]">
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

  return (
    <div className="w-full text-center" data-daily-tarot-result-card-size={cardSize}>
      <div className={cn("mx-auto w-full", imageMaxWidth)}>
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
      </div>
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
          className="h-full max-h-[76vh] w-full overflow-auto rounded-[0.75rem] bg-[#05040b]/36 p-2"
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
          style={{ touchAction: "pan-x pan-y" }}
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

function DailyTarotResult({
  reading,
  onSelectThreeCard,
}: {
  reading: DailyTarotReading;
  onSelectThreeCard?: () => void;
}) {
  const [zoomedSelection, setZoomedSelection] = useState<DailyTarotCardSelection | null>(null);
  const cards = reading.cards ?? [{ position: reading.position, card: reading.card, orientation: reading.orientation }];
  const generated = reading.generated;
  const cardReadings = generated?.cardReadings.map((cardReading) => ({
    ...cardReading,
    heading: cleanTarotDisplayText(cardReading.heading),
    reading: cleanTarotDisplayText(cardReading.reading),
  }));

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
      <div className={cn("grid gap-4", cards.length > 1 ? "grid-cols-3 items-start" : "justify-items-center")}>
        {cards.map((selection) => (
          <DailyTarotResultCard
            key={`${selection.position}-${selection.card.id}`}
            compact={cards.length > 1}
            onZoom={setZoomedSelection}
            selection={selection}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3 rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/54 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
        <p className="text-[15px] font-bold leading-6 text-[#ffe7b5]">{cleanTarotDisplayText(reading.title)}</p>
        <p className="text-[14px] leading-6 text-[#fff3d7]/88">{cleanTarotDisplayText(reading.message)}</p>
        {cardReadings?.map((cardReading) => (
          <div key={cardReading.position} className="border-t border-[#b98255]/25 pt-3 text-left">
            <p className="text-[12px] font-bold text-[#f4b65f]">{cardReading.heading}</p>
            <p className="mt-1 text-[13px] leading-6 text-[#fff3d7]/88">{cardReading.reading}</p>
          </div>
        ))}
        <p className="border-t border-[#b98255]/25 pt-3 text-[13px] leading-6 text-[#f2c27d]">
          {cleanTarotDisplayText(reading.advice)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3" data-daily-tarot-result-actions="true">
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
          className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-full border border-[#f2c27d]/55 bg-[#05040b]/54 px-5 py-2.5 text-[13px] font-bold text-[#f2c27d] shadow-[0_10px_24px_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
        >
          3장 리딩
          <MoonPassTag />
        </button>
      ) : null}

      <p className="mt-4 text-center text-[12px] leading-5 text-[#c7a98a]">
        타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.
      </p>

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
          <MoonPassTag active={selectedSpread === "daily_three_card"} />
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

export function DailyTarotClient({ appDate, initialReading }: DailyTarotClientProps) {
  const options = useMemo(() => createDailyTarotOptions(appDate), [appDate]);
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread>("daily_one_card");
  const [selectedReading, setSelectedReading] = useState<DailyTarotReading | null>(
    isCompletedLlmReading(initialReading) ? initialReading : null,
  );
  const [pendingSelections, setPendingSelections] = useState<DailyTarotCardSelection[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const accessState = useAccessPlan();
  const canUseThreeCard = accessState.bypassAccessGate || accessState.accessPlan === "moon_pass";
  const positions = spreadPositions[selectedSpread];
  const storedReading = useSyncExternalStore(
    subscribeToDailyTarot,
    () => getStableDailyTarotReadingSnapshot(appDate, selectedSpread),
    () => (isCompletedLlmReading(initialReading) ? initialReading : null),
  );
  const storedReadingForDate =
    isCompletedLlmReading(storedReading) && storedReading.appDate === appDate && storedReading.spread === selectedSpread
      ? storedReading
      : null;
  const selectedReadingForDate =
    isCompletedLlmReading(selectedReading) && selectedReading.appDate === appDate && selectedReading.spread === selectedSpread
      ? selectedReading
      : null;
  const initialReadingForDate =
    isCompletedLlmReading(initialReading) && initialReading.appDate === appDate && initialReading.spread === selectedSpread
      ? initialReading
      : null;
  const reading = storedReadingForDate ?? selectedReadingForDate ?? initialReadingForDate;
  const selectedCardIds = new Set(pendingSelections.map((selection) => selection.card.id));
  const availableOptions = options.filter((option) => !selectedCardIds.has(option.cardId));
  const nextPosition = positions[pendingSelections.length] ?? positions[positions.length - 1];
  const isGenerating = generationStatus === "generating";

  function resetDrawState(nextSpread: TarotSpread) {
    setSelectedSpread(nextSpread);
    setPendingSelections([]);
    setGenerationStatus("idle");
    setGenerationError(null);
  }

  async function submitSelections(selections: DailyTarotCardSelection[]) {
    const selectedAt = new Date().toISOString();

    setPendingSelections(selections);
    setGenerationStatus("generating");
    setGenerationError(null);

    try {
      const response = await fetch("/api/tarot/readings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(createGenerationRequestBody(appDate, selectedSpread, selectedAt, selections)),
      });

      if (!response.ok) {
        throw new Error("tarot reading unavailable");
      }

      const readingBody = (await response.json()) as DailyTarotReading;

      if (!isCompletedLlmReading(readingBody)) {
        throw new Error("tarot reading unavailable");
      }

      setSelectedReading(readingBody);
      saveDailyTarotReadingToBrowser(readingBody);
      setPendingSelections([]);
      setGenerationStatus("idle");
    } catch {
      setGenerationStatus("error");
      setGenerationError("해석을 완성하지 못했어요. 선택한 카드는 그대로 남아 있어요.");
    }
  }

  function handleSelect(option: DailyTarotOption) {
    if (isGenerating || (selectedSpread === "daily_three_card" && !canUseThreeCard)) {
      return;
    }

    const card = getTarotMajorCardById(option.cardId);

    if (!card) {
      return;
    }

    const nextSelections = [
      ...pendingSelections,
      {
        position: nextPosition,
        card,
        orientation: option.orientation,
      },
    ];

    if (nextSelections.length < positions.length) {
      setPendingSelections(nextSelections);
      setGenerationError(null);
      return;
    }

    void submitSelections(nextSelections);
  }

  function handleRetry() {
    if (pendingSelections.length === positions.length) {
      void submitSelections(pendingSelections);
    }
  }

  if (reading) {
    return <DailyTarotResult reading={reading} onSelectThreeCard={() => resetDrawState("daily_three_card")} />;
  }

  return (
    <section
      data-daily-tarot-state={isGenerating ? "generating" : "draw-ready"}
      className="mx-auto w-full max-w-[30rem] px-4 py-5 text-center text-[#fff3d7]"
    >
      <div className="mx-auto max-w-[22rem]">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#f4b65f]">{appDate}</p>
        <p className={cn("mt-2 text-[15px] font-semibold leading-6 text-[#ffe7b5]", ui.textGlow)}>
          마음이 닿는 뒷면을 골라 오늘의 흐름을 확인해 보세요.
        </p>
      </div>

      <SpreadSelector selectedSpread={selectedSpread} onSelect={resetDrawState} />

      {selectedSpread === "daily_three_card" && !canUseThreeCard ? (
        <div className="mx-auto mt-5 max-w-[22rem] rounded-[1rem] border border-[#b98255]/35 bg-[#05040b]/56 p-4 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
          <p className="text-[13px] font-bold text-[#ffe7b5]">Moon Pass에서 3장 리딩이 열려요.</p>
          <p className="mt-2 text-[12px] leading-5 text-[#c7a98a]">
            지금 상태, 이어질 변화, 오늘의 선택을 세 장으로 나눠 읽습니다.
          </p>
        </div>
      ) : isGenerating ? (
        <DailyTarotLoadingPanel selections={pendingSelections} />
      ) : (
        <>
          <p className="mt-4 text-[12px] font-semibold text-[#f2c27d]">
            {selectedSpread === "daily_three_card"
              ? `${positionLabels[nextPosition]} 카드를 골라 주세요.`
              : "중앙 카드를 골라 주세요."}
          </p>
          <DailyTarotFanDeck options={availableOptions} onSelect={handleSelect} disabled={isGenerating} />
        </>
      )}

      {generationError ? (
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

      <p className="mx-auto mt-4 max-w-[21rem] text-[12px] leading-5 text-[#c7a98a]">
        타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.
      </p>
    </section>
  );
}
