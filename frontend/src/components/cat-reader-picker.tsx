"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { catReaderPickerSheetCopy, getCatReaderHomeCopy } from "@/lib/cat-reader-home-copy";
import { catReaders, getCatReaderById, type CatReader, type CatReaderId } from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";

type CatReaderPickerProps = {
  value: CatReaderId;
  onChange: (readerId: CatReaderId) => void;
  variant?: "home" | "compact";
  className?: string;
  heading?: string;
};

function getReaderImage(reader: CatReader): string {
  return manyangAssets.illustrations[reader.assetKey];
}

export const homeCatSelectionFeedbackMs = 220;
export const homeCatBackgroundChangeDelayMs = 280;

export function CatReaderPicker({ value, onChange, variant = "home", className, heading }: CatReaderPickerProps) {
  const selectedReader = getCatReaderById(value);
  const selectedReaderCopy = getCatReaderHomeCopy(selectedReader.id);
  const isCompact = variant === "compact";
  const [isHomeSheetOpen, setIsHomeSheetOpen] = useState(false);
  const [pendingReaderId, setPendingReaderId] = useState<CatReaderId | null>(null);
  const closeDelayTimeoutRef = useRef<number | null>(null);
  const backgroundChangeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeDelayTimeoutRef.current !== null) {
        window.clearTimeout(closeDelayTimeoutRef.current);
      }
      if (backgroundChangeTimeoutRef.current !== null) {
        window.clearTimeout(backgroundChangeTimeoutRef.current);
      }
    };
  }, []);

  function closeHomeSheet() {
    if (closeDelayTimeoutRef.current !== null) {
      window.clearTimeout(closeDelayTimeoutRef.current);
      closeDelayTimeoutRef.current = null;
    }
    if (backgroundChangeTimeoutRef.current !== null) {
      window.clearTimeout(backgroundChangeTimeoutRef.current);
      backgroundChangeTimeoutRef.current = null;
    }

    setPendingReaderId(null);
    setIsHomeSheetOpen(false);
  }

  function selectHomeReader(readerId: CatReaderId) {
    if (closeDelayTimeoutRef.current !== null) {
      window.clearTimeout(closeDelayTimeoutRef.current);
    }
    if (backgroundChangeTimeoutRef.current !== null) {
      window.clearTimeout(backgroundChangeTimeoutRef.current);
    }

    setPendingReaderId(readerId);
    closeDelayTimeoutRef.current = window.setTimeout(() => {
      setIsHomeSheetOpen(false);
      closeDelayTimeoutRef.current = null;
    }, homeCatSelectionFeedbackMs);

    backgroundChangeTimeoutRef.current = window.setTimeout(() => {
      onChange(readerId);
      setPendingReaderId(null);
      backgroundChangeTimeoutRef.current = null;
    }, homeCatBackgroundChangeDelayMs);
  }

  if (!isCompact) {
    return (
      <section className={cn("relative", className)} aria-label="고양이 테마 선택">
        <button
          type="button"
          onClick={() => setIsHomeSheetOpen(true)}
          className="home-cat-picker-trigger group flex min-h-[4rem] w-full cursor-pointer items-center gap-2.5 rounded-[1.35rem] border border-[#7c4a38]/54 bg-[rgba(6,5,14,0.54)] px-2.5 py-2 text-left shadow-[0_0_18px_rgba(0,0,0,0.2)] ring-1 ring-[#d799ff]/10 backdrop-blur-md transition hover:border-[#d799ff]/58 hover:bg-[rgba(14,9,28,0.7)] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          aria-haspopup="dialog"
          aria-expanded={isHomeSheetOpen}
        >
          <span className="relative h-12 w-12 shrink-0">
            <Image
              src={getReaderImage(selectedReader)}
              alt=""
              fill
              sizes="48px"
              unoptimized
              className="scale-110 object-contain transition group-hover:scale-125"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="block text-[10px] font-semibold leading-none text-[#f0bc7d]">오늘의 테마</span>
              <span className="shrink-0 rounded-full border border-[#b98255]/35 bg-[#1b1028]/70 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#f0bc7d]">
                {selectedReaderCopy.tag}
              </span>
              {selectedReader.lockedLabel ? (
                <span className="shrink-0 rounded-full border border-[#d799ff]/35 bg-[#241036]/70 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#e7b3ff]">
                  Moon Pass
                </span>
              ) : null}
            </span>
            <span className="mt-1 block truncate text-[0.94rem] font-semibold leading-tight text-[#ffd98a]">
              {selectedReader.name} 테마로 남겨요
            </span>
            <span className="mt-0.5 block truncate text-[11px] leading-4 text-[#fff3d7]/72">
              {selectedReaderCopy.line}
            </span>
          </span>
          <span className="shrink-0 rounded-full border border-[#b98255]/45 px-2 py-1 text-[10px] font-semibold leading-none text-[#f4b65f]">
            바꾸기
          </span>
        </button>

        {isHomeSheetOpen ? (
          <>
            <button
              type="button"
              aria-label="고양이 선택 닫기"
              className="fixed inset-0 z-40 cursor-default bg-black/38 backdrop-blur-[1px]"
              onClick={closeHomeSheet}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="고양이 테마 선택"
              className="fixed bottom-[5.3rem] left-1/2 z-50 w-[min(390px,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.45rem] border border-[#7c4a38]/66 bg-[linear-gradient(180deg,rgba(18,12,34,0.96),rgba(6,5,14,0.96))] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.56)] ring-1 ring-[#d799ff]/16 backdrop-blur-xl"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <div>
                  <p className="text-[12px] font-semibold text-[#f0bc7d]">{catReaderPickerSheetCopy.eyebrow}</p>
                  <h2 className="text-[1.06rem] font-semibold text-[#ffd98a]">{catReaderPickerSheetCopy.title}</h2>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#fff3d7]/66">
                    {catReaderPickerSheetCopy.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeHomeSheet}
                  className="rounded-full border border-[#b98255]/45 px-3 py-1.5 text-[12px] font-semibold text-[#f4b65f] transition hover:border-[#d799ff]/60 hover:text-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
                >
                  닫기
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {catReaders.map((reader) => {
                  const isSelected = reader.id === value;
                  const isPending = pendingReaderId === reader.id;
                  const readerCopy = getCatReaderHomeCopy(reader.id);

                  return (
                    <button
                      key={reader.id}
                      type="button"
                      onClick={() => selectHomeReader(reader.id)}
                      aria-pressed={isSelected}
                      data-reader-id={reader.id}
                      title={readerCopy.sheetLine}
                      className={cn(
                        "home-cat-reader-card group flex min-w-0 cursor-pointer items-center gap-2 rounded-[1rem] border bg-[rgba(12,8,24,0.72)] p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                        isSelected
                          ? "border-[#f2a6ff] shadow-[0_0_20px_rgba(199,117,255,0.28)]"
                          : "border-[#71433f]/70 hover:border-[#d799ff]/70",
                        isPending ? "home-cat-card-glimmer" : null,
                      )}
                    >
                      <span className="relative h-12 w-12 shrink-0">
                        <Image
                          src={getReaderImage(reader)}
                          alt=""
                          fill
                          sizes="48px"
                          unoptimized
                          className="scale-110 object-contain transition group-hover:scale-125"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="shrink-0 text-[12px] font-semibold text-[#ffd98a]">{reader.name}</span>
                          <span className="shrink-0 rounded-full border border-[#b98255]/30 bg-[#1b1028]/64 px-1.5 py-0.5 text-[8px] font-semibold text-[#f0bc7d]">
                            {readerCopy.tag}
                          </span>
                          {isSelected || isPending ? (
                            <span className="shrink-0 rounded-full border border-[#d799ff]/34 bg-[#2a103c]/68 px-1.5 py-0.5 text-[8px] font-semibold text-[#e7b3ff]">
                              선택됨
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-[#fff3d7]/70">
                          {readerCopy.sheetLine}
                        </span>
                        {reader.lockedLabel ? (
                          <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#e7b3ff]">Moon Pass</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-[1.2rem] border border-[#7c4a38]/58 bg-[rgba(6,5,14,0.68)] p-3 shadow-[0_0_28px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/10 backdrop-blur-md",
        isCompact ? "space-y-2" : "space-y-3",
        className,
      )}
      aria-label="고양이 테마 선택"
    >
      <div className="flex items-center gap-3">
        <span className={cn("relative shrink-0", isCompact ? "h-12 w-12" : "h-16 w-16")}>
          <Image
            src={getReaderImage(selectedReader)}
            alt=""
            fill
            sizes={isCompact ? "48px" : "64px"}
            unoptimized
            className="scale-110 object-contain"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[#f0bc7d]">
            {heading ?? (isCompact ? "이번 꿈 영수증 테마" : "오늘 꿈 영수증 테마")}
          </p>
          <h2 className={cn("flex min-w-0 items-center gap-2 font-semibold text-[#ffd98a]", isCompact ? "text-[1rem]" : "text-[1.12rem]")}>
            <span className="truncate">{selectedReader.name}</span>
            <span className="shrink-0 rounded-full border border-[#b98255]/35 bg-[#1b1028]/70 px-2 py-0.5 text-[10px] font-semibold text-[#f0bc7d]">
              {selectedReader.role}
            </span>
          </h2>
          {!isCompact ? (
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-[#fff3d7]/74">{selectedReader.shortDescription}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {catReaders.map((reader) => {
          const isSelected = reader.id === value;

          return (
            <button
              key={reader.id}
              type="button"
              onClick={() => onChange(reader.id)}
              aria-pressed={isSelected}
              title={reader.lockedLabel ?? reader.shortDescription}
              className={cn(
                "group min-w-0 rounded-[0.9rem] border bg-[rgba(12,8,24,0.72)] p-1.5 text-center transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                isSelected
                  ? "border-[#f2a6ff] shadow-[0_0_20px_rgba(199,117,255,0.32)]"
                  : "border-[#71433f]/70 hover:border-[#d799ff]/70",
              )}
            >
              <span className={cn("relative mx-auto block", isCompact ? "h-12 w-12" : "h-14 w-14")}>
                <Image
                  src={getReaderImage(reader)}
                  alt=""
                  fill
                  sizes={isCompact ? "48px" : "56px"}
                  unoptimized
                  className="scale-110 object-contain transition group-hover:scale-125"
                />
              </span>
              <span className="mt-1 block truncate text-[11px] font-semibold text-[#ffd98a]">{reader.name}</span>
              <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#f0bc7d]">{reader.role}</span>
              {reader.lockedLabel ? (
                <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#f0bc7d]">Moon Pass</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
