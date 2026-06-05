import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="개인정보처리방침"
      subtitle="기록과 계정 정보 처리 기준"
      titleIconSrc={manyangAssets.profileMenuIcons.privacyPolicy}
      backHref="/profile"
      showBottomNav={false}
    >
      <article className="mt-4 space-y-4 pb-5 text-sm leading-6 text-[#fff3d7]/82">
        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">처리하는 정보</h2>
          <p className="mt-2">
            로그인 계정 정보, 꿈 기록, 아침 기록, 밤 기록, 발자국 기록, 타로 기록, 사용량 기록,
            문의와 피드백을 서비스 제공과 기록 보관을 위해 처리합니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">비로그인 사용자의 기록</h2>
          <p className="mt-2">
            비로그인 상태의 꿈 기록과 루틴 기록은 브라우저 localStorage에 저장될 수 있습니다. 같은
            기기와 브라우저에서만 유지되며, 브라우저 데이터를 지우면 함께 삭제됩니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">저장과 처리 위치</h2>
          <p className="mt-2">
            로그인 사용자의 서버 기록은 Supabase 인증과 데이터베이스를 통해 저장됩니다. 앱 개선과
            오류 대응을 위해 필요한 범위 안에서만 조회합니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">내보내기와 삭제</h2>
          <p className="mt-2">
            내 꿈방에서 기록 내보내기와 전체 기록 삭제를 사용할 수 있습니다. 기록 삭제는 꿈 기록,
            루틴 기록, 타로 기록, 사용량 기록을 대상으로 하며 계정 자체와 구독 정보는 삭제하지 않습니다.
          </p>
        </section>
      </article>
    </AppShell>
  );
}
