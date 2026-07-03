import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { QuestionTarotClient } from "./question-tarot-client";

describe("QuestionTarotClient", () => {
  test("starts with state choices instead of raw question choices", () => {
    const markup = renderToStaticMarkup(
      <QuestionTarotClient appDate="2026-07-03" initialReading={null} initialUserId="user-1" />,
    );

    expect(markup).toContain('data-question-tarot-state="state-select"');
    expect(markup).toContain("마음이 복잡해");
    expect(markup).toContain("관계가 신경 쓰여");
    expect(markup).not.toContain("오늘 내 마음이 붙잡고 있는 건 뭐야?");
  });

  test("uses the question one-card spread in API request body", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "question-tarot-client.tsx"), "utf8");

    expect(source).toContain('spread: "question_one_card"');
    expect(source).toContain("questionContext");
    expect(source).toContain('unlockMethod: "daily_free"');
  });
});
