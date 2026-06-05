"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import { AccountStatusCard } from "@/components/account-status-card";
import { CatReaderPicker } from "@/components/cat-reader-picker";
import { LanguageToggle } from "@/components/language-toggle";
import { ProfileAppVersionDialog } from "@/components/profile-app-version-dialog";
import { ProfileDeleteRecordsDialog } from "@/components/profile-delete-records-dialog";
import { ProfileFeedbackDialog } from "@/components/profile-feedback-dialog";
import { useLocale } from "@/lib/use-locale";
import {
  getDefaultCatReaderSnapshot,
  getSelectedCatReaderSnapshotFromBrowser,
  saveSelectedCatReaderIdToBrowser,
  subscribeToSelectedCatReader,
} from "@/lib/cat-readers";
import type { AccessPlan, AccessRole } from "@/lib/access-policy";
import { DREAM_READING_DISCLAIMER } from "@/lib/disclaimer";
import { manyangAssets } from "@/lib/manyang-assets";
import { exportAuthenticatedProfile, exportGuestProfileFromBrowser } from "@/lib/profile-export";
import { cn, ui } from "@/lib/styles";
import { useAccessPlan } from "@/lib/use-access-plan";

type ProfileMenuAction =
  | "feedback"
  | "record-export"
  | "record-delete"
  | "terms"
  | "privacy-policy"
  | "app-version";

type ProfileMenuItem = {
  title: string;
  description: string;
  action?: ProfileMenuAction;
  href?: string;
  status?: "ready" | "coming-soon";
  ctaLabel?: string;
} & (
  | { icon: keyof typeof manyangAssets.profileIcons; menuIcon?: never }
  | { icon?: never; menuIcon: keyof typeof manyangAssets.profileMenuIcons }
);

const appSettings: ProfileMenuItem[] = [
  {
    title: "알림과 루틴",
    description: "앱 푸시 알림과 주간 리포트는 별도 설정 화면에서 열릴 예정이에요.",
    icon: "notifications",
    status: "coming-soon",
  },
  {
    title: "개인정보와 보안",
    description: "계정 삭제와 내부 보안 설정은 정책 정리 후 열릴 예정이에요.",
    menuIcon: "privacySecurity",
    status: "coming-soon",
  },
  {
    title: "화면 테마",
    description: "화면 색상과 배경 테마는 디자인 시스템 정리 후 열릴 예정이에요.",
    icon: "theme",
    status: "coming-soon",
  },
];

const recordSettings: ProfileMenuItem[] = [
  {
    title: "기록 백업",
    description: "자동 백업 상태 표시는 서버 동기화 추적이 준비되면 열릴 예정이에요.",
    menuIcon: "recordBackup",
    status: "coming-soon",
  },
  {
    title: "기록 내보내기",
    description: "꿈 영수증과 기록을 파일로 저장",
    menuIcon: "recordExport",
    action: "record-export",
    status: "ready",
    ctaLabel: "저장",
  },
  {
    title: "전체 기록 삭제",
    description: "저장된 꿈 기록과 발자국 정리",
    menuIcon: "recordDelete",
    action: "record-delete",
    status: "ready",
    ctaLabel: "삭제",
  },
];

const supportItems: ProfileMenuItem[] = [
  {
    title: "문의와 피드백",
    description: "오류 신고, 의견 보내기, 사용 가이드",
    menuIcon: "feedback",
    action: "feedback",
    status: "ready",
  },
  {
    title: "이용약관",
    description: "서비스 이용 기준과 책임 범위",
    menuIcon: "terms",
    action: "terms",
    href: "/terms",
    status: "ready",
  },
  {
    title: "개인정보처리방침",
    description: "기록과 계정 정보가 다뤄지는 방식",
    menuIcon: "privacyPolicy",
    action: "privacy-policy",
    href: "/privacy",
    status: "ready",
  },
  {
    title: "앱 버전",
    description: "현재 앱 버전과 업데이트 안내",
    menuIcon: "appVersion",
    action: "app-version",
    status: "ready",
  },
];

function getProfileMenuIconSrc(item: ProfileMenuItem) {
  if (item.menuIcon) {
    return manyangAssets.profileMenuIcons[item.menuIcon];
  }

  return manyangAssets.profileIcons[item.icon];
}

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

