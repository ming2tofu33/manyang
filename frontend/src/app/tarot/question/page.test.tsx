import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import TarotQuestionPage, { dynamic } from "./page";

vi.mock("@/lib/pawprints", () => ({
  getPawprintAppDate: () => "2026-07-03",
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000001",
}));

describe("/tarot/question", () => {
  test("renders dynamically so the app date is not frozen at build time", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  test("renders the question tarot shell", async () => {
    const markup = renderToStaticMarkup(await TarotQuestionPage());

    expect(markup).toContain("질문 타로");
    expect(markup).toContain("궁금한 주제를 고르고 한 장으로 비춰봐요.");
    expect(markup).toContain("data-question-tarot-page");
    expect(markup).toContain('data-question-tarot-state="state-select"');
  });
});
