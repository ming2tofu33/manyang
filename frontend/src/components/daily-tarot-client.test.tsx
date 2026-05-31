import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { dailyTarotStorageKey, type DailyTarotReading, type StorageLike } from "@/lib/daily-tarot";

import { DailyTarotClient, getStableDailyTarotReadingSnapshot } from "./daily-tarot-client";

const foolReading = {
  id: "daily-tarot-2026-05-31",
  spread: "daily_one_card",
  appDate: "2026-05-31",
  selectedAt: "2026-05-31T00:00:00.000Z",
  card: {
    id: 0,
    roman: "0",
    slug: "the-fool",
    nameEn: "THE FOOL",
    nameKo: "바보",
    image: "/manyang/tarot/major/00-the-fool.png",
    keywords: ["시작", "가능성"],
    visualSymbols: ["작은 보따리"],
    mood: "밝고 가벼운 출발의 분위기입니다.",
    upright: {
      summary: "새로운 시작",
      dailyFlow: "작은 시도가 방향을 바꿀 수 있습니다.",
      advice: "기본 준비를 확인하세요.",
    },
    reversed: {
      summary: "성급함",
      dailyFlow: "속도를 늦추는 편이 좋습니다.",
      advice: "안전장치를 먼저 세우세요.",
    },
    contexts: {
      love: "새로운 감각",
      career: "새 프로젝트",
      money: "충동 지출 주의",
      general: "가능성",
    },
  },
  orientation: "upright",
  position: "today",
  keywords: ["시작", "가능성"],
  title: "새로운 시작",
  message: "작은 시도가 방향을 바꿀 수 있습니다.",
  advice: "기본 준비를 확인하세요.",
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
  it("renders the draw-ready state with generic face-down options", () => {
    const markup = renderToStaticMarkup(<DailyTarotClient appDate="2026-05-31" initialReading={null} />);

    expect(markup).toContain('data-daily-tarot-state="draw-ready"');
    expect(markup).toContain("마음이 닿는 뒷면");
    expect(markup).toContain("정방향 카드 선택지");
    expect(markup).toContain("역방향 카드 선택지");
  });

  it("renders an existing initial reading as the result without hidden options", () => {
    const markup = renderToStaticMarkup(
      <DailyTarotClient appDate="2026-05-31" initialReading={foolReading} />,
    );

    expect(markup).toContain('data-daily-tarot-state="result"');
    expect(markup).toContain("바보");
    expect(markup).toContain("정방향");
    expect(markup).not.toContain("data-daily-tarot-option");
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
    expect(markup).not.toContain("바보");
  });
});