function ProfileMenuList({
  items,
  onAction,
}: {
  items: ProfileMenuItem[];
  onAction: (action: ProfileMenuAction) => void;
}) {
  return (
    <div
      role="list"
      className="overflow-hidden rounded-[1.35rem] border border-[#7c4a38]/62 bg-[rgba(7,6,17,0.72)] shadow-[0_0_30px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/12 backdrop-blur-md"
    >
      {items.map((item, index) => {
        const isComingSoon = item.status === "coming-soon" || (!item.action && !item.href);
        const className = cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left",
          index > 0 && "border-t border-[#7c4a38]/38",
          isComingSoon ? "cursor-default opacity-78" : "transition hover:bg-[#140d24]/70",
          ui.insetFocus,
        );
        const content = (
          <>
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
              {isComingSoon ? "준비 중" : (item.ctaLabel ?? "열기")}
            </span>
          </>
        );

        if (item.href && !isComingSoon) {
          return (
            <a
              key={item.title}
              role="listitem"
              href={item.href}
              data-profile-menu-action={item.action}
              className={className}
            >
              {content}
            </a>
          );
        }

        if (item.action && !isComingSoon) {
          const action = item.action;

          return (
            <button
              key={item.title}
              type="button"
              role="listitem"
              data-profile-menu-action={action}
              onClick={() => onAction(action)}
              className={className}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={item.title}
            role="listitem"
            data-profile-menu-disabled="true"
            data-profile-menu-status="coming-soon"
            className={className}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

function getPlanStatusCopy(accessPlan: AccessPlan, role: AccessRole) {
  if (role === "admin") {
    return {
      status: "admin",
      label: "Admin",
      title: "관리자 권한",
      body: "관리자 모드에서는 Moon Pass 기능과 테스트 옵션을 함께 확인할 수 있어요.",
    };
  }

  if (accessPlan === "moon_pass") {
    return {
      status: "moon_pass",
      label: "Moon Pass",
      title: "Moon Pass 사용 중",
      body: "확장 리딩과 고급 기록 기능을 사용할 수 있는 플랜이에요.",
    };
  }

  if (accessPlan === "free_account") {
    return {
      status: "free_account",
      label: "무료 계정",
      title: "무료 계정",
      body: "로그인된 계정으로 꿈 기록과 기본 기능을 저장하며 사용할 수 있어요.",
    };
  }

  return {
    status: "guest",
    label: "게스트",
    title: "게스트 모드",
    body: "로그인하면 꿈 기록과 루틴 기록을 계정에 저장할 수 있어요.",
  };
}

export function ProfileRoom() {
  const { t } = useLocale();
  const accessState = useAccessPlan();
  const planCopy = getPlanStatusCopy(accessState.accessPlan, accessState.role);
  const [activeDialog, setActiveDialog] = useState<ProfileMenuAction | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    kind: "pending" | "success" | "error";
    message: string;
  } | null>(null);
  const selectedCatReaderId = useSyncExternalStore(
    subscribeToSelectedCatReader,
    getSelectedCatReaderSnapshotFromBrowser,
    getDefaultCatReaderSnapshot,
  );
  const isAuthenticated = accessState.accessPlan !== "guest" || accessState.role === "admin";

  async function handleRecordExport() {
    setActionStatus({ kind: "pending", message: "기록을 내보내는 중이에요." });
    const result = isAuthenticated ? await exportAuthenticatedProfile() : exportGuestProfileFromBrowser();

    setActionStatus(
      result.status === "ok"
        ? { kind: "success", message: "기록 내보내기가 완료됐어요." }
        : { kind: "error", message: "기록을 내보내지 못했어요." },
    );
  }

  function handleMenuAction(action: ProfileMenuAction) {
    if (action === "record-export") {
      void handleRecordExport();
      return;
    }

    if (action === "feedback" || action === "app-version" || action === "record-delete") {
      setActiveDialog(action);
    }
  }

  return (
    <div className="space-y-4 pb-3">
      <div data-profile-section="account">
        <AccountStatusCard
          accessPlan={accessState.accessPlan}
          accessRole={accessState.role}
          bypassAccessGate={accessState.bypassAccessGate}
          bypassDailyLimit={accessState.bypassDailyLimit}
        />
      </div>

      <section data-profile-section="reader" className="space-y-2">
        <SectionHeader
          title="고양이 테마 설정"
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
        data-profile-plan-status={planCopy.status}
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
                현재 플랜
              </span>
            </div>
            <p className="mt-1 text-[0.95rem] font-semibold text-[#ffe7b5]">{planCopy.title}</p>
            <p className="mt-1 text-[12px] leading-5 text-[#fff3d7]/72">
              {planCopy.body}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-[#f0bc7d]/86">{planCopy.label}</p>
          </div>
        </div>
      </section>

      <section data-profile-section="language" className="space-y-2">
        <SectionHeader title={t("profile.language.title")} description={t("profile.language.description")} />
        <LanguageToggle />
      </section>

      <section data-profile-section="app-settings" className="space-y-2">
        <SectionHeader title="앱 설정" description="앱 사용을 돕는 세부 설정은 순차적으로 열릴 예정이에요." />
        <ProfileMenuList items={appSettings} onAction={handleMenuAction} />
      </section>

      <section data-profile-section="records" className="space-y-2">
        <SectionHeader title="기록 관리" description="저장된 꿈 기록을 백업하거나 정리하는 기능을 준비하고 있어요." />
        <ProfileMenuList items={recordSettings} onAction={handleMenuAction} />
        {actionStatus ? (
          <p
            data-profile-action-status={actionStatus.kind}
            className={cn(
              "px-1 text-[12px] leading-5",
              actionStatus.kind === "error" ? "text-[#ffb4a9]" : "text-[#f0bc7d]/88",
            )}
          >
            {actionStatus.message}
          </p>
        ) : null}
      </section>

      <section data-profile-section="support" className="space-y-2">
        <SectionHeader title="도움말" description="문의, 약관, 앱 정보를 이 영역으로 모을게요." />
        <ProfileMenuList items={supportItems} onAction={handleMenuAction} />
      </section>

      <section className="rounded-[1rem] border border-[#7c4a38]/56 bg-[rgba(7,6,17,0.68)] px-4 py-3 text-[12px] leading-5 text-[#f0bc7d]/88">
        {DREAM_READING_DISCLAIMER}
      </section>

      {activeDialog === "feedback" ? (
        <ProfileFeedbackDialog isAuthenticated={isAuthenticated} onClose={() => setActiveDialog(null)} />
      ) : null}
      {activeDialog === "app-version" ? <ProfileAppVersionDialog onClose={() => setActiveDialog(null)} /> : null}
      {activeDialog === "record-delete" ? (
        <ProfileDeleteRecordsDialog isAuthenticated={isAuthenticated} onClose={() => setActiveDialog(null)} />
      ) : null}
    </div>
  );
}
