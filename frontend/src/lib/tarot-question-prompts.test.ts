import { describe, expect, test } from "vitest";

import {
  createCustomTarotQuestionPrompt,
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  maxCustomTarotQuestionLength,
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
      label: "내 마음이 궁금해",
    });
    expect(getTarotQuestionByKey("mind_complex", "held_feeling")).toMatchObject({
      text: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?",
    });
    expect(getTarotQuestionByKey("mind_complex", "missing")).toBeNull();
    expect(getTarotQuestionStateByKey("missing")).toBeNull();
  });

  test("uses conversational category labels and question wording", () => {
    expect(tarotQuestionStates.map((state) => state.label)).toEqual([
      "내 마음이 궁금해",
      "관계가 신경 쓰여",
      "일이 잘 안 풀려",
      "돈과 현실이 걱정돼",
      "결정해야 할 일이 있어",
      "오늘 하루가 궁금해",
    ]);

    expect(getTarotQuestionByKey("relationship_concern", "between_us")).toMatchObject({
      text: "상대와 나 사이에 어떤 감정이 놓여 있을까?",
    });
    expect(getTarotQuestionByKey("work_blocked", "main_flow")).toMatchObject({
      text: "지금 이 일에서 뭐가 제일 막혀 있을까?",
    });
    expect(getTarotQuestionByKey("decision_point", "required_responsibility")).toMatchObject({
      text: "이 선택을 하면 내가 감당해야 할 건 뭐야?",
    });
  });

  test("creates stable custom question prompts from normalized free text", () => {
    const question = createCustomTarotQuestionPrompt("  그 사람이   나를 어떻게 생각해?  ");
    const sameQuestion = createCustomTarotQuestionPrompt("그 사람이 나를 어떻게 생각해?");
    const otherQuestion = createCustomTarotQuestionPrompt("이직해도 될까?");

    expect(question).toMatchObject({
      key: expect.stringMatching(/^custom_[a-z0-9]+$/),
      text: "그 사람이 나를 어떻게 생각해?",
    });
    expect(sameQuestion?.key).toBe(question?.key);
    expect(otherQuestion?.key).not.toBe(question?.key);
  });

  test("rejects blank or overly long custom question prompts", () => {
    expect(createCustomTarotQuestionPrompt("   ")).toBeNull();
    expect(createCustomTarotQuestionPrompt("가".repeat(maxCustomTarotQuestionLength + 1))).toBeNull();
    expect(createCustomTarotQuestionPrompt("가".repeat(maxCustomTarotQuestionLength))).not.toBeNull();
  });
});
