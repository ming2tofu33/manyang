// 만양 해몽 "내용 채점" rubric (LLM-judge + 결정론 게이트).
//
// 0to1log의 채점 컨벤션(중첩 {group:{sub:{evidence,score:0-10}}} + issues + 0-100 집계 +
// 결정론 결합)을 만양에 맞춰 변형한 것:
//  - 만양은 꿈 운세라 "정답"이 없다. 그래서 judge는 절대적 진실이 아니라 *제공된 evidence
//    (이 꿈에 대해 검색해 온 심볼 전승) 대비*로 "지어냈는지/근거 있는지"를 채점한다.
//  - 0to1log엔 없는 만양 고유 축 'resonance(위로·정서적 울림)'를 점수에 넣는다.
//  - safety/voice/fabrication/fallback 같은 binary는 LLM이 아니라 결정론 regex 게이트로(공짜·정확).
//  - 가중치는 만양 우선순위(신뢰 먼저): ownership+sense > resonance > delight > depth.
import type { DreamAnalysisRequest, DreamAnalysisResponse } from "../contracts/dream";
import type { DreamReadingLlmProvider } from "./llm-provider";

export type RubricLocale = NonNullable<DreamAnalysisRequest["locale"]>;

export type RubricSubScore = {
  /** 왜 그 점수인지 — 해몽 본문에서 인용/근거 (숫자만이 아니라 근거 강제). */
  evidence: string;
  /** 0-10. */
  score: number;
};

/** 추출 recall — score + 꿈에 또렷한데 놓친 심볼 목록. */
export type RubricRecallSub = RubricSubScore & { missedSymbols: string[] };
/** 추출 precision — score + 추출됐지만 꿈에 없는 심볼 목록. */
export type RubricPrecisionSub = RubricSubScore & { spuriousSymbols: string[] };

/** LLM judge가 채점하는 품질 (제공된 evidence 대비 + 추출 대조 + 게슈탈트). */
export type RubricGroups = {
  /** 심볼 추출 품질 — judge가 꿈을 독립 분석해 추출본과 대조. */
  extraction: { recall: RubricRecallSub; precision: RubricPrecisionSub };
  /** 내 꿈인가 — 일반론 아님 = "아무말" 아님. */
  ownership: { sceneBinding: RubricSubScore; nonGeneric: RubricSubScore };
  /** 말이 되는가 — 꿈→의미가 evidence에서 벌어들여졌나. */
  sense: { coherence: RubricSubScore };
  /** 마음에 닿는가 — 만양 고유: 위로 + 고른 감정에 닿음. */
  resonance: { warmth: RubricSubScore; landsOnFeeling: RubricSubScore };
  /** 재미/예측 — 또렷 + 전통프레임 운세. */
  delight: { fortuneClarity: RubricSubScore; folkFraming: RubricSubScore };
  /** 풍부 — 충실·padding 아님. */
  depth: { development: RubricSubScore };
  /** 전체 게슈탈트 — 꿈 원문 대비 통째로 좋은 해석인가 (한 방). */
  overall: { gestalt: RubricSubScore };
};

export type RubricIssueType = "safety" | "fabrication" | "voice" | "fallback";

export type RubricIssue = {
  type: RubricIssueType;
  severity: "critical" | "major" | "minor";
  evidence: string;
};

export type RubricResult = {
  groups: RubricGroups;
  issues: RubricIssue[];
  /** 모든 sub-score 평균(0-10) × 10 — 0to1log 기본 집계. */
  rawScore: number;
  /** group 가중치 적용(만양 우선순위) 후 0-100. */
  weightedScore: number;
  /** weightedScore에 issue 캡/감점 적용한 최종 0-100. */
  finalScore: number;
  verdict: string;
};

/** judge에게 넘기는 입력 — 채점 대상 해몽 + "근거"가 된 심볼 전승. */
export type RubricEvidenceSymbol = {
  label: string;
  coreMeanings: string[];
  lightReadings: string[];
  shadowReadings: string[];
  fortune?: unknown;
};

export type ScoreDreamReadingInput = {
  dreamText: string;
  reading: Pick<DreamAnalysisResponse, "summary" | "interpretation" | "symbolReadings">;
  /** 이 꿈에 대해 확정된(confirmed) 심볼 전승. judge는 이것 대비로 근거성을 본다. */
  confirmedEvidence: RubricEvidenceSymbol[];
  /** 사용자가 고른 감정/감각 라벨 (resonance.landsOnFeeling 채점용). */
  selectedFeelings?: string[];
  locale?: RubricLocale;
};

