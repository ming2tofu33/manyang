"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { saveDreamRecordToBrowser, saveLatestAnalysisToBrowser } from "@/lib/dream-storage";
import { cn, ui } from "@/lib/styles";

const moods = ["편안", "불안", "조급", "신기", "흐릿"];

type AnalyzeDreamResponse = {
  dreamId: string;
  analysisId: string;
  cardId: string;
  summary: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  interpretation: string;
  smallPrescription: string;
  card: {
    name: string;
    type: string;
    keywords: string[];
    summary: string;
    message: string;
    theme: string;
  };
};

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DreamEntryForm() {
  const router = useRouter();
  const [dreamText, setDreamText] = useState("");
  const [wakeMood, setWakeMood] = useState(moods[1]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDreamText = dreamText.trim();

    if (!trimmedDreamText) {
      setError("꿈 내용을 한 문장이라도 적어주세요.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const dreamDate = getTodayDate();
      const response = await fetch("/api/dreams/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dreamText: trimmedDreamText,
          dreamDate,
          wakeMood,
          catReaderType: "black_cat",
        }),
      });

      if (!response.ok) {
        throw new Error("analysis failed");
      }

      const analysis = (await response.json()) as AnalyzeDreamResponse;
      const payload = {
        dreamText: trimmedDreamText,
        dreamDate,
        wakeMood,
        analysis,
      };

      saveLatestAnalysisToBrowser(payload);
      saveDreamRecordToBrowser({
        ...payload,
        id: analysis.dreamId,
        savedAt: new Date().toISOString(),
      });

      router.push("/result");
    } catch {
      setError("지금은 꿈을 읽지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-auto space-y-5 pb-5">
      <section className={cn(ui.panel, "p-5")}>
        <p className="text-sm text-[#f0bc7d]">검은냥 한마디</p>
        <p className="mt-2 text-lg leading-7 text-[#fff2d6]">
          짧아도 괜찮고, 뒤죽박죽이어도 괜찮다냥.
        </p>
      </section>

      <section className={cn(ui.panel, "p-4")}>
        <label htmlFor="dream" className="text-sm text-[#f0bc7d]">
          꿈 내용
        </label>
        <textarea
          id="dream"
          rows={7}
          value={dreamText}
          onChange={(event) => setDreamText(event.target.value)}
          placeholder="낡은 학교 복도에서 교실을 찾는 꿈을 꿨어요..."
          className={cn(ui.field, "mt-3 resize-none rounded-3xl p-4 text-base leading-7")}
        />
      </section>

      <section className={cn(ui.panel, "p-4")}>
        <p className="text-sm text-[#f0bc7d]">깼을 때 기분</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {moods.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => setWakeMood(mood)}
              className={cn(ui.chip, wakeMood === mood ? "border-[#ffd98a] bg-[#5a2a78]" : "")}
            >
              {mood}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="px-2 text-sm text-[#ffd98a]">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="block w-full transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b] disabled:cursor-wait disabled:opacity-70"
      >
        <Image
          src="/manyang/dreammemory-button-3.png"
          alt={isSubmitting ? "해몽 받는 중" : "해몽 받기"}
          width={1199}
          height={382}
          sizes="382px"
          unoptimized
          className="h-auto w-full drop-shadow-[0_0_26px_rgba(156,82,210,0.42)]"
        />
      </button>
    </form>
  );
}
