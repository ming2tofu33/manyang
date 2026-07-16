import { describe, expect, test } from "vitest";

import * as contentRoot from "@manyang/content";
import * as contentTarot from "@manyang/content/tarot";
import * as contentQuestions from "@manyang/content/tarot/questions";
import type {
  TarotQuestionPrompt as RootTarotQuestionPrompt,
  TarotQuestionState as RootTarotQuestionState,
  TarotQuestionStateKey as RootTarotQuestionStateKey,
} from "@manyang/content";
import type {
  TarotQuestionPrompt as TarotEntryQuestionPrompt,
  TarotQuestionState as TarotEntryQuestionState,
  TarotQuestionStateKey as TarotEntryQuestionStateKey,
} from "@manyang/content/tarot";

import {
  getTarotQuestionByKey,
  getTarotQuestionStateByKey,
  tarotQuestionStates,
} from "./questions";

const expectedTarotQuestionStates = [
  {
    key: "mind_complex",
    label: "내 마음이 궁금해",
    representativeQuestion: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?",
    questions: [
      { key: "held_feeling", text: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?" },
      { key: "unrecognized_feeling", text: "내가 모른 척하고 있는 감정은 뭘까?" },
      { key: "tiring_thought", text: "요즘 나를 지치게 하는 생각은 뭐야?" },
      { key: "ease_point", text: "마음이 조금 편해지려면 뭘 봐야 할까?" },
      { key: "needed_attitude", text: "오늘 나에게 필요한 태도는 뭐야?" },
    ],
  },
  {
    key: "relationship_concern",
    label: "관계가 신경 쓰여",
    representativeQuestion: "지금 이 관계에서 내가 봐야 할 마음은 뭐야?",
    questions: [
      { key: "relationship_heart", text: "지금 이 관계에서 내가 봐야 할 마음은 뭐야?" },
      { key: "between_us", text: "상대와 나 사이에 어떤 감정이 놓여 있을까?" },
      { key: "careful_feeling", text: "이 관계에서 조심해야 할 감정은 뭐야?" },
      { key: "ease_clue", text: "관계가 조금 편해지려면 뭘 봐야 할까?" },
      { key: "missed_part", text: "내가 이 관계에서 놓치고 있는 건 뭐야?" },
    ],
  },
  {
    key: "work_blocked",
    label: "일이 잘 안 풀려",
    representativeQuestion: "지금 이 일에서 뭐가 제일 막혀 있을까?",
    questions: [
      { key: "main_flow", text: "지금 이 일에서 뭐가 제일 막혀 있을까?" },
      { key: "focus_point", text: "오늘 내가 집중해야 할 건 뭐야?" },
      { key: "blocked_point", text: "막힌 일을 풀려면 먼저 뭘 봐야 할까?" },
      { key: "next_direction", text: "다음으로 움직일 방향은 어디일까?" },
      { key: "overholding", text: "내가 너무 붙잡고 있는 건 없을까?" },
    ],
  },
  {
    key: "reality_anxiety",
    label: "돈과 현실이 걱정돼",
    representativeQuestion: "지금 현실적으로 먼저 확인할 건 뭐야?",
    questions: [
      { key: "reality_check", text: "지금 현실적으로 먼저 확인할 건 뭐야?" },
      { key: "missed_resource", text: "돈이나 자원에서 놓친 부분은 없을까?" },
      { key: "stability_attitude", text: "안정감을 만들려면 뭘 점검해야 할까?" },
      { key: "keep_release", text: "지금 지켜야 할 것과 내려놓을 건 뭐야?" },
      { key: "next_practical_check", text: "다음에 확인해야 할 숫자나 조건은 뭐야?" },
    ],
  },
  {
    key: "decision_point",
    label: "결정해야 할 일이 있어",
    representativeQuestion: "이 선택에서 먼저 봐야 할 건 뭐야?",
    questions: [
      { key: "real_criterion", text: "이 선택에서 먼저 봐야 할 건 뭐야?" },
      { key: "heart_or_reality", text: "마음과 현실 중 무엇을 더 봐야 할까?" },
      { key: "rushed_decision", text: "내가 너무 급하게 정하려는 건 없을까?" },
      { key: "before_next_step", text: "결정하기 전에 확인할 건 뭐야?" },
      { key: "required_responsibility", text: "이 선택을 하면 내가 감당해야 할 건 뭐야?" },
    ],
  },
  {
    key: "daily_signal",
    label: "오늘 하루가 궁금해",
    representativeQuestion: "오늘 내가 놓치지 말아야 할 건 뭐야?",
    questions: [
      { key: "missed_signal", text: "오늘 내가 놓치지 말아야 할 건 뭐야?" },
      { key: "light_day", text: "오늘을 가볍게 보내려면 뭘 봐야 할까?" },
      { key: "needed_attitude", text: "지금 나에게 필요한 태도는 뭐야?" },
      { key: "helpful_energy", text: "오늘 나를 도와줄 기운은 뭐야?" },
      { key: "careful_flow", text: "오늘 조심해서 볼 건 뭐야?" },
    ],
  },
] as const;

describe("shared tarot questions", () => {
  test("defines exactly six unique question states", () => {
    expect(tarotQuestionStates).toHaveLength(6);
    expect(new Set(tarotQuestionStates.map((state) => state.key)).size).toBe(6);
  });

  test("defines exactly five unique questions for every state", () => {
    for (const state of tarotQuestionStates) {
      expect(state.questions).toHaveLength(5);
      expect(new Set(state.questions.map((question) => question.key)).size).toBe(5);
    }
  });

  test("looks up states and questions by stable keys", () => {
    expect(getTarotQuestionStateByKey("mind_complex")).toMatchObject({
      key: "mind_complex",
      label: "내 마음이 궁금해",
      representativeQuestion: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?",
    });
    expect(getTarotQuestionByKey("mind_complex", "held_feeling")).toEqual({
      key: "held_feeling",
      text: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?",
    });
    expect(getTarotQuestionByKey("mind_complex", "missing")).toBeNull();
  });

  test("preserves every stable state and question key and string in order", () => {
    const stateProjection = tarotQuestionStates.map((state) => ({
      key: state.key,
      label: state.label,
      representativeQuestion: state.representativeQuestion,
      questions: state.questions.map((question) => ({
        key: question.key,
        text: question.text,
      })),
    }));

    expect(stateProjection).toEqual(expectedTarotQuestionStates);
  });

  test("exposes identical runtime APIs from every declared package entry point", () => {
    for (const entry of [contentRoot, contentTarot, contentQuestions]) {
      expect(entry.tarotQuestionStates).toBe(tarotQuestionStates);
      expect(entry.getTarotQuestionStateByKey).toBe(getTarotQuestionStateByKey);
      expect(entry.getTarotQuestionByKey).toBe(getTarotQuestionByKey);
      expect(entry.getTarotQuestionByKey("mind_complex", "held_feeling")).toEqual({
        key: "held_feeling",
        text: "지금 내 마음에 제일 크게 남아 있는 건 뭐야?",
      });
    }

    const rootState: RootTarotQuestionState | null = contentRoot.getTarotQuestionStateByKey("mind_complex");
    const rootPrompt: RootTarotQuestionPrompt | null = contentRoot.getTarotQuestionByKey(
      "mind_complex",
      "held_feeling",
    );
    const rootKey: RootTarotQuestionStateKey = "mind_complex";
    const tarotState: TarotEntryQuestionState | null = contentTarot.getTarotQuestionStateByKey(rootKey);
    const tarotPrompt: TarotEntryQuestionPrompt | null = contentTarot.getTarotQuestionByKey(
      rootKey,
      "held_feeling",
    );
    const tarotKey: TarotEntryQuestionStateKey = rootKey;

    expect([rootState?.key, rootPrompt?.key, tarotState?.key, tarotPrompt?.key, tarotKey]).toEqual([
      "mind_complex",
      "held_feeling",
      "mind_complex",
      "held_feeling",
      "mind_complex",
    ]);
  });
});
