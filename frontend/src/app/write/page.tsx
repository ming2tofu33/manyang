import { AppShell } from "@/components/app-shell";
import { DreamEntryForm } from "@/components/dream-entry-form";

export default function WritePage() {
  return (
    <AppShell
      background="/manyang/background-default.png"
      title="꿈쓰기"
      subtitle="어젯밤 꿈을 들려주세요"
      backHref="/"
    >
      <DreamEntryForm />
    </AppShell>
  );
}
