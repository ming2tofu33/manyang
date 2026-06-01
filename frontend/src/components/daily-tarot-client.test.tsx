import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { dailyTarotStorageKey, type DailyTarotReading, type StorageLike } from "@/lib/daily-tarot";

import {
  DailyTarotClient,
  DailyTarotLoadingPanel,
  DailyTarotRevealPanel,
  getStableDailyTarotReadingSnapshot,
} from "./daily-tarot-client";

const foolCard = {
  id: 0,
  roman: "0",
  slug: "the-fool",
  nameEn: "THE FOOL",
  nameKo: "The Fool",
  image: "/manyang/tarot/major/00-the-fool.png",
  keywords: ["start", "possibility"],
  visualSymbols: ["small bag"],
  mood: "Bright beginning.",
  upright: {
    summary: "New beginning",
    dailyFlow: "A small attempt may shift the day.",
    advice: "Check the basics first.",
  },
  reversed: {
    summary: "Rushed start",
    dailyFlow: "Slow down before moving.",
    advice: "Make one safety check first.",
  },
  contexts: {
    love: "New feeling",
    career: "New project",
    money: "Watch impulse spending",
    general: "Possibility",
  },
};

const foolReading = {
  id: "daily-tarot-daily_one_card-2026-05-31",
  spread: "daily_one_card",
  source: "llm",
  appDate: "2026-05-31",
  selectedAt: "2026-05-31T00:00:00.000Z",
  card: foolCard,
  orientation: "upright",
  position: "today",
  cards: [
    {
      position: "today",
      orientation: "upright",
      card: foolCard,
    },
  ],
  generated: {
    title: "A small first step opens the day",
    overview: "The selected Fool card is read as a day where a light first step matters more than waiting for perfect certainty.",
    cardReadings: [
      {
        position: "today",
        heading: "Today",
        reading: "The upright Fool points to a beginning that becomes useful once it is tested gently in real life.",
      },
    ],
    advice: "Choose one small action and review the result before deciding the next step.",
  },
  keywords: ["start", "possibility"],
  title: "A small first step opens the day",
  message: "The selected Fool card is read as a day where a light first step matters more than waiting for perfect certainty.",
  advice: "Choose one small action and review the result before deciding the next step.",
} satisfies DailyTarotReading;

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => data.get(key) ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

