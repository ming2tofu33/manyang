"use client";

import type { DreamUnavailablePayload } from "@/lib/dream-storage";
import { getCatReaderById } from "@/lib/cat-readers";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn } from "@/lib/styles";
import { DreamLoadingOverlay } from "./dream-loading-overlay";

type DreamUnavailableResultProps = {
  payload: DreamUnavailablePayload;
  isRetrying?: boolean;
  retryError?: string;
  onRetry?: () => void;
  onEdit?: () => void;
};

function getUnavailableTitle(payload: DreamUnavailablePayload): string {
  if (payload.reason === "provider_missing") {
    return "설정이 준비되지 않았어요";
  }

  return "지금은 꿈을 끝까지 읽지 못했어요";
}

function getUnavailableMessage(payload: DreamUnavailablePayload): string {
  if (payload.reason === "provider_missing") {
    return "해몽을 만들 서버 설정이 아직 연결되지 않았어요. 꿈 내용은 이 화면에 남겨둘게요.";
  }

  if (payload.reason === "timeout") {
    return "꿈을 읽는 데 시간이 너무 오래 걸렸어요. 같은 내용으로 다시 불러볼 수 있어요.";
  }

  if (payload.reason === "invalid_response") {
    return "답변 형식이 깨져서 영수증으로 만들지 않았어요. 같은 꿈으로 다시 시도해볼게요.";
  }

  return "잠시 연결이 흔들려서 해몽을 영수증으로 만들지 않았어요. 같은 꿈으로 다시 불러볼 수 있어요.";
}

export function DreamUnavailableResult({
  payload,
  isRetrying = false,
  retryError,
  onRetry,
  onEdit,
}: DreamUnavailableResultProps) {
  const reader = getCatReaderById(payload.catReaderType);

  return (
    <>
      <DreamLoadingOverlay
        isActive={isRetrying}
        background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
        readerImage={manyangAssets.loadingReaders[reader.assetKey]}
        introImage={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
        orbImage={manyangAssets.orbs.catWithStand[reader.assetKey]}
      />
      <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-[24rem] flex-col justify-center px-5 py-8">
        <section className="space-y-5 rounded-[1.2rem] border border-[#e2ab6b]/55 bg-[rgba(18,10,28,0.84)] px-5 py-6 shadow-[0_18px_44px_rgba(4,3,10,0.36),inset_0_0_24px_rgba(255,211,143,0.05)]">
        <div className="space-y-2">
          <p className="text-[0.82rem] font-semibold text-[#ffc978]/88">{reader.name}</p>
          <h1 className="text-[1.45rem] font-semibold leading-8 text-[#fff0dc]">{getUnavailableTitle(payload)}</h1>
          <p className="text-[0.94rem] leading-6 text-[#f0c7b9]/88">{getUnavailableMessage(payload)}</p>
        </div>

        <div className="rounded-[0.9rem] border border-[#8b5b4d]/55 bg-[rgba(8,5,17,0.52)] px-4 py-3">
          <p className="line-clamp-5 whitespace-pre-line text-[0.9rem] leading-6 text-[#fff0dc]/86">{payload.dreamText}</p>
        </div>

        {payload.safetyNotice ? (
          <p className="rounded-[0.9rem] border border-[#f0c36d]/45 bg-[rgba(69,47,23,0.36)] px-4 py-3 text-[0.82rem] leading-5 text-[#ffe4b0]">
            {payload.safetyNotice}
          </p>
        ) : null}

        {retryError ? <p className="text-[0.82rem] font-semibold leading-5 text-[#ffd98a]">{retryError}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {payload.retryable ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className={cn(
                "rounded-[0.85rem] border border-[#f4b65f]/64 bg-[linear-gradient(135deg,rgba(148,80,70,0.9),rgba(65,30,54,0.9))] px-4 py-3 text-[0.92rem] font-semibold text-[#fff0dc] transition hover:border-[#ffd98a] focus:outline-none focus:ring-2 focus:ring-[#f7d58b]",
                isRetrying ? "cursor-wait opacity-75" : "",
              )}
            >
              {isRetrying ? "다시 읽는 중" : "다시 불러보기"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-[0.85rem] border border-[#d799ff]/42 bg-[rgba(20,12,35,0.78)] px-4 py-3 text-[0.92rem] font-semibold text-[#f3d0ff] transition hover:border-[#f1b7ff] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            꿈 다시 열기
          </button>
        </div>
        </section>
      </div>
    </>
  );
}
