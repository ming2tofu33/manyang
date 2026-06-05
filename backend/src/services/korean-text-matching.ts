// 심볼/별칭 매칭의 공통 텍스트 처리 코어.
// fortune 매처(structured-dream-analysis)와 RAG 근거 매처(symbol-matcher)가 같은 로직을
// 쓰도록 단일화한다. 스코어링/랭킹은 소비자별로 다르므로 여기엔 두지 않는다.

// 한국어 조사/어미 + 일부 위치명사 접미. 두 매처의 기존 목록을 합집합으로 모은 것.
const KOREAN_SUFFIXES = [
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
  "와",
  "과",
  "로",
  "으로",
  "처럼",
  "만",
  "부터",
  "까지",
  "마다",
  "앞",
  "뒤",
  "안",
  "속",
  "길",
  "고",
  "던",
  "들",
  "들이",
  "들을",
  "들과",
  "들하고",
  "들에",
  "다",
  "요",
  "어",
  "아",
  "어요",
  "아요",
  "어도",
  "아도",
  "어서",
  "아서",
  "와서",
  "하다가",
  "하는데",
  "했어",
  "진",
  "다가",
  "는데",
  "는지",
  "는지는",
  "면서",
  "었어",
  "았어",
  "였어",
  "었어요",
  "았어요",
  "였어요",
  "었고",
  "였고",
];

// KOREAN_SUFFIXES 중 명사 조사가 아닌 "동사·형용사 어미"만 모은 부분집합.
// 단음절 명사가 동사 활용형과 겹칠 때(불 ↔ 불다) 그 활용 어미를 골라 막는 데 쓴다.
const VERB_ENDINGS = [
  "다",
  "고",
  "던",
  "어",
  "아",
  "어요",
  "아요",
  "어도",
  "아도",
  "어서",
  "아서",
  "다가",
  "하다가",
  "하는데",
  "했어",
  "진",
  "는데",
  "는지",
  "는지는",
  "면서",
  "었어",
  "았어",
  "였어",
  "었어요",
  "았어요",
  "였어요",
  "었고",
  "였고",
] as const;

// 동음이의 가드: 단음절 명사 라벨이 다른 단어의 활용형/파생형과 겹칠 때,
// 해당 접미가 붙은 토큰은 매치에서 제외한다(term은 compact 기준).
// 이건 심볼의 의미가 아니라 "한국어 형태론" 사실이라 KOREAN_SUFFIXES 옆에 둔다.
//   별 + 로/도  → 별로(부사)·별도(따로)  차단, 별이/별을(star)  유지
//   말 + 로/도  → 말로(by words)·말도(idiom) 차단, 말을/말이(horse) 유지
//   불 + 동사어미 → 불었어/불어/불고(불다)   차단, 불이/불을(fire)  유지
const SUFFIX_GUARDS: Record<string, readonly string[]> = {
  별: ["로", "도"],
  말: ["로", "도"],
  불: VERB_ENDINGS,
};

export function normalizeText(text: string): string {
  return text.trim().toLocaleLowerCase();
}

export function compactText(text: string): string {
  return normalizeText(text).replace(/[^\p{L}\p{N}]/gu, "");
}

