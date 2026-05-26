import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { DreamEntryForm } from "@/components/dream-entry-form";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WritePage() {
  return (
    <AppShell
      background="/manyang/backgrounds/default.png"
      bottomScrimClassName="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent,#05040b_70%)]"
      title="✧ 꿈 들려주기 ✧"
      backHref="/"
      rightAction="book"
    >
      <DreamEntryForm />
    </AppShell>
  );
}
