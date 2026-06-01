import { describe, expect, test } from "vitest";

import { getEncyclopediaEntriesForLocale } from "../src/services/encyclopedia-symbols";
import { symbolEntries } from "../src/data/symbol-encyclopedia";

describe("getEncyclopediaEntriesForLocale", () => {
  test("maps every active runtime symbol into the EncyclopediaEntry shape", () => {
    const entries = getEncyclopediaEntriesForLocale("ko");
    const activeCount = symbolEntries.filter((entry) => entry.status === "active").length;

    expect(entries.length).toBe(activeCount);
    expect(entries.length).toBeGreaterThan(36); // 레거시 36개보다 많아야 통합 의미가 있다

    for (const entry of entries) {
      expect(entry.symbol.length).toBeGreaterThan(0);
      expect(entry.slug.length).toBeGreaterThan(0);
      expect(entry.body.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.positiveReadings)).toBe(true);
      expect(Array.isArray(entry.negativeReadings)).toBe(true);
    }
  });

  test("uses runtime id as slug, light/shadow readings, and related labels", () => {
    const snake = getEncyclopediaEntriesForLocale("ko").find((entry) => entry.slug === "snake");

    expect(snake).toBeDefined();
    expect(snake?.symbol).toBe("뱀");
    expect(snake?.category).toBe("animal");
    expect(snake?.positiveReadings.length).toBeGreaterThan(0);
    // relatedSymbols는 id가 아니라 라벨이어야 한다(브라우즈 표시/링크용).
    expect(snake?.relatedSymbols.every((label) => !/^[a-z_]+$/.test(label))).toBe(true);
  });

  test("localizes into English", () => {
    const snakeEn = getEncyclopediaEntriesForLocale("en").find((entry) => entry.slug === "snake");

    expect(snakeEn?.symbol).toBe("Snake");
    expect(snakeEn?.body).not.toMatch(/[가-힣]/);
  });
});
