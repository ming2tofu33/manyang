"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  deleteAuthenticatedProfileRecords,
  deleteGuestProfileRecordsFromBrowser,
} from "@/lib/profile-record-actions";
import { cn, ui } from "@/lib/styles";

export const deleteConfirmationPhrase = "기록 삭제";

type DeleteStatus = "idle" | "submitting" | "error";

export function ProfileDeleteRecordsDialog({
  isAuthenticated,
  onClose,
}: {
  isAuthenticated: boolean;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<DeleteStatus>("idle");
  const canDelete = confirmation.trim() === deleteConfirmationPhrase && status !== "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canDelete) {
      return;
    }

    setStatus("submitting");
    const result = isAuthenticated
      ? await deleteAuthenticatedProfileRecords()
      : deleteGuestProfileRecordsFromBrowser();

    if (result.status === "ok") {
      onClose();
      return;
    }

    setStatus("error");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-delete-records-title"
      data-profile-dialog="delete-records"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[23rem] rounded-[1rem] border border-[#7c4a38]/62 bg-[#070611] p-4 text-[#fff3d7] shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-[#d799ff]/12"
      >
        <h2 id="profile-delete-records-title" className={cn("text-base font-semibold text-[#ffd98a]", ui.textGlow)}>
          전체 기록 삭제
        </h2>
        <p className="mt-2 text-[12px] leading-5 text-[#fff3d7]/72">
          꿈 기록, 루틴 기록, 타로 기록, 사용량 기록을 삭제합니다. 계정과 구독 정보는 삭제하지 않습니다.
        </p>
        <p className="mt-3 rounded-[0.85rem] border border-[#b98255]/35 bg-[#120b1f]/70 px-3 py-2 text-[12px] text-[#f0bc7d]">
          계속하려면 <strong className="text-[#ffe7b5]">{deleteConfirmationPhrase}</strong>라고 입력하세요.
        </p>

        <label className="mt-4 block text-[12px] font-semibold text-[#f0bc7d]" htmlFor="profile-delete-confirmation">
          확인 문구
        </label>
        <input
          id="profile-delete-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className={cn("mt-2 rounded-full px-3 py-2 text-sm", ui.field)}
          autoComplete="off"
        />

        {status === "error" ? <p className="mt-3 text-[12px] text-[#ffb4a9]">기록을 삭제하지 못했어요.</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn("rounded-full border border-[#7c4a38]/62 px-4 py-2 text-sm text-[#f0bc7d]", ui.insetFocus)}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canDelete}
            className={cn(
              "rounded-full border border-[#ffb4a9]/65 bg-[#34131d] px-4 py-2 text-sm font-semibold text-[#ffd4ce] disabled:opacity-50",
              ui.insetFocus,
            )}
          >
            삭제
          </button>
        </div>
      </form>
    </div>
  );
}
