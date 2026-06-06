import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 마냥 꿈해몽",
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

function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

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
        <PolicySection title="적용 범위">
          <p>
            이 개인정보처리방침은 마냥 꿈해몽이 서비스 제공, 기록 보관, 인증, 문의 처리 과정에서
            개인정보를 어떻게 처리하는지 설명합니다.
          </p>
          <p>최종 업데이트 및 시행일은 2026년 6월 5일입니다.</p>
        </PolicySection>

        <PolicySection title="처리 목적">
          <PolicyList
            items={[
              "Google OAuth와 Supabase 인증을 통한 로그인 상태 확인",
              "꿈 해몽, 타로 리딩, 아침과 밤 체크인, 발자국 기록, 아카이브 제공",
              "비로그인 체험 이용량 관리와 중복 이용 방지",
              "기록 내보내기, 전체 기록 삭제, 문의와 피드백 처리",
              "오류 대응, 보안 점검, 서비스 품질 개선",
            ]}
          />
        </PolicySection>

        <PolicySection title="처리 항목">
          <PolicyList
            items={[
              "계정 정보: Supabase 사용자 UUID, Google OAuth에서 제공되는 이메일과 프로필 식별 정보, 인증 세션 정보",
              "꿈 기록: 사용자가 입력한 꿈 내용, 감정, 상징, 해석 결과, 저장·수정·삭제 시각",
              "루틴 기록: 발자국, 아침 체크인, 밤 체크인, 사용자가 선택하거나 입력한 상태 정보",
              "타로 기록: 카드, 정방향·역방향 여부, 리딩 결과, 리딩 생성 시각",
              "사용량 기록: 일일 리딩 이용 여부, 기능 접근 등급, 게스트 식별자",
              "문의와 피드백: 주제, 평점, 피드백 내용, 관련 기록 식별자, 제출 시각",
              "서비스 운영 정보: 접속 요청, 오류 로그, 보안 이벤트처럼 서비스 제공 과정에서 생성되는 기술 정보",
            ]}
          />
        </PolicySection>

        <PolicySection title="비로그인 사용자의 기록">
          <p>
            비로그인 상태의 꿈 기록, 루틴 기록, 타로 기록, 게스트 식별자는 브라우저 localStorage에 저장될
            수 있습니다. 이 기록은 같은 기기와 같은 브라우저에서만 유지되며, 브라우저 데이터를 지우거나
            다른 기기로 이동하면 복구되지 않을 수 있습니다.
          </p>
          <p>
            비로그인 사용자의 서버 피드백은 게스트 식별자와 함께 저장될 수 있습니다. 게스트 식별자는
            계정으로 로그인한 사용자의 UUID와 별도로 관리됩니다.
          </p>
        </PolicySection>

        <PolicySection title="보유 및 이용 기간">
          <PolicyList
            items={[
              "계정 기반 기록은 사용자가 기록을 삭제하거나 서비스 제공 목적이 달성될 때까지 보관합니다.",
              "내 꿈방의 전체 기록 삭제를 실행하면 꿈 기록, 상징 히스토리, 발자국, 아침 체크인, 밤 체크인, 타로 기록, 사용량 기록을 삭제합니다.",
              "문의와 피드백은 문의 처리, 품질 개선, 분쟁 대응에 필요한 기간 동안 보관합니다.",
              "비로그인 localStorage 기록은 사용자가 브라우저 데이터를 삭제하거나 앱의 기록 삭제 기능을 사용할 때 삭제됩니다.",
              "법령상 보존 의무가 생기는 결제, 정산, 분쟁 관련 기록은 해당 법령에서 정한 기간 동안 별도로 보관할 수 있습니다.",
            ]}
          />
        </PolicySection>

        <PolicySection title="제3자 제공">
          <p>
            마냥 꿈해몽은 사용자의 개인정보를 판매하지 않습니다. 사용자의 동의가 있거나 법령상 의무가 있는
            경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.
          </p>
        </PolicySection>

        <PolicySection title="처리 위탁 및 국외 처리">
          <PolicyList
            items={[
              "Supabase: 인증, 세션 관리, 데이터베이스 저장, 서버 기록 관리",
              "Google OAuth: Google 계정을 통한 로그인 인증",
              "OpenAI API: LLM 또는 임베딩 모드가 활성화된 경우 꿈 해몽, 타로 리딩, 검색 보강에 필요한 입력 처리",
              "Vercel 또는 배포 인프라 제공자: 웹 서비스 호스팅, 요청 처리, 배포와 장애 대응",
            ]}
          />
          <p>
            위 제공자는 해외 인프라를 사용할 수 있습니다. 실제 프로젝트 리전, 계약 조건, 하위 처리자,
            보관 기간이 확정되거나 변경되면 이 항목을 더 구체적으로 갱신합니다.
          </p>
          <p>
            현재 AI API 연계는 사용자가 입력한 꿈과 타로 맥락을 리딩 생성과 검색 보강에 필요한 범위에서
            처리하기 위한 목적입니다. 운영자가 별도로 설정하지 않는 한 이용자 입력을 마냥 꿈해몽의 자체
            모델 학습 목적으로 제공하지 않으며, 향후 학습 목적으로 사용하게 되면 목적, 항목, 보유 기간,
            거부 방법을 별도로 안내합니다.
          </p>
        </PolicySection>

        <PolicySection title="이용자의 권리">
          <p>
            사용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 현재 서비스는
            내 꿈방의 기록 내보내기와 전체 기록 삭제 기능을 제공하며, 추가 요청은 내 꿈방의 문의와 피드백
            메뉴를 통해 보낼 수 있습니다.
          </p>
          <p>
            로그인 사용자의 기록 내보내기에는 사용자 UUID, 꿈 기록, 발자국, 아침 체크인, 밤 체크인, 타로
            기록이 포함됩니다.
          </p>
        </PolicySection>

        <PolicySection title="파기">
          <p>
            보유 기간이 지나거나 처리 목적이 달성되어 개인정보가 불필요해지면 지체 없이 파기합니다. 서버
            기록은 데이터베이스 삭제 방식으로, localStorage 기록은 브라우저 저장소 삭제 방식으로
            파기합니다.
          </p>
          <p>
            관계 법령에 따라 보존해야 하는 정보가 있으면 해당 정보는 다른 기록과 분리해 보관하고 정해진
            기간이 지난 뒤 파기합니다.
          </p>
        </PolicySection>

        <PolicySection title="안전성 확보조치">
          <PolicyList
            items={[
              "Supabase 인증과 접근 제어를 통한 계정 기반 기록 분리",
              "서비스 제공에 필요한 최소 범위의 기록 조회",
              "전송 구간 암호화를 지원하는 배포 환경 사용",
              "오류와 보안 이벤트 점검",
              "운영자 접근 권한의 제한과 관리",
            ]}
          />
        </PolicySection>

        <PolicySection title="자동 수집 장치">
          <p>
            서비스는 로그인 세션 유지와 비로그인 기록 보관을 위해 쿠키, 세션 저장소, localStorage를 사용할
            수 있습니다. 광고 추적 목적의 쿠키를 별도로 사용하지 않습니다.
          </p>
          <p>
            사용자는 브라우저 설정에서 쿠키나 localStorage를 삭제할 수 있지만, 이 경우 로그인 유지,
            비로그인 기록 복원, 일일 이용 상태 확인이 제한될 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection title="개인정보 보호책임자와 문의">
          <p>
            개인정보 보호책임자는 서비스 운영자입니다. 개인정보 관련 문의, 권리 행사, 불만 접수는 내
            꿈방의 문의와 피드백 메뉴를 통해 보낼 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection title="권익침해 구제방법">
          <p>
            개인정보 침해에 대한 상담이나 신고가 필요한 경우 개인정보보호위원회, 개인정보침해신고센터
            국번 없이 118, 개인정보분쟁조정위원회 1833-6972 등 공적 구제 창구를 이용할 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection title="방침 변경">
          <p>
            개인정보 처리 항목, 위탁 제공자, 보유 기간, 문의 창구가 변경되면 이 페이지를 갱신합니다.
            중요한 변경은 서비스 화면에서 추가로 안내할 수 있습니다.
          </p>
        </PolicySection>
      </article>
    </AppShell>
  );
}
