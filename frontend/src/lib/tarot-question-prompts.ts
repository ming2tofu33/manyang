export type TarotQuestionStateKey =
  | "mind_complex"
  | "relationship_concern"
  | "work_blocked"
  | "reality_anxiety"
  | "decision_point"
  | "daily_signal";

export type TarotQuestionPrompt = {
  key: string;
  text: string;
};

export type TarotQuestionState = {
  key: TarotQuestionStateKey;
  label: string;
  representativeQuestion: string;
  questions: readonly TarotQuestionPrompt[];
};

export const tarotQuestionStates = [
  {
    key: "mind_complex",
    label: "마음이 복잡해",
    representativeQuestion: "오늘 내 마음이 붙잡고 있는 건 뭐야?",
    questions: [
      { key: "held_feeling", text: "오늘 내 마음이 붙잡고 있는 건 뭐야?" },
      { key: "unrecognized_feeling", text: "내가 인정하지 않고 있는 감정은?" },
      { key: "tiring_thought", text: "지금 나를 지치게 하는 생각은 어디서 오고 있을까?" },
      { key: "ease_point", text: "내 마음이 편해지려면 무엇을 봐야 할까?" },
      { key: "needed_attitude", text: "오늘 나에게 필요한 태도는?" },
    ],
  },
  {
    key: "relationship_concern",
    label: "관계가 신경 쓰여",
    representativeQuestion: "지금 이 관계에서 내가 봐야 할 마음은?",
    questions: [
      { key: "relationship_heart", text: "지금 이 관계에서 내가 봐야 할 마음은?" },
      { key: "between_us", text: "상대와 나 사이에 놓인 감정은?" },
      { key: "careful_feeling", text: "이 관계에서 조심해야 할 감정은?" },
      { key: "ease_clue", text: "관계를 더 편하게 만들 단서는?" },
      { key: "missed_part", text: "내가 이 관계에서 놓치고 있는 건?" },
    ],
  },
  {
    key: "work_blocked",
    label: "일이 막힌 느낌이야",
    representativeQuestion: "지금 이 일에서 가장 중요한 흐름은?",
    questions: [
      { key: "main_flow", text: "지금 이 일에서 가장 중요한 흐름은?" },
      { key: "focus_point", text: "오늘 내가 집중해야 할 핵심은?" },
      { key: "blocked_point", text: "막힌 일을 풀기 위해 봐야 할 지점은?" },
      { key: "next_direction", text: "이 프로젝트에서 다음으로 움직일 방향은?" },
      { key: "overholding", text: "지금 내가 너무 붙잡고 있는 건?" },
    ],
  },
  {
    key: "reality_anxiety",
    label: "돈이나 현실이 불안해",
    representativeQuestion: "지금 내 현실에서 점검해야 할 건 뭐야?",
    questions: [
      { key: "reality_check", text: "지금 내 현실에서 점검해야 할 건 뭐야?" },
      { key: "missed_resource", text: "돈이나 자원에서 놓치고 있는 부분은?" },
      { key: "stability_attitude", text: "안정감을 만들기 위해 필요한 태도는?" },
      { key: "keep_release", text: "지금 지켜야 할 것과 내려놓을 것은?" },
      { key: "next_practical_check", text: "현실적으로 다음에 확인해야 할 건?" },
    ],
  },
  {
    key: "decision_point",
    label: "선택을 앞두고 있어",
    representativeQuestion: "이 선택에서 내가 진짜 봐야 할 기준은?",
    questions: [
      { key: "real_criterion", text: "이 선택에서 내가 진짜 봐야 할 기준은?" },
      { key: "heart_or_reality", text: "마음과 현실 중 어디가 더 크게 말하고 있어?" },
      { key: "rushed_decision", text: "지금 성급하게 정하고 있는 건 없을까?" },
      { key: "before_next_step", text: "다음 한 걸음을 정하기 전에 확인할 것은?" },
      { key: "required_responsibility", text: "이 선택이 나에게 요구하는 책임은?" },
    ],
  },
  {
    key: "daily_signal",
    label: "그냥 오늘의 신호가 궁금해",
    representativeQuestion: "오늘 내가 놓치지 말아야 할 신호는?",
    questions: [
      { key: "missed_signal", text: "오늘 내가 놓치지 말아야 할 신호는?" },
      { key: "light_day", text: "오늘 하루를 가볍게 지나가려면 뭘 봐야 해?" },
      { key: "needed_attitude", text: "지금 나에게 필요한 태도는?" },
      { key: "helpful_energy", text: "오늘 나를 도와줄 에너지는?" },
      { key: "careful_flow", text: "오늘 조심해서 봐야 할 흐름은?" },
    ],
  },
] as const satisfies readonly TarotQuestionState[];

export function getTarotQuestionStateByKey(key: string): TarotQuestionState | null {
  return tarotQuestionStates.find((state) => state.key === key) ?? null;
}

export function getTarotQuestionByKey(stateKey: string, questionKey: string): TarotQuestionPrompt | null {
  return getTarotQuestionStateByKey(stateKey)?.questions.find((question) => question.key === questionKey) ?? null;
}
