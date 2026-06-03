import type { Metadata } from "next";

import { AdminLab } from "@/components/admin-lab";
import { AppShell } from "@/components/app-shell";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  title: "Admin Lab | 만양 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLabPage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="Admin Lab"
      subtitle="낮/밤 시간대와 접근 상태 확인"
      titleIconSrc={manyangAssets.actionIcons.settings}
      backHref="/profile"
      rightAction="none"
    >
      <AdminLab />
    </AppShell>
  );
}