// ── group 가중치 (만양 우선순위: 신뢰 먼저) ───────────────────────────────────
export const RUBRIC_GROUP_WEIGHTS = {
  extraction: 0.15,
  ownership: 0.22,
  sense: 0.13,
  resonance: 0.2,
  delight: 0.12,
  depth: 0.08,
  overall: 0.1,
} as const;

// ── issue 캡/감점 ────────────────────────────────────────────────────────────
// critical safety는 다른 점수와 무관하게 하드 캡(실격에 가깝게).
const ISSUE_CAPS: Record<RubricIssueType, number> = {
  safety: 25, // 건강·죽음 예언 누출 → 25점으로 캡
  fallback: 45, // 진짜 해몽이 아니라 baseline 폴백 → 45 캡
  fabrication: 100, // 캡은 없고 감점만
  voice: 100,
};
const ISSUE_PENALTIES: Record<RubricIssueType, number> = {
  fabrication: 25, // 지어낸 심볼 = 만양 #1 문제 → 강한 감점
  voice: 8, // 냥/기계용어 등 → 가벼운 감점(누적)
  safety: 0, // 캡으로 처리
  fallback: 0, // 캡으로 처리
};

export const DREAM_RUBRIC_SCHEMA_NAME = "dream_reading_rubric";

function subScoreSchema(description: string) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      evidence: { type: "string", minLength: 1, description },
      score: { type: "integer", minimum: 0, maximum: 10 },
    },
    required: ["evidence", "score"],
  } as const;
}

const symbolListSchema = {
  type: "array",
  items: { type: "string", minLength: 1 },
} as const;

export const DREAM_RUBRIC_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    extraction: {
      type: "object",
      additionalProperties: false,
      properties: {
        recall: {
          type: "object",
          additionalProperties: false,
          properties: {
            evidence: { type: "string", minLength: 1, description: "꿈에 또렷한 핵심 심볼을 다 잡았나 판단 근거" },
            score: { type: "integer", minimum: 0, maximum: 10 },
            missedSymbols: { ...symbolListSchema, description: "꿈에 또렷이 있는데 추출본에 없는 심볼(없으면 빈 배열)" },
          },
          required: ["evidence", "score", "missedSymbols"],
        },
        precision: {
          type: "object",
          additionalProperties: false,
          properties: {
            evidence: { type: "string", minLength: 1, description: "추출본이 꿈에 실제로 있는 것들로만 됐나 판단 근거" },
            score: { type: "integer", minimum: 0, maximum: 10 },
            spuriousSymbols: { ...symbolListSchema, description: "추출됐지만 꿈에 없는 심볼(없으면 빈 배열)" },
          },
          required: ["evidence", "score", "spuriousSymbols"],
        },
      },
      required: ["recall", "precision"],
    },
    ownership: {
      type: "object",
      additionalProperties: false,
      properties: {
        sceneBinding: subScoreSchema("이 꿈의 구체 디테일(수량·행동·장소·감정)에 의미가 묶였나"),
        nonGeneric: subScoreSchema("다른 꿈에 복붙 가능한 일반론이 아닌가"),
      },
      required: ["sceneBinding", "nonGeneric"],
    },
    sense: {
      type: "object",
      additionalProperties: false,
      properties: {
        coherence: subScoreSchema("꿈→의미 논리가 제공된 근거에서 매끄럽게 이어지나(비약·모순 없음)"),
      },
      required: ["coherence"],
    },
    resonance: {
      type: "object",
      additionalProperties: false,
      properties: {
        warmth: subScoreSchema("촛불 켜고 읽어주는 따뜻한 고양이처럼 포근하고 위로가 되나"),
        landsOnFeeling: subScoreSchema("사용자가 고른 감정/감각에 닿나(없으면 꿈의 정서에 닿나)"),
      },
      required: ["warmth", "landsOnFeeling"],
    },
    delight: {
      type: "object",
      additionalProperties: false,
      properties: {
        fortuneClarity: subScoreSchema("적절할 때 또렷하고 스샷각인 운세/예측을 주나"),
        folkFraming: subScoreSchema("그 운세가 전통 프레임 안에서 책임 있게(과잉예언 아님) 전달되나"),
      },
      required: ["fortuneClarity", "folkFraming"],
    },
    depth: {
      type: "object",
      additionalProperties: false,
      properties: {
        development: subScoreSchema("충분히 전개되었나(여러 각도), padding으로 부풀리지 않았나"),
      },
      required: ["development"],
    },
    overall: {
      type: "object",
      additionalProperties: false,
      properties: {
        gestalt: subScoreSchema("꿈 원문과 같이 읽었을 때 통째로 만족스럽고 설득력 있는 해석인가(한 방 게슈탈트)"),
      },
      required: ["gestalt"],
    },
    verdict: { type: "string", minLength: 1, description: "한 줄 총평" },
  },
  required: ["extraction", "ownership", "sense", "resonance", "delight", "depth", "overall", "verdict"],
} as const;

