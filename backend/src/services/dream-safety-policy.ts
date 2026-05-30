import type { DreamAnalysisRequest, DreamAnalysisResponse } from "../contracts/dream";

export type DreamSafetyRiskType = "medical" | "pregnancy" | "financial" | "crisis" | "deathOrViolence";
export type DreamSafetySeverity = "low" | "medium" | "high";

export type DreamSafetyRisk = {
  type: DreamSafetyRiskType;
  severity: DreamSafetySeverity;
  evidenceTerms: string[];
  reason: string;
};

export type DreamSafetyPolicyResult = {
  risks: DreamSafetyRisk[];
  hasRisk: boolean;
  highestSeverity: DreamSafetySeverity | "none";
  userFacingNotice?: string;
  promptDirectives: string[];
  blockedClaims: string[];
};

type SafetyRule = {
  type: DreamSafetyRiskType;
  severity: DreamSafetySeverity;
  terms: string[];
  reason: string;
  blockedClaims: string[];
  promptDirectives: string[];
  notices: {
    ko: string;
    en: string;
  };
};

const severityRank: Record<DreamSafetySeverity | "none", number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const safetyRules: SafetyRule[] = [
  {
    type: "crisis",
    severity: "high",
    terms: [
      "suicide",
      "self-harm",
      "hurt myself",
      "kill myself",
      "end my life",
      "do not want to live",
      "don't want to live",
      "자살",
      "자해",
      "죽고 싶",
      "살기 싫",
      "나를 해치",
    ],
    reason: "The user may be asking from an acute self-harm or crisis context.",
    blockedClaims: ["crisis counseling or emergency support replacement"],
    promptDirectives: [
      "Do not provide crisis counseling as a dream reading.",
      "Do not minimize self-harm language; include a clear support-seeking reminder.",
    ],
    notices: {
      ko: "이 해석은 위기 상담을 대체할 수 없습니다. 지금 스스로를 해칠 수 있거나 안전하지 않다고 느껴진다면 즉시 119, 112 또는 가까운 응급 지원에 연락해 주세요.",
      en: "This reading cannot replace crisis support. If you may hurt yourself or feel unsafe, contact local emergency services or a crisis hotline now.",
    },
  },
  {
    type: "medical",
    severity: "medium",
    terms: [
      "disease",
      "diagnosis",
      "diagnose",
      "cancer",
      "illness",
      "sick",
      "hospital",
      "blood",
      "bleeding",
      "health",
      "symptom",
      "암",
      "큰 병",
      "질병",
      "진단",
      "병원",
      "피",
      "건강",
      "아픈",
    ],
    reason: "The user may want a health diagnosis or medical prediction.",
    blockedClaims: ["medical diagnosis or health prediction"],
    promptDirectives: [
      "Do not diagnose illness or predict health outcomes.",
      "Do not treat dream symbols as medical evidence.",
    ],
    notices: {
      ko: "만양의 꿈 해석은 의학적 진단을 대체하지 않습니다. 건강이 걱정된다면 자격 있는 의료 전문가와 상담해 주세요.",
      en: "Manyang's dream reading is not a medical diagnosis. If you are worried about your health, talk with a qualified medical professional.",
    },
  },
  {
    type: "pregnancy",
    severity: "medium",
    terms: [
      "pregnancy dream",
      "pregnant",
      "pregnancy",
      "birth",
      "childbirth",
      "태몽",
      "임신",
      "출산",
      "아이를 낳",
    ],
    reason: "The user may want a pregnancy confirmation or childbirth prediction.",
    blockedClaims: ["pregnancy confirmation or childbirth prediction"],
    promptDirectives: [
      "Do not predict pregnancy, childbirth, fetal sex, or family events.",
      "Frame pregnancy-related symbols only as emotional or relational themes when evidence supports it.",
    ],
    notices: {
      ko: "이 해석은 임신 여부나 출산을 확인하거나 예측하지 않습니다. 관련 걱정이 있다면 의료 전문가와 상담해 주세요.",
      en: "This reading cannot confirm pregnancy or predict childbirth. If this is a real concern, talk with a qualified medical professional.",
    },
  },
  {
    type: "financial",
    severity: "medium",
    terms: [
      "money",
      "lottery",
      "stock",
      "investment",
      "profit",
      "windfall",
      "rich",
      "돈",
      "재물",
      "금전",
      "복권",
      "주식",
      "투자",
      "횡재",
      "부자",
    ],
    reason: "The user may want a money, investment, or luck guarantee.",
    blockedClaims: ["financial advice or money prediction"],
    promptDirectives: [
      "Do not predict money, lottery, investment, or business outcomes.",
      "Do not provide financial advice.",
    ],
    notices: {
      ko: "이 해석은 재정 조언이나 금전 결과 예측이 아닙니다. 돈과 관련된 결정은 현실의 정보와 전문가 조언을 기준으로 판단해 주세요.",
      en: "This reading is not financial advice or a money prediction. Make money-related decisions with real-world information and qualified advice.",
    },
  },
  {
    type: "deathOrViolence",
    severity: "medium",
    terms: [
      "death",
      "dead",
      "died",
      "die",
      "murder",
      "kill",
      "violence",
      "죽음",
      "죽었",
      "죽는",
      "죽을",
      "살인",
      "폭력",
      "죽이",
    ],
    reason: "The user may want a death or violence prediction.",
    blockedClaims: ["death or violence prediction"],
    promptDirectives: [
      "Do not predict death, accidents, violence, or harm to a real person.",
      "Treat death or violence imagery as symbolic unless there is an immediate safety concern.",
    ],
    notices: {
      ko: "이 해석은 죽음, 사고, 폭력 같은 현실 사건을 예측하지 않습니다. 실제 위험이 걱정된다면 주변의 도움이나 긴급 지원을 우선해 주세요.",
      en: "This reading does not predict death, accidents, violence, or harm. If there is a real safety concern, prioritize immediate support.",
    },
  },
];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase();
}