function installBrowserWindow(storage: StorageLike) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      addEventListener: () => undefined,
      dispatchEvent: () => true,
      localStorage: storage,
      removeEventListener: () => undefined,
    } as unknown as Window & typeof globalThis,
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("DailyTarotClient", () => {
  it("renders the shuffling intro over ready face-down options", () => {
    const markup = renderToStaticMarkup(<DailyTarotClient appDate="2026-05-31" initialReading={null} />);

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain('data-daily-tarot-draw-stage="true"');
    expect(markup).toContain('data-daily-tarot-shuffle-intro="true"');
    expect(markup).toContain("tarot-draw-stage-shuffling");
    expect(markup).toContain("tarot-shuffle-intro");
    expect(markup).not.toContain("rounded-[1.2rem] bg-[#05040b]");
    expect(markup).toContain("카드를 섞고 있어요");
    expect(markup).not.toContain("h-[11rem] w-[11rem]");
    expect(markup).not.toContain("bg-[#f2c27d]/7");
    expect(markup).toContain("오늘의 한 장");
    expect(markup).toContain("3장 리딩");
    expect(markup).toContain('data-daily-tarot-premium-tag="moon-pass"');
    expect(markup).toContain("Moon Pass");
    expect(markup).toContain('data-daily-tarot-deck');
    expect(markup).not.toContain("타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.");
  });

  it("renders an existing LLM reading as the result without hidden options", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" initialReading={foolReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="result"');
    expect(markup).toContain('data-daily-tarot-result-card-size="large"');
    expect(markup).toContain("tarot-result-card-enter");
    expect(markup).toContain('data-daily-tarot-result-copy="true"');
    expect(markup).toContain("tarot-result-content-enter");
    expect(markup).toContain("--tarot-result-enter-delay");
    expect(markup).toContain('data-daily-tarot-card-zoom-trigger="true"');
    expect(markup).toContain('data-daily-tarot-zoom-trigger="true"');
    expect(markup).toContain("tarot-result-card-enter w-full text-center");
    expect(markup).toContain("The Fool");
    expect(markup).toContain("A small first step opens the day");
    expect(markup).toContain("Today");
    expect(markup).toContain("The upright Fool points to a beginning");
    expect(markup).toContain('data-daily-tarot-result-actions="true"');
    expect(markup).toContain("저장하기");
    expect(markup).toContain("공유하기");
    expect(markup).not.toContain("오늘 ·");
    expect(markup).toContain("3장 리딩");
    expect(markup).toContain('data-daily-tarot-premium-tag="moon-pass"');
    expect(markup).toContain("Moon Pass");
    expect(markup).not.toContain("data-daily-tarot-option");
    expect(markup).toContain("타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.");
  });

  it("cleans provider artifacts from displayed generated copy", () => {
    const artifactReading = {
      ...foolReading,
      generated: {
        ...foolReading.generated,
        cardReadings: foolReading.generated.cardReadings.map((cardReading) => ({
          ...cardReading,
          reading: `${cardReading.reading} }} PMID:}`,
        })),
        advice: `${foolReading.generated.advice} }} PMID:}`,
      },
      advice: `${foolReading.advice} }} PMID:}`,
    } satisfies DailyTarotReading;

    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" initialReading={artifactReading} />,
    );

    expect(markup).not.toContain("PMID");
    expect(markup).not.toContain("}}");
  });

  it("renders a focused loading panel while the LLM reading is generated", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotLoadingPanel selections={foolReading.cards ?? []} />,
    );

    expect(markup).toContain('data-daily-tarot-loading="true"');
    expect(markup).toContain("해석을 완성하고 있어요");
    expect(markup).toContain("The Fool");
    expect(markup).toContain("정방향");
    expect(markup).not.toContain("타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.");
  });

  it("can expand the interpreting card into the result card size before showing the result", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotLoadingPanel selections={foolReading.cards ?? []} transitionToResult />,
    );

    expect(markup).toContain('data-daily-tarot-loading-to-result="true"');
    expect(markup).toContain("tarot-loading-to-result");
    expect(markup).toContain("tarot-loading-card-to-result");
    expect(markup).toContain("--tarot-loading-card-result-scale");
    expect(markup).toContain("2.92");
    expect(markup).not.toContain("animate-pulse");

    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");

    expect(source).toContain("const tarotResultTransitionMs = 1200;");
  });

  it("keeps the tarot zoom dialog from exposing horizontal scrolling", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");

    expect(source).toContain("data-daily-tarot-zoom-scroll-area");
    expect(source).toContain("overflow-x-hidden");
    expect(source).not.toContain("overflow-auto rounded-[0.75rem]");
  });

  it("keeps the loading card spread centered without a loading orb", () => {
    const loadingSelections = [
      { position: "situation", orientation: "upright", card: foolCard },
      { position: "flow", orientation: "reversed", card: { ...foolCard, id: 1, slug: "the-magician" } },
      { position: "advice", orientation: "upright", card: { ...foolCard, id: 2, slug: "the-high-priestess" } },
    ] satisfies NonNullable<DailyTarotReading["cards"]>;
    const markup = renderToStaticMarkup(<DailyTarotLoadingPanel selections={loadingSelections} />);

    expect(markup).toContain('data-daily-tarot-loading-card-stage="true"');
    expect(markup).not.toContain('data-daily-tarot-loading-orb="true"');
    expect(markup).toContain('data-daily-tarot-loading-card="true"');
    expect(markup).not.toContain("h-[11.25rem] w-[11.25rem]");
    expect(markup).toContain("translateX(-34px)");
    expect(markup).toContain("translateX(34px)");
    expect(markup).not.toContain("translateX(-44px)");
    expect(markup).not.toContain("translateX(44px)");
    expect(markup).not.toContain("-translate-x-1/2 -translate-y-1/2 animate-pulse");
  });

  it("renders a selected card lifting from the deck before the LLM loading state", () => {
    const selection = foolReading.cards?.[0];

    if (!selection) {
      throw new Error("missing test tarot selection");
    }

    const revealOptions = [
      { id: "option-1", cardId: 0, orientation: "upright" },
      { id: "option-2", cardId: 1, orientation: "reversed" },
      { id: "option-3", cardId: 2, orientation: "upright" },
    ] satisfies Array<{ id: string; cardId: number; orientation: "upright" | "reversed" }>;
    const markup = renderToStaticMarkup(
      <DailyTarotRevealPanel
        options={revealOptions}
        selectedOptionId="option-1"
        selectedOptionIndex={0}
        selection={selection}
      />,
    );

    expect(markup).toContain('data-daily-tarot-reveal="true"');
    expect(markup).toContain('data-daily-tarot-reveal-deck="true"');
    expect(markup).toContain('data-daily-tarot-selected-card-reveal="true"');
    expect(markup).toContain('data-daily-tarot-flip-card="true"');
    expect(markup).toContain('data-daily-tarot-flip-back="true"');
    expect(markup).toContain('data-daily-tarot-flip-front="true"');
    expect(markup).toContain('data-daily-tarot-reveal-origin="true"');
    expect(markup).toContain("tarot-selected-card-reveal");
    expect(markup).toContain("tarot-selected-card-reveal-inner");
    expect(markup).toContain("tarot-selected-card-reveal-back");
    expect(markup).toContain("tarot-selected-card-reveal-front");
    expect(markup).not.toContain("tarot-flip-card-front tarot-selected-card-reveal-front");
    expect(markup).toContain("고른 카드가 열리고 있어요");
    expect(markup).toContain("The Fool");
  });

  it("does not render local fallback-shaped readings as completed results", () => {
    const localReading = {
      ...foolReading,
      source: "local" as const,
      generated: undefined,
      cards: undefined,
      title: "Local fallback title",
      message: "Local fallback message",
      advice: "Local fallback advice",
    };
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" initialReading={localReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain('data-daily-tarot-shuffle-intro="true"');
    expect(markup).not.toContain('data-daily-tarot-state="result"');
    expect(markup).not.toContain("Local fallback title");
  });

  it("keeps browser snapshots referentially stable while storage is unchanged", () => {
    const storage = createMemoryStorage({
      [dailyTarotStorageKey]: JSON.stringify([foolReading]),
    });
    installBrowserWindow(storage);

    const firstSnapshot = getStableDailyTarotReadingSnapshot("2026-05-31");
    const secondSnapshot = getStableDailyTarotReadingSnapshot("2026-05-31");

    expect(secondSnapshot).toBe(firstSnapshot);

    const updatedReading = { ...foolReading, selectedAt: "2026-05-31T01:00:00.000Z" };
    storage.setItem(dailyTarotStorageKey, JSON.stringify([updatedReading]));

    const changedSnapshot = getStableDailyTarotReadingSnapshot("2026-05-31");

    expect(changedSnapshot).not.toBe(firstSnapshot);
    expect(changedSnapshot?.selectedAt).toBe("2026-05-31T01:00:00.000Z");
  });

  it("does not render a reading from a different app date", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-06-01" initialReading={foolReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain('data-daily-tarot-shuffle-intro="true"');
    expect(markup).not.toContain('data-daily-tarot-state="result"');
    expect(markup).not.toContain("The Fool");
  });
});
