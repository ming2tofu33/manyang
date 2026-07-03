import { describe, expect, test } from "vitest";

import {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
} from "./tarot-question-prompts";

describe("tarot question prompts", () => {
  test("defines six user states with five questions each", () => {
    expect(tarotQuestionStates).toHaveLength(6);

    for (const state of tarotQuestionStates) {
      expect(state.key).toMatch(/^[a-z_]+$/);
      expect(state.label.trim().length).toBeGreaterThan(0);
      expect(state.questions).toHaveLength(5);
      expect(new Set(state.questions.map((question) => question.key)).size).toBe(5);

      for (const question of state.questions) {
        expect(question.text).toContain("?");
        expect(question.text.length).toBeLessThanOrEqual(36);
      }
    }
  });

  test("looks up states and questions by stable keys", () => {
    expect(getTarotQuestionStateByKey("mind_complex")).toMatchObject({
      label: "마음이 복잡해",
    });
    expect(getTarotQuestionByKey("mind_complex", "held_feeling")).toMatchObject({
      text: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
    });
    expect(getTarotQuestionByKey("mind_complex", "missing")).toBeNull();
    expect(getTarotQuestionStateByKey("missing")).toBeNull();
  });
});
