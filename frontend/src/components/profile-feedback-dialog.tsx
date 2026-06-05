"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { submitProfileFeedback } from "@/lib/feedback-api";
import { getOrCreateProfileGuestIdFromBrowser } from "@/lib/profile-guest-id";
import { cn, ui } from "@/lib/styles";

type FeedbackStatus = "idle" | "submitting" | "success" | "error";

export function ProfileFeedbackDialog({
  isAuthenticated,
  onClose,
}: {
  isAuthenticated: boolean;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const result = await submitProfileFeedback({
      rating,
      feedbackText,
      guestId: isAuthenticated ? null : getOrCreateProfileGuestIdFromBrowser(),
    });

    setStatus(result.status === "ok" ? "success" : "error");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-feedback-title"
      data-profile-dialog="feedback"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[23rem] rounded-[1rem] border border-[#7c4a38]/62 bg-[#070611] p-4 text-[#fff3d7] shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-[#d799ff]/12"
      >
        <h2 id="profile-feedback-title" className={cn("text-base font-semibold text-[#ffd98a]", ui.textGlow)}>
          문의와 피드백
        </h2>
        <p className="mt-2 text-[12px] leading-5 text-[#fff3d7]/72">
          오류나 개선 의견을 남겨주세요. 답장이 필요한 내용은 연락처도 함께 적어주세요.
        </p>

        <div className="mt-4 flex gap-1.5" aria-label="만족도">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className={cn(
                "h-9 w-9 rounded-full border text-sm font-semibold",
                rating === value
                  ? "border-[#cfa0ef]/72 bg-[#2b1742] text-[#ffe7b5]"
                  : "border-[#7c4a38]/60 text-[#f0bc7d]",
                ui.insetFocus,
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-[12px] font-semibold text-[#f0bc7d]" htmlFor="profile-feedback-text">
          의견 보내기
        </label>
        <textarea
          id="profile-feedback-text"
          maxLength={1000}
          value={feedbackText}
          onChange={(event) => setFeedbackText(event.target.value)}
          className={cn("mt-2 min-h-28 rounded-[0.85rem] p-3 text-sm leading-6", ui.field)}
          placeholder="남기고 싶은 내용을 적어주세요."
        />

        {status === "success" ? <p className="mt-3 text-[12px] text-[#9ff0c2]">피드백을 보냈어요.</p> : null}
        {status === "error" ? <p className="mt-3 text-[12px] text-[#ffb4a9]">피드백 저장에 실패했어요.</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn("rounded-full border border-[#7c4a38]/62 px-4 py-2 text-sm text-[#f0bc7d]", ui.insetFocus)}
          >
            닫기
          </button>
          <button
            type="submit"
            disabled={status === "submitting"}
            className={cn(
              "rounded-full border border-[#ffd08a]/70 bg-[#2b1742] px-4 py-2 text-sm font-semibold text-[#ffe7b5] disabled:opacity-60",
              ui.insetFocus,
            )}
          >
            보내기
          </button>
        </div>
      </form>
    </div>
  );
}