export function tokenizeText(text: string): string[] {
  return normalizeText(text).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function containsHangul(text: string): boolean {
  return /\p{Script=Hangul}/u.test(text);
}

// "이가 빠지는 꿈" 같은 별칭에서 어간을 떼어내 활용형 토큰도 잡히게 한다.
function stripKoreanEnding(term: string): string | undefined {
  if (!containsHangul(term) || compactText(term).length < 3) {
    return undefined;
  }

  const endings = ["하는꿈", "는꿈", "꿈", "는", "은", "고", "다"];
  const key = compactText(term);
  const ending = endings.find((candidate) => key.endsWith(candidate));

  if (!ending) {
    return undefined;
  }

  const stem = key.slice(0, -ending.length);

  return stem.length >= 2 ? stem : undefined;
}

function tokenMatchesTerm(term: string, token: string): boolean {
  const termKey = compactText(term);
  const tokenKey = compactText(token);

  if (!termKey || !tokenKey) {
    return false;
  }

  if (tokenKey === termKey) {
    return true;
  }

  if (containsHangul(termKey)) {
    if (tokenKey.startsWith(termKey)) {
      const suffix = tokenKey.slice(termKey.length);

      if (SUFFIX_GUARDS[termKey]?.includes(suffix)) {
        return false;
      }

      return KOREAN_SUFFIXES.includes(suffix);
    }

    const stem = stripKoreanEnding(termKey);

    if (stem && tokenKey.startsWith(stem)) {
      const suffix = tokenKey.slice(stem.length);

      return suffix.length > 0 && suffix.length <= 4;
    }
  }

  return false;
}

// 구문 별칭("A B C")의 각 단어가 순서대로(사이에 다른 단어가 끼어도) 토큰에 나타나면 매치.
function phraseMatchesInOrder(words: string[], tokens: string[]): boolean {
  let wordIndex = 0;

  for (const token of tokens) {
    const word = words[wordIndex];

    if (word !== undefined && tokenMatchesTerm(word, token)) {
      wordIndex += 1;

      if (wordIndex === words.length) {
        return true;
      }
    }
  }

  return false;
}

/** 별칭/트리거 한 개가 (정규화된) 꿈 텍스트·토큰에 매치되는지. */
export function termMatchesText(term: string, normalizedText: string, tokens: string[]): boolean {
  const normalizedTerm = normalizeText(term);
  const termKey = compactText(normalizedTerm);

  if (!termKey) {
    return false;
  }

  // 한국어는 조사/어미가 붙는 경우가 많아 연속 부분문자열을 허용한다.
  // 영어권 alias는 단어 경계를 지켜야 한다. 예: bare가 barely를 깨우면 안 된다.
  if (containsHangul(termKey) && (normalizedTerm.includes(" ") || termKey.length >= 4)) {
    if (compactText(normalizedText).includes(termKey)) {
      return true;
    }
  }

  // 연속 매칭이 실패해도, 구문 단어들이 순서대로 토큰에 있으면 매치(중간에 부사 등이 끼는 경우).
  if (normalizedTerm.includes(" ") && phraseMatchesInOrder(normalizedTerm.split(/\s+/).filter(Boolean), tokens)) {
    return true;
  }

  return tokens.some((token) => tokenMatchesTerm(normalizedTerm, token));
}

// scene modifier 트리거는 짧은 장면 단서 조각("기다","대기")이라 별칭보다 느슨하게 —
// 부분문자열 매칭까지 허용한다(활용형 "기다렸어"도 "기다"로 잡히도록).
export function triggerMatchesText(trigger: string, normalizedText: string, tokens: string[]): boolean {
  if (termMatchesText(trigger, normalizedText, tokens)) {
    return true;
  }

  const triggerKey = compactText(trigger);

  return triggerKey.length > 0 && compactText(normalizedText).includes(triggerKey);
}

function collectMatches(
  candidates: string[],
  predicate: (candidate: string) => boolean,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of candidates) {
    const trimmed = candidate.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    if (predicate(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result;
}

/** 여러 별칭 중 매치된 것만(중복 제거) 돌려준다(별칭 = 엄격). */
export function matchedTerms(terms: string[], normalizedText: string, tokens: string[]): string[] {
  return collectMatches(terms, (term) => termMatchesText(term, normalizedText, tokens));
}

/** 여러 scene modifier 트리거 중 매치된 것만(중복 제거) 돌려준다(트리거 = 느슨). */
export function matchedTriggers(triggers: string[], normalizedText: string, tokens: string[]): string[] {
  return collectMatches(triggers, (trigger) => triggerMatchesText(trigger, normalizedText, tokens));
}
