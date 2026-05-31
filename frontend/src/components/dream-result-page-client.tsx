"use client";

import type { DreamAnalysisRequest, DreamAnalysisResponse, DreamReadingUnavailableReason } from "@manyang/backend";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { DreamResultReceipt } from "@/components/dream-result-receipt";
import { DreamUnavailableResult } from "@/components/dream-unavailable-result";
import { getCatReaderById } from "@/lib/cat-readers";
import {
  getLatestAnalysisSnapshotFromBrowser,
  saveDreamDraftToBrowser,
  saveLatestAnalysisToBrowser,
  subscribeToDreamStorage,
  type DreamUnavailablePayload,
} from "@/lib/dream-storage";
import { manyangAssets } from "@/lib/manyang-assets";
import { saveLatestDreamToArchive, type SaveLatestDreamToArchiveResult } from "@/lib/save-latest-dream";

type DreamUnavailableApiResponse = {
  status: "unavailable";
  error: string;
  reason: DreamReadingUnavailableReason;
  retryable: boolean;
  safetyNotice?: string;
};

type SaveLatestStatus = "idle" | "saving" | SaveLatestDreamToArchiveResult["status"];
type RetryDreamAnalyzeRequestBody = DreamAnalysisRequest & {
  dreamText: string;
  dreamDate: string;
};

export function createRetryDreamAnalyzeRequestBody(
  unavailablePayload: DreamUnavailablePayload,
): RetryDreamAnalyzeRequestBody {
  return {
    dreamText: unavailablePayload.dreamText,
    dreamDate: unavailablePayload.dreamDate,
    ...(unavailablePayload.wakeMood ? { wakeMood: unavailablePayload.wakeMood } : {}),
    ...(unavailablePayload.catReaderType ? { catReaderType: unavailablePayload.catReaderType } : {}),
    ...(unavailablePayload.dreamAtmospheres ? { dreamAtmospheres: unavailablePayload.dreamAtmospheres } : {}),
    ...(unavailablePayload.dreamSensations ? { dreamSensations: unavailablePayload.dreamSensations } : {}),
    ...(unavailablePayload.dreamSensationOther ? { dreamSensationOther: unavailablePayload.dreamSensationOther } : {}),
    ...(unavailablePayload.nightContext ? { nightContext: unavailablePayload.nightContext } : {}),
  };
}

function isDreamUnavailableApiResponse(value: unknown): value is DreamUnavailableApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as DreamUnavailableApiResponse).status === "unavailable" &&
    typeof (value as DreamUnavailableApiResponse).reason === "string" &&
    typeof (value as DreamUnavailableApiResponse).retryable === "boolean"
  );
}

function getSaveLatestStatusMessage(status: SaveLatestStatus): string {
  if (status === "saving") {
    return "꿈 영수증을 달력에 남기는 중이에요.";
  }

  if (status === "saved") {
    return "이 꿈을 달력과 기록장에 남겼어요.";
  }

  if (status === "not_completed") {
    return "저장할 완료된 꿈 영수증을 찾지 못했어요.";
  }

  if (status === "unauthenticated") {
    return "로그인이 확인되지 않았어요. 다시 로그인하면 이 꿈을 남길 수 있어요.";
  }

  if (status === "error") {
    return "꿈 영수증을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
  }

  return "";
}

