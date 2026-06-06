import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  createDailyTarotOptions,
  dailyTarotStorageKey,
  type DailyTarotPosition,
  type DailyTarotReading,
  type StorageLike,
} from "@/lib/daily-tarot";
import { getTarotMajorCardById } from "@/lib/tarot-major-cards";

import {
  DailyTarotClient,
  DailyTarotLoadingPanel,
  DailyTarotPendingResult,
  DailyTarotRevealPanel,
  createPreparedDailyTarotSelections,
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
  symbolMeanings: [
    {
      symbol: "small bag",
      meaning: "The small bag keeps only what is needed for the first step.",
    },
  ],
  mood: "Bright beginning.",
  upright: {
    summary: "New beginning",
    dailyFlow: "A small attempt may shift the day.",
    cardMessage: "Check the basics first.",
    readingScene: "The card opens at the edge of a new path.",
  },
  reversed: {
    summary: "Rushed start",
    dailyFlow: "Slow down before moving.",
    cardMessage: "Make one safety check first.",
    readingScene: "The card tilts toward a start that needs one more look.",
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
    keywords: ["opening", "choice", "attention"],
    cardReadings: [],
    advice: "Check the basics first.",
  },
  keywords: ["start", "possibility"],
  title: "A small first step opens the day",
  message: "The selected Fool card is read as a day where a light first step matters more than waiting for perfect certainty.",
  advice: "Check the basics first.",
} satisfies DailyTarotReading;

function createMockTarotCard(id: number, nameKo: string, cardMessage: string) {
  return {
    ...foolCard,
    id,
    slug: `test-card-${id}`,
    nameEn: `TEST CARD ${id}`,
    nameKo,
    image: `/manyang/tarot/major/00-the-fool.png`,
    keywords: [`keyword-${id}`, `tone-${id}`],
    upright: {
      ...foolCard.upright,
      cardMessage,
      readingScene: `${nameKo} upright scene.`,
    },
    reversed: {
      ...foolCard.reversed,
      cardMessage: `${cardMessage} reversed`,
      readingScene: `${nameKo} reversed scene.`,
    },
  };
}

