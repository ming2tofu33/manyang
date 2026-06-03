"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { AccountStatusCard } from "@/components/account-status-card";
import { AssetTextButton } from "@/components/asset-primitives";
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
import { useAccessPlan, type ClientAccessState } from "@/lib/use-access-plan";

type ProfileMenuItem = {
  title: string;
  description: string;
} & (
  | { icon: keyof typeof manyangAssets.profileIcons; menuIcon?: never }
  | { icon?: never; menuIcon: keyof typeof manyangAssets.profileMenuIcons }
);

const appSettings: ProfileMenuItem[] = [
  {
    title: "알림과 루틴",
    description: "아침 꿈 기록, 밤 꿈 씨앗, 주간 리포트 알림",
    icon: "notifications",
  },
  {
    title: "개인정보와 보안",
    description: "앱 잠금, 기록 숨기기, 공유 설정",
    menuIcon: "privacySecurity",
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
    menuIcon: "recordBackup",
  },
  {
    title: "기록 내보내기",
    description: "꿈 영수증과 기록을 파일로 저장",
    menuIcon: "recordExport",
  },
  {
    title: "전체 기록 삭제",
    description: "저장된 꿈 기록과 발자국 정리",
    menuIcon: "recordDelete",
  },
];

const supportItems: ProfileMenuItem[] = [
  {
    title: "문의와 피드백",
    description: "오류 신고, 의견 보내기, 사용 가이드",
    menuIcon: "feedback",
  },
  {
    title: "이용약관",
    description: "서비스 이용 기준과 책임 범위",
    menuIcon: "terms",
  },
  {
    title: "개인정보처리방침",
    description: "기록과 계정 정보가 다뤄지는 방식",
    menuIcon: "privacyPolicy",
  },
  {
    title: "앱 버전",
    description: "현재 앱 버전과 업데이트 안내",
    menuIcon: "appVersion",
  },
];

function getProfileMenuIconSrc(item: ProfileMenuItem) {
  if (item.menuIcon) {
    return manyangAssets.profileMenuIcons[item.menuIcon];
  }

  return manyangAssets.profileIcons[item.icon];
}

const adminPersonaOptions = [
  {
    id: "day",
    title: "낮 페르소나",
    badge: "아침",
    description: "기상 후 감정, 몸 상태, 오늘의 작은 발자국을 다루는 다정한 낮 목소리",
    href: "/morning",
    ctaLabel: "낮 페르소나 보기",
    iconSrc: manyangAssets.sectionIcons.morning,
  },
  {
    id: "night",
    title: "밤 페르소나",
    badge: "자기 전",
    description: "잠들기 전 기분, 컨디션, 한 줄 메모를 꿈의 부드러운 맥락으로 남기는 밤 목소리",
    href: "/night",
    ctaLabel: "밤 페르소나 보기",
    iconSrc: manyangAssets.sectionIcons.nightMood,
  },
] as const;

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
              src={getProfileMenuIconSrc(item)}
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

