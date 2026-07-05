import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import TarotPage, { dynamic } from "./page";

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
}));

vi.mock("@/lib/server/manyang-db", () => ({
  isAdminUser: async () => false,
}));

describe("tarot page rendering mode", () => {
  test("renders dynamically so the app date is not frozen at build time", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  test("links to question tarot without replacing the daily tarot surface", async () => {
    const markup = renderToStaticMarkup(await TarotPage({ searchParams: Promise.resolve({}) }));

    expect(markup).toContain('href="/tarot/question"');
    expect(markup).toContain("질문 타로");
    expect(markup).toContain("data-daily-tarot-page");
  });

  test("presents daily and question tarot as primary mode choices", async () => {
    const markup = renderToStaticMarkup(await TarotPage({ searchParams: Promise.resolve({}) }));

    expect(markup).toContain('data-tarot-mode-selector="true"');
    expect(markup).toContain('data-tarot-mode-option="daily"');
    expect(markup).toContain('data-tarot-mode-option="question"');
    expect(markup).toContain("오늘 하루의 분위기와 기준을 봐요");
    expect(markup).toContain("궁금한 주제를 고르고 한 장으로 비춰봐요");
    expect(markup.indexOf("오늘의 한 장")).toBeLessThan(markup.indexOf("질문 타로"));
  });
});