function compact(text: string): string {
  return normalize(text).replace(/[^\p{L}\p{N}]/gu, "");
}

function tokenize(text: string): string[] {
  return normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function containsHangul(text: string): boolean {
  return /\p{Script=Hangul}/u.test(text);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const koreanBoundarySuffixes = [
  "",
  "이",
  "가",
  "을",
  "를",
  "은",
  "는",
  "도",
  "에",
  "에서",
  "에게",
  "께",
  "와",
  "과",
  "로",
  "으로",
  "만",
  "부터",
  "까지",
  "마다",
  "이나",
  "나",
  "인지",
  "인가",
  "일까",
  "일까요",
  "였나",
  "였다",
  "였어",
  "였어요",
  "이었어",
  "이었어요",
  "이야",
  "이에요",
  "야",
  "요",
  "죠",
  "고",
  "거나",
  "인데",
  "인데요",
  "처럼",
  "같",
  "같아",
  "같았어",
  "같아요",
  "같았어요",
  "났어",
  "났어요",
  "났고",
  "나는",
  "나고",
  "남",
  "했어",
  "했어요",
  "하는",
  "하고",
  "한",
  "함",
  "하더라",
  "받",
  "받는",
  "받았어",
  "받았어요",
  "려고",
  "려는",
  "었어",
  "었어요",
  "았어",
  "았어요",
  "더라",
  "데",
  "데요",
  "어",
  "아",
];

function koreanTermMatchesToken(term: string, token: string): boolean {
  const termKey = compact(term);
  const tokenKey = compact(token);

  if (!termKey || !tokenKey || !tokenKey.startsWith(termKey)) {
    return false;
  }

  const suffix = tokenKey.slice(termKey.length);

  return koreanBoundarySuffixes.includes(suffix);
}

function koreanTermMatchesText(text: string, term: string): boolean {
  const termTokens = tokenize(term);
  const textTokens = tokenize(text);

  if (termTokens.length === 0 || textTokens.length === 0) {
    return false;
  }

  return textTokens.some((_, startIndex) =>
    termTokens.every((termToken, offset) => {
      const textToken = textTokens[startIndex + offset];

      return textToken !== undefined && koreanTermMatchesToken(termToken, textToken);
    }),
  );
}

function latinTermMatchesText(text: string, term: string): boolean {
  const normalizedTerm = normalize(term);

  if (!normalizedTerm) {
    return false;
  }

  const escapedTerm = escapeRegExp(normalizedTerm).replace(/\s+/g, "\\s+");
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}-])${escapedTerm}($|[^\\p{L}\\p{N}-])`, "u");

  return pattern.test(text);
}

function termMatchesText(text: string, term: string): boolean {
  return containsHangul(term) ? koreanTermMatchesText(text, term) : latinTermMatchesText(text, term);
}

function findMatchedTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => termMatchesText(text, term));
}

function highestSeverityFor(risks: DreamSafetyRisk[]): DreamSafetySeverity | "none" {
  return risks.reduce<DreamSafetySeverity | "none">(
    (highest, risk) => (severityRank[risk.severity] > severityRank[highest] ? risk.severity : highest),
    "none",
  );
}

export function analyzeDreamSafetyPolicy(
  request: Pick<DreamAnalysisRequest, "dreamText" | "locale">,
): DreamSafetyPolicyResult {
  const locale = request.locale ?? "ko";
  const normalizedText = normalize(request.dreamText);
  const matchedRules = safetyRules
    .map((rule) => ({
      rule,
      evidenceTerms: findMatchedTerms(normalizedText, rule.terms),
    }))
    .filter((match) => match.evidenceTerms.length > 0);

  const risks = matchedRules.map<DreamSafetyRisk>(({ rule, evidenceTerms }) => ({
    type: rule.type,
    severity: rule.severity,
    evidenceTerms,
    reason: rule.reason,
  }));
  const userFacingNotice = unique(matchedRules.map(({ rule }) => rule.notices[locale])).join(" ");

  return {
    risks,
    hasRisk: risks.length > 0,
    highestSeverity: highestSeverityFor(risks),
    ...(userFacingNotice ? { userFacingNotice } : {}),
    promptDirectives: unique(matchedRules.flatMap(({ rule }) => rule.promptDirectives)),
    blockedClaims: unique(matchedRules.flatMap(({ rule }) => rule.blockedClaims)),
  };
}

export function applySafetyPolicyToResponse(
  response: DreamAnalysisResponse,
  policy: DreamSafetyPolicyResult,
): DreamAnalysisResponse {
  if (!policy.userFacingNotice) {
    return response;
  }

  const notices = unique([response.safetyNotice, policy.userFacingNotice].filter((notice): notice is string => Boolean(notice)));

  return {
    ...response,
    safetyNotice: notices.join(" "),
  };
}
