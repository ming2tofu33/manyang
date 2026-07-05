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
    expect(markup).toContain("지금 가장 궁금한 걸 골라주세요");
    expect(markup).toContain("내 마음이 궁금해");
    expect(markup).toContain("관계가 신경 쓰여");
    expect(markup).not.toContain("오늘 내 마음이 붙잡고 있는 건 뭐야?");
  });

  test("uses the question one-card spread in API request body", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "question-tarot-client.tsx"), "utf8");

    expect(source).toContain('spread: "question_one_card"');
    expect(source).toContain("questionContext");
    expect(source).toContain('unlockMethod: "daily_free"');
  });

  test("supports custom free-text questions inside a selected state", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "question-tarot-client.tsx"), "utf8");

    expect(source).toContain("createCustomTarotQuestionPrompt");
    expect(source).toContain("data-question-tarot-custom-question");
    expect(source).toContain("data-question-tarot-custom-submit");
    expect(source).toContain("직접 질문하기");
  });

  test("places custom question entry before suggested question buttons", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "question-tarot-client.tsx"), "utf8");

    expect(source.indexOf("직접 질문하기")).toBeLessThan(source.indexOf("selectedState.questions.map"));
    expect(source).toContain("또는 아래 질문에서 골라보세요");
  });
});
