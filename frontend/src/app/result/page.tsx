import { AppShell } from "@/components/app-shell";
import { DreamResultReceipt } from "@/components/dream-result-receipt";

export default function ResultPage() {
  return (
    <AppShell background="/manyang/background-default.png" title="오늘의 꿈 영수증" backHref="/write" rightAction="share">
      <DreamResultReceipt />
    </AppShell>
  );
}