export function buildRubricJudgePrompt(input: ScoreDreamReadingInput): { instructions: string; input: string } {
  const locale = input.locale ?? "ko";
  const payload = {
    dreamText: input.dreamText,
    reading: input.reading,
    confirmedEvidence: input.confirmedEvidence,
    extractedSymbols: input.confirmedEvidence.map((e) => e.label),
    selectedFeelings: input.selectedFeelings ?? [],
  };

  return {
    instructions: [
      "You are a strict quality judge for Manyang, a cat-themed dream-fortune reader.",
      "A dream has NO correct interpretation, so do NOT judge against an absolute truth.",
      "FIRST, read the dreamText yourself and decide which concrete dream symbols it clearly contains, INDEPENDENTLY of the system. Then compare your list with extractedSymbols (what the system pulled) to score extraction.",
      "extraction.recall: a SYMBOL here is a concrete dream NOUN only — an object, animal, person, place, body part, food, or named event (e.g. 돼지, 강, 할머니, 절, 이/이빨). A verb, adjective, adverb, feeling, or descriptive phrase is NOT a symbol: words like 들어왔어, 뛰어들었어, 휘날리며, 천천히, 다가왔어, 흐릿한, 불안, 쥐여주셨어 must NOT be listed as missed. Score 10 if every important NOUN symbol of the dream is in extractedSymbols; list ONLY genuine missing noun symbols in missedSymbols (empty array if none). A missed key symbol means the reading was built on incomplete material — score it low.",
      "extraction.precision: score 10 only if every extractedSymbol is actually present in the dream. List any extracted symbol that is NOT really in the dream in spuriousSymbols; empty array if none. (A symbol matched only as background or by a homonym counts as spurious.)",
      "overall.gestalt: step back and read the dream and the whole reading together — as a WHOLE, is this a satisfying, convincing reading of THIS dream? This is a holistic gut judgment, not the average of the other sub-scores.",
      "Judge GROUNDEDNESS strictly against the provided confirmedEvidence and the dreamText: a meaning is grounded only if it traces to a confirmed symbol's lore (coreMeanings/lightReadings/shadowReadings/fortune) or to a concrete detail the user actually wrote. A meaning invented beyond that evidence is fabrication and must score low on ownership and sense.",
      "Score every sub-score from 0 to 10 and give a short evidence string for each — quote or point to the exact part of the reading (or dream) that justifies the score. Never give a score without evidence.",
      "ownership.sceneBinding: high only if the reading ties meanings to THIS dream's specific details (quantity, action, place, feeling). ownership.nonGeneric: low if sentences could be pasted onto a different dream.",
      "Treat the both-ways conditional pattern ('만약 X였다면 …, 반대로 Y였다면 …', 'X였다면 ~일 수 있습니다') as a HEDGE that offloads the interpretation back to the reader and covers itself against being wrong — it is NOT specificity. Naming a dream detail inside such a hedge does not make it grounded. A reading that leans on these both-ways conditionals must score LOWER on nonGeneric and coherence, not higher.",
      "sense.coherence: does the dream→meaning logic hold without leaps or contradictions, staying within the evidence.",
      "resonance.warmth: does it feel like a warm cat reading by candlelight (comforting), not a clinical or robotic note. resonance.landsOnFeeling: does it meet the user's selectedFeelings (or, if none, the dream's own emotional tone).",
      "delight.fortuneClarity: a fortune scores high ONLY if it commits to a concrete, vivid verdict. A fortune hedged as a faint possibility ('작은 소망이 닿을 가능성을 조용히 품고', '~일 수 있습니다') or with no sense of what/when/how-much is NOT clear and must score low (3-5). delight.folkFraming: is that fortune framed as traditional folk reading and kept responsible (no absolute guarantee, no health/death claims).",
      "depth.development: is it developed from multiple angles and substantial, without padding or repetition.",
      "Be strict, not lenient. Anchors: 9-10 = genuinely excellent and committed; 7 = good but with a real flaw; 5 = mediocre or generic; 0-2 = failing. Most readings have at least one real weakness and should NOT sit in the 8-10 band on every sub-score.",
      "CRITICAL — your score must agree with your own evidence. If the evidence you write names a weakness, the score must reflect it: if you call a sentence 'could be pasted onto another dream' or 'generic' or 'a common consolation line', nonGeneric must be ≤ 4; if you note the fortune is hedged or has no timing/scale, fortuneClarity must be ≤ 5. Never write evidence that describes a flaw and then give a high score.",
      "A reading that mostly hedges, stays generic, or offloads the meaning to the reader should land in the 60s-70s overall — not the 80s.",
      `Return ${locale === "en" ? "English" : "Korean"} JSON matching the schema exactly.`,
    ].join("\n"),
    input: JSON.stringify(payload),
  };
}

