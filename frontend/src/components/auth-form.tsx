"use client";

import { useState } from "react";

import { AssetTextButton } from "@/components/asset-primitives";
import { createGoogleOAuthSignInArgs, isValidAuthNextPath } from "@/lib/auth-redirect";
import { manyangAssets } from "@/lib/manyang-assets";
import { cn, ui } from "@/lib/styles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  nextPath?: string;
  saveLatest?: boolean;
};

export function AuthForm({ nextPath = "/archive", saveLatest = false }: AuthFormProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const safeNextPath = isValidAuthNextPath(nextPath) ? nextPath : "/archive";

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth(
        createGoogleOAuthSignInArgs(window.location.origin, safeNextPath, saveLatest),
      );

      if (error) {
        setErrorMessage("Google 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setErrorMessage("Google 로그인 요청 중 문제가 생겼어요. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={cn(ui.panel, "space-y-4 p-5")}>
      <div className="space-y-2">
        <h2 className={cn("text-xl font-semibold text-[#ffd98a]", ui.textGlow)}>꿈 기록을 계정에 남기기</h2>
        <p className="text-sm leading-6 text-[#fff3d7]/78">
          Google로 로그인하면 꿈 영수증을 달력에 저장하고, 반복되는 상징을 계정에 모아볼 수 있어요.
        </p>
      </div>

      <div className="space-y-3">
        {errorMessage ? <p className="text-sm leading-5 text-[#ffd98a]">{errorMessage}</p> : null}

        <AssetTextButton
          frame={manyangAssets.buttons.mediumSecondary}
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="mx-auto max-w-[16rem]"
          contentClassName="min-h-[3.2rem] px-4 text-base"
        >
          {isSubmitting ? "Google 연결 중" : "Google로 계속하기"}
        </AssetTextButton>
      </div>
    </section>
  );
}
