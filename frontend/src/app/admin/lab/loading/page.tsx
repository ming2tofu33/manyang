import type { Metadata } from "next";

import { AdminLoadingLab } from "@/components/admin-loading-lab";
import { AppShell } from "@/components/app-shell";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  title: "Loading Lab | 만양 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoadingLabPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="Loading Lab"
      subtitle="사용자가 보는 로딩 타임라인 확인"
      titleIconSrc={manyangAssets.actionIcons.settings}
      backHref="/admin/lab"
      rightAction="none"
    >
      <AdminLoadingLab />
    </AppShell>
  );
}
