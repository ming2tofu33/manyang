import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export type AuthCallbackRouteDependencies = {
  exchangeCodeForSession?: (code: string) => Promise<unknown>;
};

export function resolveSafeAuthRedirect(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/archive";
}

async function exchangeSupabaseCodeForSession(code: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.exchangeCodeForSession(code);
}

export async function handleAuthCallbackRequest(
  request: Request,
  dependencies: AuthCallbackRouteDependencies = {},
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = resolveSafeAuthRedirect(url.searchParams.get("next"));
  const exchangeCodeForSession = dependencies.exchangeCodeForSession ?? exchangeSupabaseCodeForSession;

  if (code) {
    await exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}

export async function GET(request: Request): Promise<Response> {
  return handleAuthCallbackRequest(request);
}
