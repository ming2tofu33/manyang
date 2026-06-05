import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { DREAM_READING_DISCLAIMER } from "@/lib/disclaimer";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  title: "이용약관 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="이용약관"
      subtitle="서비스 이용 기준"
      titleIconSrc={manyangAssets.profileMenuIcons.terms}
      backHref="/profile"
      showBottomNav={false}
    >
      <article className="mt-4 space-y-4 pb-5 text-sm leading-6 text-[#fff3d7]/82">
        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">서비스 목적</h2>
          <p className="mt-2">
            마냥 꿈해몽은 사용자가 입력한 꿈 기록, 감정, 루틴 기록을 바탕으로 감성적인 꿈 해석과
            회고용 기록 경험을 제공합니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">AI 리딩 안내</h2>
          <p className="mt-2">{DREAM_READING_DISCLAIMER}</p>
          <p className="mt-2">
            해석 결과는 오락과 자기 성찰을 위한 참고 자료이며, 의료, 심리, 법률, 재무 판단을 대신하지
            않습니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">사용자 책임</h2>
          <p className="mt-2">
            사용자는 본인이 입력한 꿈 기록과 피드백 내용에 대한 책임을 갖습니다. 타인의 개인정보,
            민감정보, 권리를 침해하는 내용을 입력하지 않아야 합니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">Moon Pass와 결제</h2>
          <p className="mt-2">
            Moon Pass는 확장 기능을 위한 플랜 이름입니다. 실제 결제, 청구, 환불 정책은 결제 기능이
            구현되고 별도 안내가 제공된 뒤 적용됩니다.
          </p>
        </section>

        <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
          <h2 className="text-base font-semibold text-[#ffd98a]">문의</h2>
          <p className="mt-2">오류 신고나 문의는 내 꿈방의 문의와 피드백 메뉴를 통해 보낼 수 있습니다.</p>
        </section>
      </article>
    </AppShell>
  );
}