function isSubScore(value: unknown): value is RubricSubScore {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as RubricSubScore).evidence === "string" &&
    typeof (value as RubricSubScore).score === "number"
  );
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, value));
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];
}

/** judge 응답을 RubricGroups로 검증/파싱. 실패 시 null. */
export function parseRubricGroups(raw: unknown): { groups: RubricGroups; verdict: string } | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const r = raw as Record<string, any>;
  const subs: Array<[string, string]> = [
    ["extraction", "recall"],
    ["extraction", "precision"],
    ["ownership", "sceneBinding"],
    ["ownership", "nonGeneric"],
    ["sense", "coherence"],
    ["resonance", "warmth"],
    ["resonance", "landsOnFeeling"],
    ["delight", "fortuneClarity"],
    ["delight", "folkFraming"],
    ["depth", "development"],
    ["overall", "gestalt"],
  ];
  for (const [group, sub] of subs) {
    if (!isSubScore(r[group]?.[sub])) {
      return null;
    }
  }
  const clamp = (g: string, s: string): RubricSubScore => ({
    evidence: String(r[g][s].evidence),
    score: clampScore(Number(r[g][s].score)),
  });

  return {
    groups: {
      extraction: {
        recall: { ...clamp("extraction", "recall"), missedSymbols: stringList(r.extraction.recall.missedSymbols) },
        precision: { ...clamp("extraction", "precision"), spuriousSymbols: stringList(r.extraction.precision.spuriousSymbols) },
      },
      ownership: { sceneBinding: clamp("ownership", "sceneBinding"), nonGeneric: clamp("ownership", "nonGeneric") },
      sense: { coherence: clamp("sense", "coherence") },
      resonance: { warmth: clamp("resonance", "warmth"), landsOnFeeling: clamp("resonance", "landsOnFeeling") },
      delight: { fortuneClarity: clamp("delight", "fortuneClarity"), folkFraming: clamp("delight", "folkFraming") },
      depth: { development: clamp("depth", "development") },
      overall: { gestalt: clamp("overall", "gestalt") },
    },
    verdict: typeof r.verdict === "string" ? r.verdict : "",
  };
}

function groupAverage(group: Record<string, RubricSubScore>): number {
  const scores = Object.values(group).map((s) => s.score);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** 모든 sub-score 평균(0-10) × 10 → 0-100 (0to1log 기본 집계). */
export function rawScoreFromGroups(groups: RubricGroups): number {
  const all = [
    groups.extraction.recall,
    groups.extraction.precision,
    groups.ownership.sceneBinding,
    groups.ownership.nonGeneric,
    groups.sense.coherence,
    groups.resonance.warmth,
    groups.resonance.landsOnFeeling,
    groups.delight.fortuneClarity,
    groups.delight.folkFraming,
    groups.depth.development,
    groups.overall.gestalt,
  ].map((s) => s.score);
  return Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10);
}

/** group 가중치(만양 우선순위) 적용 → 0-100. */
export function weightedScoreFromGroups(groups: RubricGroups): number {
  const perGroup = {
    extraction: groupAverage(groups.extraction),
    ownership: groupAverage(groups.ownership),
    sense: groupAverage(groups.sense),
    resonance: groupAverage(groups.resonance),
    delight: groupAverage(groups.delight),
    depth: groupAverage(groups.depth),
    overall: groupAverage(groups.overall),
  };
  const weighted =
    perGroup.extraction * RUBRIC_GROUP_WEIGHTS.extraction +
    perGroup.ownership * RUBRIC_GROUP_WEIGHTS.ownership +
    perGroup.sense * RUBRIC_GROUP_WEIGHTS.sense +
    perGroup.resonance * RUBRIC_GROUP_WEIGHTS.resonance +
    perGroup.delight * RUBRIC_GROUP_WEIGHTS.delight +
    perGroup.depth * RUBRIC_GROUP_WEIGHTS.depth +
    perGroup.overall * RUBRIC_GROUP_WEIGHTS.overall;
  return Math.round(weighted * 10);
}

