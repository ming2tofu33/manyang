import type { Metadata } from "next";
import type { ReactNode } from "react";

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

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.2rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.72)] p-4">
      <h2 className="text-base font-semibold text-[#ffd98a]">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

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
        <PolicySection title="적용 범위">
          <p>
            이 약관은 마냥 꿈해몽 웹 서비스와 관련 기능을 이용하는 모든 사용자에게 적용됩니다. 서비스에
            접속하거나 기록, 리딩, 피드백 기능을 사용하면 이 약관과 개인정보처리방침에 동의한 것으로
            봅니다.
          </p>
          <p>최종 업데이트 및 시행일은 2026년 6월 5일입니다.</p>
        </PolicySection>

        <PolicySection title="서비스 내용">
          <p>
            마냥 꿈해몽은 사용자가 입력한 꿈 기록, 감정, 루틴 기록을 바탕으로 감성적인 꿈 해석과
            회고용 기록 경험을 제공합니다. 주요 기능에는 꿈 해몽, 꿈 아카이브, 타로 리딩, 아침과 밤
            체크인, 발자국 기록, 내 꿈방의 기록 내보내기와 삭제가 포함됩니다.
          </p>
          <p>
            일부 기능은 로그인, 일일 이용 제한, 운영자 테스트 권한, 향후 제공될 Moon Pass 같은 접근
            조건에 따라 달라질 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection title="계정과 비로그인 이용">
          <p>
            로그인 사용자는 Google OAuth와 Supabase 인증을 통해 계정을 확인하며, 서버에 저장된 기록을
            같은 계정으로 다시 불러올 수 있습니다.
          </p>
          <p>
            비로그인 사용자는 일부 기능을 체험할 수 있지만 기록은 주로 현재 브라우저의 localStorage에
            저장됩니다. 브라우저 데이터 삭제, 기기 변경, 앱 정책 변경이 있으면 비로그인 기록은 복구되지
            않을 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection title="AI 리딩 안내">
          <p>{DREAM_READING_DISCLAIMER}</p>
          <p>
            AI 리딩은 전문 상담이나 진단을 대체하지 않습니다. 의료, 심리, 법률, 재무, 안전과 관련된
            중요한 결정은 관련 전문가나 공적 지원 창구의 도움을 받아야 합니다.
          </p>
          <p>
            위기 상황, 자해나 타해 위험, 응급 상황에 관한 내용은 서비스 결과에 의존하지 말고 즉시
            긴급 구조기관, 의료기관, 상담기관 등 적절한 지원을 이용해야 합니다.
          </p>
        </PolicySection>

        <PolicySection title="기록 저장과 삭제">
          <p>
            로그인 사용자의 꿈 기록, 루틴 기록, 타로 기록, 사용량 기록은 서비스 제공과 아카이브 복원을
            위해 서버에 저장될 수 있습니다. 내 꿈방의 기록 내보내기 기능으로 저장된 주요 기록을 확인할 수
            있습니다.
          </p>
          <p>
            내 꿈방의 전체 기록 삭제는 꿈 기록, 상징 히스토리, 발자국, 아침 체크인, 밤 체크인, 타로 기록,
            리딩 사용량 기록을 삭제합니다. 이 기능은 계정 자체, 인증 제공자 계정, 결제나 구독 정보가
            별도로 도입된 경우의 결제 기록까지 삭제하는 기능은 아닙니다.
          </p>
        </PolicySection>

        <PolicySection title="사용자 책임과 금지행위">
          <p>
            사용자는 본인이 입력한 꿈 기록과 피드백 내용에 대한 책임을 갖습니다. 타인의 개인정보,
            민감정보, 권리를 침해하는 내용을 입력하지 않아야 합니다.
          </p>
          <p>
            서비스 악용, 자동화된 과도한 요청, 보안 우회, 타인의 계정 접근, 불법 정보 입력, 혐오나 폭력
            조장, 제3자의 권리를 침해하는 이용은 금지됩니다. 운영자는 서비스 안정성과 이용자 보호를 위해
            필요한 범위에서 이용 제한이나 기록 삭제를 할 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection title="Moon Pass와 결제">
          <p>
            Moon Pass는 확장 기능을 위한 플랜 이름입니다. 실제 결제, 청구, 환불 정책은 결제 기능이
            구현되고 별도 안내가 제공된 뒤 적용됩니다.
          </p>
          <p>
            유료 기능이 도입되면 가격, 결제 수단, 이용 기간, 자동 갱신 여부, 청약철회와 환불 제한 사유,
            환불 절차를 결제 전에 별도로 안내합니다. 결제 기능이 도입되기 전까지 현재 화면의 Moon Pass
            표시는 접근 등급이나 개발 중인 기능 안내로만 사용됩니다.
          </p>
        </PolicySection>

        <PolicySection title="서비스 변경과 중단">
          <p>
            운영자는 기능 개선, 보안 조치, 외부 제공자의 장애, 법령 또는 정책 변경에 따라 서비스의 일부를
            변경하거나 일시 중단할 수 있습니다. 중요한 변경은 가능한 범위에서 서비스 화면이나 공지로
            안내합니다.
          </p>
        </PolicySection>

        <PolicySection title="지식재산권과 사용자 입력">
          <p>
            서비스 화면, 코드, 리딩 구성, 이미지, 브랜드 자산에 관한 권리는 운영자 또는 정당한 권리자에게
            있습니다. 사용자가 입력한 꿈 기록과 피드백의 권리는 사용자에게 있으며, 운영자는 서비스 제공,
            저장, 오류 대응, 품질 개선에 필요한 범위에서만 이를 처리합니다.
          </p>
        </PolicySection>

        <PolicySection title="책임의 한계">
          <p>
            서비스는 오락과 자기 성찰을 돕기 위한 기능으로 제공되며 결과의 정확성, 완전성, 특정 목적에
            대한 적합성을 보장하지 않습니다. 다만 운영자의 고의 또는 중대한 과실로 인한 책임, 관계 법령상
            제한할 수 없는 책임은 이 약관으로 배제하지 않습니다.
          </p>
        </PolicySection>

        <PolicySection title="개인정보와 문의">
          <p>
            개인정보 처리 기준은 개인정보처리방침에서 정합니다. 오류 신고, 권리 행사, 약관 문의는 내
            꿈방의 문의와 피드백 메뉴를 통해 보낼 수 있습니다.
          </p>
          <p>
            이 약관에 정하지 않은 사항은 대한민국 관계 법령과 일반적인 서비스 이용 관행에 따릅니다.
          </p>
        </PolicySection>
      </article>
    </AppShell>
  );
}