const threeCardReading = {
  ...foolReading,
  id: "daily-tarot-daily_three_card-2026-05-31",
  spread: "daily_three_card",
  card: createMockTarotCard(100, "상황 카드", "상황 카드는 지금 드러난 조건을 먼저 보라고 말합니다."),
  orientation: "upright",
  position: "situation",
  cards: [
    {
      position: "situation",
      orientation: "upright",
      card: createMockTarotCard(100, "상황 카드", "상황 카드는 지금 드러난 조건을 먼저 보라고 말합니다."),
    },
    {
      position: "flow",
      orientation: "upright",
      card: createMockTarotCard(101, "다음 장면 카드", "다음 장면 카드는 뒤따르는 변화를 너무 빨리 단정하지 말라고 말합니다."),
    },
    {
      position: "advice",
      orientation: "upright",
      card: createMockTarotCard(102, "조언 카드", "조언 카드는 이미 확인한 단서를 기준으로 선택하라고 말합니다."),
    },
  ],
  generated: {
    title: "세 장이 이어서 보여주는 오늘",
    overview: "세 장의 카드는 현재의 조건, 뒤따르는 변화, 마지막 판단 기준을 한 번에 묶어 읽도록 구성되어 있습니다.",
    keywords: ["condition", "next", "choice"],
    cardReadings: [
      {
        position: "situation",
        heading: "지금의 상태",
        reading: "상황 카드는 현재 장면을 설명합니다.",
      },
      {
        position: "flow",
        heading: "이어지는 국면",
        reading: "다음 장면 카드는 뒤따르는 변화를 설명합니다.",
      },
      {
        position: "advice",
        heading: "판단 기준",
        reading: "조언 카드는 마지막 기준을 설명합니다.",
      },
    ],
    advice: "조언 카드는 이미 확인한 단서를 기준으로 선택하라고 말합니다.",
  },
  title: "세 장이 이어서 보여주는 오늘",
  message: "세 장의 카드는 현재의 조건, 뒤따르는 변화, 마지막 판단 기준을 한 번에 묶어 읽도록 구성되어 있습니다.",
  advice: "조언 카드는 이미 확인한 단서를 기준으로 선택하라고 말합니다.",
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
  it("uses the initial user id to render a user-specific face-down deck", () => {
    const firstUserMarkup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-06-02" initialReading={null} initialUserId="user-first" />,
    );
    const secondUserMarkup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-06-02" initialReading={null} initialUserId="user-second" />,
    );

    expect(firstUserMarkup).toContain("data-daily-tarot-option=");
    expect(secondUserMarkup).toContain("data-daily-tarot-option=");
    expect(firstUserMarkup).not.toEqual(secondUserMarkup);
  });

  it("renders the shuffling intro over ready face-down options", () => {
    const markup = renderToStaticMarkup(<DailyTarotClient appDate="2026-05-31" initialReading={null} />);

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain('data-daily-tarot-draw-stage="true"');
    expect(markup).toContain('data-daily-tarot-shuffle-intro="true"');
    expect(markup).toContain("tarot-draw-stage-shuffling");
    expect(markup).toContain("tarot-shuffle-intro");
    expect(markup).not.toContain("rounded-[1.2rem] bg-[#05040b]");
    expect(markup).toContain("카드를 섞고 있어요");
    expect(markup).toContain("마음이 닿는 뒷면을 터치해 오늘의 카드를 열어보세요.");
    expect(markup).not.toContain("h-[11rem] w-[11rem]");
    expect(markup).not.toContain("bg-[#f2c27d]/7");
    expect(markup).toContain("오늘의 한 장");
    expect(markup).toContain("3장 리딩");
    expect(markup).toContain('data-daily-tarot-free-event-tag="tarot-three-card"');
    expect(markup).toContain("무료 이벤트");
    expect(markup).not.toContain('data-daily-tarot-premium-tag="moon-pass"');
    expect(markup).toContain('data-daily-tarot-deck');
    expect(markup).not.toContain("타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.");
  });

  it("uses the same opening card prompt before position-specific three-card picks", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");

    expect(source).toContain('const initialDrawInstruction = "마음이 닿는 뒷면을 터치해 오늘의 카드를 열어보세요."');
    expect(source).toContain("pendingSelections.length === 0");
    expect(source).toContain(': selectedSpread === "daily_three_card"');
    expect(source).toContain("`${positionLabels[nextPosition]} 카드를 골라 주세요.`");
  });

  it("prepares fixed cards for the current spread before the user opens a card", () => {
    const options = createDailyTarotOptions("2026-06-02", { drawIdentityKey: "user:early-request" });
    const positions = ["situation", "flow", "advice"] satisfies DailyTarotPosition[];
    const preparedSelections = createPreparedDailyTarotSelections(options, positions);
    const centerIndex = Math.floor(options.length / 2);

    expect(preparedSelections).toHaveLength(3);
    expect(preparedSelections.map((selection) => selection.position)).toEqual(positions);
    expect(preparedSelections.map((selection) => selection.card.id)).toEqual([
      options[centerIndex]?.cardId,
      options[centerIndex + 1]?.cardId,
      options[centerIndex + 2]?.cardId,
    ]);
    expect(preparedSelections.map((selection) => selection.orientation)).toEqual([
      options[centerIndex]?.orientation,
      options[centerIndex + 1]?.orientation,
      options[centerIndex + 2]?.orientation,
    ]);
  });

  it("starts the tarot reading request from prepared shuffle selections before card selection", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");
    const preselectStart = source.indexOf("const preparedSelections = useMemo");
    const effectStart = source.indexOf("void submitSelections(preparedSelections");
    const handleSelectStart = source.indexOf("function handleSelect");

    expect(preselectStart).toBeGreaterThanOrEqual(0);
    expect(effectStart).toBeGreaterThan(preselectStart);
    expect(handleSelectStart).toBeGreaterThan(effectStart);
    expect(source).toContain("updatePendingSelections: false");
    expect(source).toContain("preparedSelections[pendingSelections.length]");
  });

  it("keeps prefetched tarot readings hidden until the prepared cards are opened", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");

    expect(source).toContain("openedReadingRequestKey");
    expect(source).toContain("openedSelectedReadingForDate");
    expect(source).toContain("setOpenedReadingRequestKey(preparedRequestKey)");
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
    expect(markup).toContain("바보");
    expect(markup).toContain("오늘의 타로");
    expect(markup).not.toContain("A small first step opens the day");
    expect(markup).not.toContain('data-daily-tarot-card-story="true"');
    expect(markup).not.toContain("카드가 전하는 이야기");
    expect(markup).not.toContain("The card tells a story about stepping into a new path");
    expect(markup).not.toContain("카드 속 상징");
    expect(markup).not.toContain("오늘의 질문");
    expect(markup).not.toContain("작은 조언");
    expect(markup).toContain('data-daily-tarot-keywords="true"');
    expect(markup).toContain("opening");
    expect(markup).toContain("choice");
    expect(markup).toContain("attention");
    expect(markup).not.toContain('data-daily-tarot-symbol-readings="true"');
    expect(markup).not.toContain('data-daily-tarot-symbol-reading="true"');
    expect(markup).not.toContain("keeping only the essentials close");
    expect(markup).not.toContain("cliff edge");
    expect(markup).toContain('data-daily-tarot-result-actions="true"');
    expect(markup).toContain("저장하기");
    expect(markup).toContain("공유하기");
    expect(markup).not.toContain("오늘 ·");
    expect(markup).toContain("3장 리딩");
    expect(markup).toContain('data-daily-tarot-free-event-tag="tarot-three-card"');
    expect(markup).toContain("무료 이벤트");
    expect(markup).not.toContain('data-daily-tarot-premium-tag="moon-pass"');
    expect(markup).not.toContain("data-daily-tarot-option");
    expect(markup).toContain("타로는 오늘의 흐름을 상징적으로 비춰보는 참고용 안내입니다.");
  });

  it("can ignore an existing reading when admin tarot test mode starts a fresh flow", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" ignoreStoredReading initialReading={foolReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain('data-daily-tarot-option=');
    expect(markup).not.toContain('data-daily-tarot-state="result"');
    expect(markup).not.toContain("A small first step opens the day");
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

  it("shows a concise pending result while the personalized tarot reading is still generating", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotPendingResult selections={foolReading.cards ?? []} />,
    );

    expect(markup).toContain('data-daily-tarot-state="generating-result"');
    expect(markup).not.toContain('data-daily-tarot-card-story="true"');
    expect(markup).not.toContain("카드가 전하는 이야기");
    expect(markup).not.toContain("오늘의 질문");
    expect(markup).not.toContain("작은 조언");
    expect(markup).toContain('data-daily-tarot-reading-loading="true"');
    expect(markup).toContain('data-daily-tarot-fixed-guidance="true"');
    expect(markup).toContain("카드 메시지");
    expect(markup).not.toContain("카드가 먼저 건네는 조언");
    expect(markup).toContain(getTarotMajorCardById(0)?.keywords[0] ?? "");
    expect(markup).toContain(getTarotMajorCardById(0)?.keywords[1] ?? "");
    expect(markup).toContain(getTarotMajorCardById(0)?.upright.cardMessage ?? "");
    expect(markup).toContain("오늘의 리딩을 완성하고 있어요");
    expect(markup).toContain("선택한 카드와 방향을 기준으로 오늘의 흐름을 읽고 있어요.");
    expect(markup).not.toContain('data-daily-tarot-result-copy="true"');
    expect(markup).not.toContain('data-daily-tarot-loading="true"');
    expect(markup).not.toContain('data-daily-tarot-result-actions="true"');
    expect(markup).not.toContain("저장하기");
    expect(markup).not.toContain("공유하기");
  });

  it("shows every selected card message while a three-card tarot reading is generating", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotPendingResult selections={threeCardReading.cards ?? []} />,
    );

    expect(markup).toContain('data-daily-tarot-card-messages="true"');
    expect(markup).toContain("상황 카드");
    expect(markup).toContain("다음 장면 카드");
    expect(markup).toContain("조언 카드");
    expect(markup).toContain("상황 카드는 지금 드러난 조건을 먼저 보라고 말합니다.");
    expect(markup).toContain("다음 장면 카드는 뒤따르는 변화를 너무 빨리 단정하지 말라고 말합니다.");
    expect(markup).toContain("조언 카드는 이미 확인한 단서를 기준으로 선택하라고 말합니다.");
  });

  it("shows every selected card message in the completed three-card result", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" initialReading={threeCardReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="result"');
    expect(markup).toContain('data-daily-tarot-card-messages="true"');
    expect(markup).toContain("상황 카드는 지금 드러난 조건을 먼저 보라고 말합니다.");
    expect(markup).toContain("다음 장면 카드는 뒤따르는 변화를 너무 빨리 단정하지 말라고 말합니다.");
    expect(markup).toContain("조언 카드는 이미 확인한 단서를 기준으로 선택하라고 말합니다.");
  });

  it("does not expand the interpreting card before showing the result", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotLoadingPanel selections={foolReading.cards ?? []} />,
    );
    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");
    const styles = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");

    expect(markup).not.toContain('data-daily-tarot-loading-to-result="true"');
    expect(markup).not.toContain("tarot-loading-to-result");
    expect(markup).not.toContain("tarot-loading-card-to-result");
    expect(markup).not.toContain("--tarot-loading-card-result-scale");
    expect(source).not.toContain("tarotResultTransitionMs");
    expect(source).not.toContain("transitioning-to-result");
    expect(styles).not.toContain("tarot-loading-card-to-result");
    expect(styles).not.toContain("@keyframes tarot-loading-card-to-result");
  });

  it("uses the prepared tarot request before waiting for the reveal timer", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "components", "daily-tarot-client.tsx"), "utf8");
    const handleSelectStart = source.indexOf("function handleSelect");
    const handleRetryStart = source.indexOf("function handleRetry");
    const handleSelectSource = source.slice(handleSelectStart, handleRetryStart);

    expect(handleSelectStart).toBeGreaterThanOrEqual(0);
    expect(handleRetryStart).toBeGreaterThan(handleSelectStart);
    const preparedSelectionStart = handleSelectSource.indexOf("preparedSelections[pendingSelections.length]");
    const fallbackRequestStart = handleSelectSource.indexOf("void submitSelections(nextSelections");
    const revealTimerStart = handleSelectSource.indexOf("revealTimerRef.current = setTimeout");

    expect(preparedSelectionStart).toBeGreaterThanOrEqual(0);
    expect(fallbackRequestStart).toBeGreaterThanOrEqual(0);
    expect(revealTimerStart).toBeGreaterThanOrEqual(0);
    expect(preparedSelectionStart).toBeLessThan(revealTimerStart);
    expect(fallbackRequestStart).toBeLessThan(revealTimerStart);
    expect(source).toContain("isGenerating && pendingSelections.length === positions.length");
    expect(source).toContain("<DailyTarotPendingResult selections={pendingSelections} />");
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
