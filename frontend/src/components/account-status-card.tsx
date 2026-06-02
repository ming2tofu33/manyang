"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import type { AccessRole } from "@/lib/access-policy";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AccountStatus = "guest" | "authenticated";

export function createProfileLoginHref(): string {
  return "/auth?next=%2Fprofile";
}

export function getAccountStatusCopy(status: AccountStatus, accessRole: AccessRole = "user"): {
  title: string;
  body: string;
  primaryActionLabel: string;
} {
  if (status === "authenticated" && accessRole === "admin") {
    return {
      title: "어드민 테스트 모드가 켜져 있어요",
      body: "일일 제한과 Moon Pass 잠금을 우회해 꿈 해몽과 타로 흐름을 확인할 수 있어요.",
      primaryActionLabel: "로그아웃",
    };
  }

  if (status === "authenticated") {
    return {
      title: "계정이 꿈을 보관하고 있어요",
      body: "이제 완성된 꿈 영수증은 기록장과 달력에 자동으로 남아요.",
      primaryActionLabel: "로그아웃",
    };
  }

  return {
    title: "아직 임시 손님 모드예요",
    body: "해몽은 받을 수 있지만, 꿈 기록장과 달력 저장은 로그인 후 사용할 수 있어요.",
    primaryActionLabel: "Google로 로그인하기",
  };
}

export function AccountStatusCard({
  initialStatus = "guest",
  accessRole = "user",
}: {
  initialStatus?: AccountStatus;
  accessRole?: AccessRole;
}) {
  const [status, setStatus] = useState<AccountStatus>(initialStatus);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const copy = getAccountStatusCopy(status, accessRole);
  const isAdmin = status === "authenticated" && accessRole === "admin";

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          setStatus(data.session ? "authenticated" : "guest");
        }
      } catch {
        if (isMounted) {
          setStatus("guest");
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      setStatus("guest");

      if (typeof window !== "undefined") {
        window.location.assign("/");
      }
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <section
      className={cn(ui.panel, "space-y-3 p-4")}
      data-account-status-card={status}
      data-account-access-role={accessRole}
    >
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 h-12 w-12 shrink-0 rounded-full bg-[rgba(255,217,138,0.06)] ring-1 ring-[#d799ff]/12">
          <span className="absolute inset-2">
            <Image
              src={manyangAssets.profileIcons.account}
              alt=""
              fill
              sizes="32px"
              unoptimized
              className="h-full w-full object-contain drop-shadow-[0_0_12px_rgba(255,191,96,0.3)]"
            />
          </span>
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-base font-semibold text-[#ffd98a]", ui.textGlow)}>{copy.title}</p>
            {isAdmin ? (
              <span className="rounded-full border border-[#d799ff]/38 bg-[#241036]/72 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-normal text-[#e7b3ff]">
                Admin
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-[#fff3d7]/76">{copy.body}</p>
        </div>
      </div>

      {status === "authenticated" ? (
        <AssetTextButton
          frame={manyangAssets.buttons.mediumSecondary}
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          iconSrc={manyangAssets.actionIcons.profile}
          className="max-w-[15rem]"
          contentClassName="min-h-[3.05rem] px-4 text-sm"
          iconClassName="h-5 w-5"
        >
          {isSigningOut ? "로그아웃 중" : copy.primaryActionLabel}
        </AssetTextButton>
      ) : (
        <AssetTextButton
          href={createProfileLoginHref()}
          frame={manyangAssets.buttons.mediumSecondary}
          iconSrc={manyangAssets.actionIcons.profile}
          className="max-w-[15rem]"
          contentClassName="min-h-[3.05rem] px-4 text-sm"
          iconClassName="h-5 w-5"
        >
          {copy.primaryActionLabel}
        </AssetTextButton>
      )}
    </section>
  );
}
