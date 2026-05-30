"use client";

import type { DreamAnalysisResponse, DreamReadingUnavailableReason } from "@manyang/backend";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/app-shell";
import { DreamResultReceipt } from "@/components/dream-result-receipt";
import { DreamUnavailableResult } from "@/components/dream-unavailable-result";
import { getCatReaderById } from "@/lib/cat-readers";
import {
  getLatestAnalysisSnapshotFromBrowser,
  saveDreamDraftToBrowser,
  saveDreamRecordToBrowser,
  saveLatestAnalysisToBrowser,
  subscribeToDreamStorage,
  type DreamUnavailablePayload,
} from "@/lib/dream-storage";
import { manyangAssets } from "@/lib/manyang-assets";

type DreamUnavailableApiResponse = {
  status: "unavailable";
  error: string;
  reason: DreamReadingUnavailableReason;
  retryable: boolean;
  safetyNotice?: string;
};

function createFallbackRecordId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}`;
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

export function DreamResultPageClient() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const payload = useSyncExternalStore(
    subscribeToDreamStorage,
    getLatestAnalysisSnapshotFromBrowser,
    () => null,
  );
  const reader = getCatReaderById(
    payload?.catReaderType ?? (payload?.status === "unavailable" ? undefined : payload?.analysis.reader?.id),
  );

  async function retryUnavailableReading(unavailablePayload: DreamUnavailablePayload) {
    if (isRetrying) {
      return;
    }

    setRetryError("");
    setIsRetrying(true);

    try {
      const response = await fetch("/api/dreams/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dreamText: unavailablePayload.dreamText,
          dreamDate: unavailablePayload.dreamDate,
          ...(unavailablePayload.wakeMood ? { wakeMood: unavailablePayload.wakeMood } : {}),
          ...(unavailablePayload.catReaderType ? { catReaderType: unavailablePayload.catReaderType } : {}),
        }),
      });
      const body = (await response.json()) as unknown;

      if (response.ok) {
        const analysis = body as DreamAnalysisResponse;
        const completedPayload = {
          dreamText: unavailablePayload.dreamText,
          dreamDate: unavailablePayload.dreamDate,
          ...(unavailablePayload.catReaderType ? { catReaderType: unavailablePayload.catReaderType } : {}),
          ...(unavailablePayload.wakeMood ? { wakeMood: unavailablePayload.wakeMood } : {}),
          analysis,
        };

        saveLatestAnalysisToBrowser(completedPayload);
        saveDreamRecordToBrowser({
          ...completedPayload,
          id: analysis.dreamId,
          savedAt: new Date().toISOString(),
        });
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
        saveDreamRecordToBrowser({
          ...nextUnavailablePayload,
          id: createFallbackRecordId("unavailable-dream"),
          savedAt: new Date().toISOString(),
        });
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
