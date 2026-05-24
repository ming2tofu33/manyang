import { AppShell } from "@/components/app-shell";
import { DreamSeedForm } from "@/components/dream-seed-form";

export default function SeedPage() {
  return (
    <AppShell
      background="/manyang/dreamseed-background.png"
      backgroundClassName="object-cover opacity-85"
      title="꿈 씨앗 심기"
      subtitle="오늘 밤 꿈에게 작은 질문을 맡겨보자냥"
      backHref="/"
    >
      <DreamSeedForm />
    </AppShell>
  );
}
