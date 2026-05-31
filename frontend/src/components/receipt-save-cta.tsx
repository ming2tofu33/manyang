"use client";

import { useEffect, useState } from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ReceiptSaveCtaStatus = "checking" | "guest" | "authenticated";

export function createSaveReceiptLoginHref(): string {
  return "/auth?next=%2Fresult&saveLatest=1";
}

export function getReceiptSaveCtaCopy(): string {
  return "오늘의 꿈 영수증이 완성됐어요. 로그인하면 이 꿈을 달력에 남기고, 다음 꿈들과 함께 꿈 기록으로 모아볼 수 있어요.";
}

export function ReceiptSaveCta() {
  const [status, setStatus] = useState<ReceiptSaveCtaStatus>("checking");

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

  if (status !== "guest") {
    return null;
  }

  return (
    <section
      className={cn(
        ui.panel,
        "animate-ink-fade space-y-3 p-4 text-center",
      )}
      data-receipt-save-cta="true"
    >
      <div className="space-y-1.5">
        <p className={cn("text-[1rem] font-semibold text-[#ffd98a]", ui.textGlow)}>오늘의 꿈 영수증이 완성됐어요.</p>
        <p className="text-sm leading-6 text-[#fff3d7]/78">
          로그인하면 이 꿈을 달력에 남기고, 다음 꿈들과 함께 꿈 기록으로 모아볼 수 있어요.
        </p>
      </div>
      <AssetTextButton
        href={createSaveReceiptLoginHref()}
        frame={manyangAssets.buttons.mediumSecondary}
        iconSrc={manyangAssets.actionIcons.calendar}
        className="mx-auto max-w-[17rem]"
        contentClassName="min-h-[3.2rem] px-4 text-base"
        iconClassName="h-6 w-6"
      >
        Google로 로그인하고 달력에 남기기
      </AssetTextButton>
    </section>
  );
}