/** issue 캡/감점 적용. */
export function applyIssuePenalties(weightedScore: number, issues: RubricIssue[]): number {
  let score = weightedScore;
  for (const issue of issues) {
    score = Math.min(score, ISSUE_CAPS[issue.type]);
    score -= ISSUE_PENALTIES[issue.type];
  }
  return Math.max(0, Math.round(score));
}

// ── 결정론 게이트 (LLM 없이 — binary는 regex가 더 정확) ──────────────────────
const SAFETY_PATTERNS: RegExp[] = [
  /(질병|병|암|건강)[^.!?\n]{0,12}(예지|예언|걸린|걸릴|생긴|생길|나빠|악화)/u,
  /(죽|사망|임종)[^.!?\n]{0,8}(예지|예언|할\s*것|한다는|닥|운명)/u,
  /(반드시|무조건|틀림없이|분명히)[^.!?\n]{0,12}(된다|됩니다|이뤄|생긴|온다|옵니다|받는다)/u,
];
const VOICE_NYANG = /(?:다|자|요|죠|네|어|아|구|군)냥(?=[\s.!?,)"']|$)/u;
const VOICE_JARGON = /(근거(?:로|가|는)?|증거|evidence|retrieval|검색된|장면\s*수정자|sceneModifier|modifier|candidate)/iu;
const FALLBACK_INTERP = /단정하긴\s*어렵지만/u;
const FALLBACK_SUMMARY = /특히\s*남은\s*꿈\s*$/u;

/** 해몽 본문 + 확정 심볼 라벨로부터 결정론 issue를 뽑는다. */
export function detectDeterministicIssues(
  reading: ScoreDreamReadingInput["reading"],
  confirmedLabels: string[],
  _locale: RubricLocale = "ko",
): RubricIssue[] {
  const issues: RubricIssue[] = [];
  const body = `${reading.summary}\n${reading.interpretation}`;
  const confirmedSet = new Set(confirmedLabels.map((l) => l.trim().toLowerCase()));

  for (const pattern of SAFETY_PATTERNS) {
    const m = body.match(pattern);
    if (m) {
      issues.push({ type: "safety", severity: "critical", evidence: m[0] });
      break;
    }
  }

  // fabrication: symbolReadings에 확정 안 된 심볼이 들어감 (= 지어낸 상징 해석)
  const fabricated = reading.symbolReadings
    .map((s) => s.symbol)
    .filter((sym) => sym && !confirmedSet.has(sym.trim().toLowerCase()));
  if (fabricated.length > 0) {
    issues.push({ type: "fabrication", severity: "major", evidence: `미확정 심볼 해석: ${fabricated.join(", ")}` });
  }

  if (VOICE_NYANG.test(body)) {
    issues.push({ type: "voice", severity: "minor", evidence: `'~냥' 종결 누출` });
  }
  const jargon = body.match(VOICE_JARGON);
  if (jargon) {
    issues.push({ type: "voice", severity: "minor", evidence: `기계용어 누출: ${jargon[0]}` });
  }

  if (FALLBACK_INTERP.test(reading.interpretation) || FALLBACK_SUMMARY.test(reading.summary)) {
    issues.push({ type: "fallback", severity: "major", evidence: "결정론 baseline 폴백(진짜 LLM 해몽 아님)" });
  }

  return issues;
}

/** 채점 = LLM judge(주관) + 결정론 게이트(binary) 결합. */
export async function scoreDreamReadingWithRubric(
  provider: DreamReadingLlmProvider,
  input: ScoreDreamReadingInput,
  options: { model?: string; timeoutMs?: number } = {},
): Promise<RubricResult> {
  const prompt = buildRubricJudgePrompt(input);
  const raw = await provider.generateJson({
    instructions: prompt.instructions,
    input: prompt.input,
    schemaName: DREAM_RUBRIC_SCHEMA_NAME,
    jsonSchema: DREAM_RUBRIC_JSON_SCHEMA,
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.model ? { model: options.model } : {}),
  });
  const parsed = parseRubricGroups(raw);
  if (!parsed) {
    throw new Error("Rubric judge returned an invalid score object");
  }

  const issues = detectDeterministicIssues(
    input.reading,
    input.confirmedEvidence.map((e) => e.label),
    input.locale ?? "ko",
  );
  const rawScore = rawScoreFromGroups(parsed.groups);
  const weightedScore = weightedScoreFromGroups(parsed.groups);
  const finalScore = applyIssuePenalties(weightedScore, issues);

  return { groups: parsed.groups, issues, rawScore, weightedScore, finalScore, verdict: parsed.verdict };
}
