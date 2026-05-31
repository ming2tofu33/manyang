"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { AccountStatusCard } from "@/components/account-status-card";
import { CatReaderPicker } from "@/components/cat-reader-picker";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/lib/use-locale";
import {
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  saveSelectedCatReaderIdToBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import { DREAM_READING_DISCLAIMER } from "@/lib/disclaimer";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";

type ProfileMenuItem = {
  title: string;
  description: string;
  icon: keyof typeof manyangAssets.profileIcons;
};

const appSettings: ProfileMenuItem[] = [
  {
    title: "알림과 루틴",
    description: "아침 꿈 기록, 밤 꿈 씨앗, 주간 리포트 알림",
    icon: "notifications",
  },
  {
    title: "개인정보와 보안",
    description: "앱 잠금, 기록 숨기기, 공유 설정",
    icon: "privacy",
  },
  {
    title: "화면 테마",
    description: "앱 테마와 색상 선택",
    icon: "theme",
  },
];

const recordSettings: ProfileMenuItem[] = [
  {
    title: "기록 백업",
    description: "꿈 기록을 계정에 안전하게 보관",
    icon: "account",
  },
  {
    title: "기록 내보내기",
    description: "꿈 영수증과 기록을 파일로 저장",
    icon: "account",
  },
  {
    title: "전체 기록 삭제",
    description: "저장된 꿈 기록과 발자국 정리",
    icon: "privacy",
  },
];

const supportItems: ProfileMenuItem[] = [
  {
    title: "문의와 피드백",
    description: "오류 신고, 의견 보내기, 사용 가이드",
    icon: "service",
  },
  {
    title: "이용약관",
    description: "서비스 이용 기준과 책임 범위",
    icon: "service",
  },
  {
    title: "개인정보처리방침",
    description: "기록과 계정 정보가 다뤄지는 방식",
    icon: "privacy",
  },
  {
    title: "앱 버전",
    description: "현재 앱 버전과 업데이트 안내",
    icon: "account",
  },
];

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-1">
      <h2 className={cn("text-[1.04rem] font-semibold text-[#ffd98a]", ui.textGlow)}>{title}</h2>
      {description ? <p className="mt-1 text-[12px] leading-5 text-[#fff3d7]/68">{description}</p> : null}
    </div>
  );
}

function ComingSoonMenuList({ items }: { items: ProfileMenuItem[] }) {
  return (
    <div
      role="list"
      className="overflow-hidden rounded-[1.35rem] border border-[#7c4a38]/62 bg-[rgba(7,6,17,0.72)] shadow-[0_0_30px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/12 backdrop-blur-md"
    >
      {items.map((item, index) => (
        <div
          key={item.title}
          role="listitem"
          data-profile-menu-disabled="true"
          data-profile-menu-status="coming-soon"
          className={cn(
            "flex w-full items-center gap-3 px-4 py-3 text-left",
            index > 0 && "border-t border-[#7c4a38]/38",
          )}
        >
          <span className="relative h-11 w-11 shrink-0">
            <Image
              src={manyangAssets.profileIcons[item.icon]}
              alt=""
              fill
              sizes="44px"
              unoptimized
              className="object-contain p-0"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.98rem] font-semibold text-[#ffd98a]">{item.title}</span>
            <span className="mt-0.5 block truncate text-[12px] text-[#fff3d7]/68">{item.description}</span>
          </span>
          <span className="shrink-0 rounded-full border border-[#b98255]/44 bg-[#1b1028]/68 px-2.5 py-1 text-[11px] font-semibold text-[#f0bc7d]">
            준비 중
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProfileRoom() {
  const { t } = useLocale();
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );

  return (
    <div className="space-y-4 pb-3">
      <div data-profile-section="account">
        <AccountStatusCard />
      </div>

      <section data-profile-section="reader" className="space-y-2">
        <SectionHeader
          title="대표 고양이 설정"
          description="고양이에 따라 홈 배경과 꿈 영수증 분위기만 달라져요."
        />
        <CatReaderPicker
          value={selectedCatReaderId}
          onChange={saveSelectedCatReaderIdToBrowser}
          variant="compact"
          heading="지금 선택한 고양이"
        />
      </section>

      <section
        data-profile-section="plan"
        className="rounded-[1.35rem] border border-[#7c4a38]/62 bg-[rgba(7,6,17,0.72)] p-4 shadow-[0_0_30px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/12 backdrop-blur-md"
      >
        <div className="flex items-start gap-3">
          <span className="relative h-12 w-12 shrink-0">
            <Image
              src={manyangAssets.profileIcons.moonPass}
              alt=""
              fill
              sizes="48px"
              unoptimized
              className="object-contain drop-shadow-[0_0_14px_rgba(215,153,255,0.28)]"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("text-[1.04rem] font-semibold text-[#ffd98a]", ui.textGlow)}>Moon Pass</h2>
              <span className="rounded-full border border-[#b98255]/44 bg-[#1b1028]/68 px-2.5 py-1 text-[11px] font-semibold text-[#f0bc7d]">
                준비 중
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-[#fff3d7]/72">
              잿빛냥 테마와 기록 확장 기능은 별도 플랜으로 열릴 예정이에요.
            </p>
          </div>
        </div>
      </section>

      <section data-profile-section="language" className="space-y-2">
        <SectionHeader title={t("profile.language.title")} description={t("profile.language.description")} />
        <LanguageToggle />
      </section>

      <section data-profile-section="app-settings" className="space-y-2">
        <SectionHeader title="앱 설정" description="앱 사용을 돕는 세부 설정은 순차적으로 열릴 예정이에요." />
        <ComingSoonMenuList items={appSettings} />
      </section>

      <section data-profile-section="records" className="space-y-2">
        <SectionHeader title="기록 관리" description="저장된 꿈 기록을 백업하거나 정리하는 기능을 준비하고 있어요." />
        <ComingSoonMenuList items={recordSettings} />
      </section>

      <section data-profile-section="support" className="space-y-2">
        <SectionHeader title="도움말" description="문의, 약관, 앱 정보를 이 영역으로 모을게요." />
        <ComingSoonMenuList items={supportItems} />
      </section>

      <section className="rounded-[1rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.68)] px-4 py-3 text-[12px] leading-5 text-[#f0bc7d]/88">
        {DREAM_READING_DISCLAIMER}
      </section>
    </div>
  );
}