export function DreamResultPageClient({ shouldSaveLatest = false }: { shouldSaveLatest?: boolean }) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [saveLatestStatus, setSaveLatestStatus] = useState<SaveLatestStatus>("idle");
  const saveLatestAttemptedRef = useRef(false);
  const payload = useSyncExternalStore(
    subscribeToDreamStorage,
    getLatestAnalysisSnapshotFromBrowser,
    () => null,
  );
  const reader = getCatReaderById(
    payload?.catReaderType ?? (payload?.status === "unavailable" ? undefined : payload?.analysis.reader?.id),
  );
  const saveLatestStatusMessage = getSaveLatestStatusMessage(saveLatestStatus);

  useEffect(() => {
    if (!shouldSaveLatest || saveLatestAttemptedRef.current || !payload) {
      return;
    }

    saveLatestAttemptedRef.current = true;
    setSaveLatestStatus("saving");

    void saveLatestDreamToArchive(payload).then((result) => {
      setSaveLatestStatus(result.status);

      if (result.status === "saved") {
        router.replace("/result");
      }
    });
  }, [payload, router, shouldSaveLatest]);

  async function retryUnavailableReading(unavailablePayload: DreamUnavailablePayload) {
    if (isRetrying) {
      return;
    }

    setRetryError("");
    setIsRetrying(true);

    try {
      const retryRequestBody = createRetryDreamAnalyzeRequestBody(unavailablePayload);
      const response = await fetch("/api/dreams/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(retryRequestBody),
      });
      const body = (await response.json()) as unknown;

      if (response.ok) {
        const analysis = body as DreamAnalysisResponse;
        const completedPayload = {
          ...retryRequestBody,
          analysis,
        };

        saveLatestAnalysisToBrowser(completedPayload);
        return;
      }

      if (response.status === 503 && isDreamUnavailableApiResponse(body)) {
        const nextUnavailablePayload: DreamUnavailablePayload = {
          ...unavailablePayload,
          reason: body.reason,
          retryable: body.retryable,
          failedAt: new Date().toISOString(),
          ...(body.safetyNotice ? { safetyNotice: body.safetyNotice } : {}),
        };

        saveLatestAnalysisToBrowser(nextUnavailablePayload);
        setRetryError("아직 꿈을 끝까지 읽지 못했어요. 잠시 뒤 다시 불러볼 수 있어요.");
        return;
      }

      setRetryError("다시 불러오지 못했어요. 꿈 내용은 그대로 보관해둘게요.");
    } catch {
      setRetryError("연결이 끊겨 다시 불러오지 못했어요. 꿈 내용은 그대로 보관해둘게요.");
    } finally {
      setIsRetrying(false);
    }
  }

  function reopenUnavailableDraft(unavailablePayload: DreamUnavailablePayload) {
    saveDreamDraftToBrowser({
      dreamText: unavailablePayload.dreamText,
      ...(unavailablePayload.catReaderType ? { catReaderType: unavailablePayload.catReaderType } : {}),
      ...(unavailablePayload.wakeMood ? { wakeMood: unavailablePayload.wakeMood } : {}),
    });
    router.push("/write");
  }

  return (
    <AppShell
      background={manyangAssets.backgrounds[reader.interpretationBackgroundKey]}
      backgroundClassName="object-cover opacity-88 brightness-[0.92] contrast-[1.04]"
      scrimClassName="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,11,0.24)_0%,rgba(5,4,11,0.34)_45%,rgba(5,4,11,0.92)_100%)]"
      title="오늘의 꿈 영수증"
      backHref="/write"
      rightAction={payload?.status === "unavailable" ? "none" : "share"}
      showBottomNav={false}
    >
      {saveLatestStatusMessage ? (
        <section className="mx-1 mb-3 rounded-[1rem] border border-[#b98255]/48 bg-[rgba(7,6,18,0.78)] px-4 py-3 text-center text-sm font-semibold leading-6 text-[#ffd98a] shadow-[0_0_24px_rgba(0,0,0,0.24)] ring-1 ring-[#d799ff]/10">
          {saveLatestStatusMessage}
        </section>
      ) : null}
      {payload?.status === "unavailable" ? (
        <DreamUnavailableResult
          payload={payload}
          isRetrying={isRetrying}
          retryError={retryError}
          onRetry={() => retryUnavailableReading(payload)}
          onEdit={() => reopenUnavailableDraft(payload)}
        />
      ) : (
        <DreamResultReceipt />
      )}
    </AppShell>
  );
}
