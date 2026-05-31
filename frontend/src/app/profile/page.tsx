import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { ProfileRoom } from "@/components/profile-room";
import { manyangAssets } from "@/lib/manyang-assets";

export const metadata: Metadata = {
  title: "내 꿈방 | 마냥 꿈해몽",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return (
    <AppShell
      background={manyangAssets.backgrounds.default}
      title="내 꿈방"
      subtitle="나와 앱 설정을 관리하는 공간"
      titleIconSrc={manyangAssets.icons.profile}
      leftAction="none"
      rightAction="none"
    >
      <div className="mt-4 pb-5">
        <ProfileRoom />
      </div>
    </AppShell>
  );
}
