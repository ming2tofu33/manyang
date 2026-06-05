"use client";

import { getAppVersionLabel } from "@/lib/app-version";
import { cn, ui } from "@/lib/styles";

export function ProfileAppVersionDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-app-version-title"
      data-profile-dialog="app-version"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <div className="w-full max-w-[22rem] rounded-[1rem] border border-[#7c4a38]/62 bg-[#070611] p-4 text-[#fff3d7] shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-[#d799ff]/12">
        <h2 id="profile-app-version-title" className={cn("text-base font-semibold text-[#ffd98a]", ui.textGlow)}>
          앱 버전
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#fff3d7]/78">현재 버전: {getAppVersionLabel()}</p>
        <p className="mt-1 text-[12px] leading-5 text-[#f0bc7d]/82">
          업데이트 내역은 앱 개선이 배포될 때 함께 정리됩니다.
        </p>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "mt-4 rounded-full border border-[#b98255]/55 px-4 py-2 text-sm font-semibold text-[#f2c27d] transition hover:border-[#ffd08a]/70 hover:text-[#ffe7b5]",
            ui.insetFocus,
          )}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