export function AdminPersonaSettings({ accessRole }: { accessRole: ClientAccessState["role"] }) {
  if (accessRole !== "admin") {
    return null;
  }

  return (
    <section
      data-profile-section="admin-personas"
      data-admin-persona-settings="active"
      className="space-y-2"
    >
      <SectionHeader
        title="페르소나 설정"
        description="어드민 테스트에서 낮과 밤의 말투·맥락 흐름을 따로 확인해요."
      />
      <div className="grid grid-cols-2 gap-2">
        {adminPersonaOptions.map((option) => (
          <article
            key={option.id}
            data-admin-persona-option={option.id}
            className="min-w-0 rounded-[1.05rem] border border-[#7c4a38]/58 bg-[rgba(7,6,17,0.72)] p-3 shadow-[0_0_24px_rgba(0,0,0,0.24)] ring-1 ring-[#d799ff]/10 backdrop-blur-md"
          >
            <div className="flex items-start gap-2">
              <span className="relative h-9 w-9 shrink-0">
                <Image
                  src={option.iconSrc}
                  alt=""
                  fill
                  sizes="36px"
                  unoptimized
                  className="object-contain drop-shadow-[0_0_10px_rgba(215,153,255,0.3)]"
                />
              </span>
              <div className="min-w-0">
                <span className="rounded-full border border-[#b98255]/44 bg-[#1b1028]/68 px-2 py-0.5 text-[10px] font-semibold text-[#f0bc7d]">
                  {option.badge}
                </span>
                <h3 className="mt-1 text-[0.94rem] font-semibold text-[#ffd98a]">{option.title}</h3>
              </div>
            </div>
            <p className="mt-2 min-h-[3.75rem] text-[11.5px] leading-5 text-[#fff3d7]/72">
              {option.description}
            </p>
            <AssetTextButton
              href={option.href}
              frame={manyangAssets.buttons.compactPrimary}
              iconSrc={option.iconSrc}
              className="mt-2"
              contentClassName="min-h-[2.65rem] px-2 text-[11px]"
              iconClassName="h-4 w-4"
            >
              {option.ctaLabel}
            </AssetTextButton>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminAccessPanel({ accessState }: { accessState: ClientAccessState }) {
  if (accessState.role !== "admin") {
    return null;
  }

  const testingItems = [
    {
      label: "일일 해몽 제한",
      value: accessState.bypassDailyLimit ? "우회" : "기본 정책",
    },
    {
      label: "Moon Pass 잠금",
      value: accessState.bypassAccessGate ? "우회" : "기본 정책",
    },
    {
      label: "결과 저장",
      value: "일반 기록",
    },
  ];

  return (
    <section
      data-profile-section="admin"
      data-admin-access-state="active"
      className="rounded-[1.35rem] border border-[#d799ff]/34 bg-[linear-gradient(135deg,rgba(34,17,54,0.86),rgba(8,6,18,0.82))] p-4 shadow-[0_0_34px_rgba(118,73,176,0.22)] ring-1 ring-[#ffd98a]/10 backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <span className="relative h-12 w-12 shrink-0 rounded-full bg-[rgba(215,153,255,0.1)] ring-1 ring-[#d799ff]/22">
          <span className="absolute inset-2">
            <Image
              src={manyangAssets.actionIcons.settings}
              alt=""
              fill
              sizes="32px"
              unoptimized
              className="object-contain drop-shadow-[0_0_12px_rgba(215,153,255,0.38)]"
            />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn("text-[1.04rem] font-semibold text-[#ffd98a]", ui.textGlow)}>
              어드민 테스트 모드
            </h2>
            <span className="rounded-full border border-[#d799ff]/38 bg-[#241036]/72 px-2.5 py-1 text-[10px] font-semibold text-[#e7b3ff]">
              활성
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[#fff3d7]/72">
            서버 권한으로 테스트 제한이 해제돼 있어요. 실험 결과는 현재 일반 기록에 저장돼요.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {testingItems.map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-[0.85rem] border border-[#7c4a38]/45 bg-[rgba(7,6,17,0.58)] px-2.5 py-2"
          >
            <span className="block truncate text-[10px] font-semibold text-[#f0bc7d]/78">{item.label}</span>
            <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#ffd98a]">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <AssetTextButton
          href="/write"
          frame={manyangAssets.buttons.compactPrimary}
          iconSrc={manyangAssets.actionIcons.pencil}
          contentClassName="min-h-[2.85rem] px-3 text-[12px]"
          iconClassName="h-4 w-4"
        >
          꿈 테스트
        </AssetTextButton>
        <AssetTextButton
          href="/tarot"
          frame={manyangAssets.buttons.compactPrimary}
          iconSrc={manyangAssets.semanticIcons.crystalBall}
          contentClassName="min-h-[2.85rem] px-3 text-[12px]"
          iconClassName="h-4 w-4"
        >
          타로 테스트
        </AssetTextButton>
      </div>
    </section>
  );
}

export function ProfileRoom() {
  const { t } = useLocale();
  const accessState = useAccessPlan();
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );

  return (
    <div className="space-y-4 pb-3">
      <div data-profile-section="account">
        <AccountStatusCard accessRole={accessState.role} />
      </div>

      <AdminAccessPanel accessState={accessState} />

      <AdminPersonaSettings accessRole={accessState.role} />

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
          accessRole={accessState.role}
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
