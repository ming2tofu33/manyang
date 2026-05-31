import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { AuthForm } from "@/components/auth-form";
import { isValidAuthNextPath } from "@/lib/auth-redirect";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AuthPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    saveLatest?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedNextPath = getSingleSearchParam(resolvedSearchParams?.next);
  const nextPath = isValidAuthNextPath(requestedNextPath) ? requestedNextPath : "/archive";
  const saveLatest = getSingleSearchParam(resolvedSearchParams?.saveLatest) === "1";

  return (
    <AppShell background={manyangAssets.backgrounds.default} title="로그인" subtitle="꿈을 달력에 남기기" backHref="/result">
      <div className="mt-6 pb-5">
        <AuthForm nextPath={nextPath} saveLatest={saveLatest} />
      </div>
    </AppShell>
  );
}
