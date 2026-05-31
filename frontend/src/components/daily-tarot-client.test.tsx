import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { dailyTarotStorageKey, type DailyTarotReading, type StorageLike } from "@/lib/daily-tarot";

import { DailyTarotClient, DailyTarotLoadingPanel, getStableDailyTarotReadingSnapshot } from "./daily-tarot-client";

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
  it("renders the draw-ready state with spread choices and generic face-down options", () => {
    const markup = renderToStaticMarkup(<DailyTarotClient appDate="2026-05-31" initialReading={null} />);

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain("오늘의 한 장");
    expect(markup).toContain("3장 리딩");
    expect(markup).toContain('data-daily-tarot-premium-tag="moon-pass"');
    expect(markup).toContain("Moon Pass");
    expect(markup).toContain('data-daily-tarot-deck');
    expect(markup).toContain("mx-[-2.5rem] h-[23rem]");
    expect(markup).toContain("w-[9.25rem]");
    expect(markup).toContain("22장 메이저 아르카나 덱");
    expect(markup).toContain("중앙 카드");
    expect(markup).toContain("이전 카드");
    expect(markup).toContain("다음 카드");
  });

  it("renders an existing LLM reading as the result without hidden options", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" initialReading={foolReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="result"');
    expect(markup).toContain('data-daily-tarot-result-card-size="large"');
    expect(markup).toContain('data-daily-tarot-zoom-trigger="true"');
    expect(markup).toContain('class="w-full text-center"');
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
    expect(markup).not.toContain('data-daily-tarot-state="result"');
    expect(markup).not.toContain("The Fool");
  });
});
