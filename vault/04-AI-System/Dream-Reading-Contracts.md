---
title: Dream Reading Contracts
tags:
  - ai-system
  - contract
  - llm
  - rag
status: accepted
---

# Dream Reading Contracts

> Contract v0.1. 이 문서는 실제 LLM/RAG 구현 전에 고정하는 데이터 계약이다. 프롬프트, 검색 서비스, API 응답, 저장 구조는 이 계약을 기준으로 맞춘다.

---

## Contract Rules

- 필드명은 TypeScript/JSON 기준 `camelCase`를 사용한다.
- `confidence`는 `0.0`부터 `1.0`까지의 숫자다.
- `importance`는 `1`부터 `5`까지의 정수다.
- `locale`은 MVP에서 `"ko"` 또는 `"en"`만 허용한다.
- LLM 원문 응답은 클라이언트에 그대로 전달하지 않는다.
- 사용자-facing 응답과 내부 디버깅/검증 필드는 분리한다.
- 원문에 없는 상징은 `inferred`로 표시하고, 중심 해석에는 낮은 가중치로만 쓴다.
- `evidenceText`가 없는 claim은 최종 해몽의 중심 문장에 쓰지 않는다.

## 0. Analyze Request

사용자 입력과 선택 옵션을 서버가 받는 계약이다.

```ts
type DreamAnalyzeRequest = {
  dreamText: string;
  dreamDate?: string;
  wakeMood?: string;
  dreamMood?: string;
  catReaderType?: "black_cat" | "white_cat" | "cheese_cat" | "gray_cat";
  locale: "ko" | "en";
  userTimeZone?: string;
};
```

예:

```json
{
  "dreamText": "오늘 새벽에 꿈을 꾸었는데 우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.",
  "dreamDate": "2026-05-26",
  "wakeMood": "curious",
  "dreamMood": "overwhelming",
  "catReaderType": "black_cat",
  "locale": "ko",
  "userTimeZone": "Asia/Seoul"
}
```

## 1. Structured Dream Analysis

1차 LLM 출력이다. 이 단계는 해몽을 하지 않고, 검색과 검증에 쓸 구조만 만든다.

```ts
type StructuredDreamAnalysis = {
  normalizedText: string;
  summary: string;
  sceneFacts: string[];
  symbolCandidates: SymbolCandidate[];
  literalQueries: string[];
  sceneQueries: string[];
  themeQueries: string[];
  modifierQueries: string[];
  selectedMoods: SelectedMood[];
  inferredEmotions: EmotionSignal[];
  themes: ThemeSignal[];
  safetySignals: SafetySignal[];
  language: "ko" | "en";
};

type SymbolCandidate = {
  text: string;
  normalizedText: string;
  candidateId?: string;
  type:
    | "place"
    | "object"
    | "action"
    | "nature"
    | "animal"
    | "person"
    | "emotion"
    | "quantity"
    | "time";
  evidenceText: string;
  roleInDream: string;
  source: "explicit" | "inferred";
  importance: 1 | 2 | 3 | 4 | 5;
  confidence: number;
};

type SelectedMood = {
  source: "wakeMood" | "dreamMood";
  value: string;
};

type EmotionSignal = {
  label: string;
  source: "text" | "selectedMood";
  evidenceText?: string;
  confidence: number;
};

type ThemeSignal = {
  label: string;
  evidenceText?: string;
  confidence: number;
};

type SafetySignal = {
  type: "none" | "distress" | "crisis" | "medicalOrDiagnostic" | "violence" | "sexualContent";
  severity: "low" | "medium" | "high";
  evidenceText?: string;
};
```

예:

```json
{
  "normalizedText": "오늘 새벽에 꿈을 꾸었는데 우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.",
  "summary": "새벽 꿈에서 우리 땅에 큰 구렁이와 여러 뱀이 많이 나타난 장면",
  "sceneFacts": [
    "새벽에 꾼 꿈",
    "우리 땅이라는 소유/영역의 장소",
    "큰 구렁이들",
    "뱀들이 수십 마리",
    "많은 수의 생물이 한꺼번에 나타남"
  ],
  "symbolCandidates": [
    {
      "text": "구렁이",
      "normalizedText": "구렁이",
      "candidateId": "large_snake",
      "type": "animal",
      "evidenceText": "큰 구렁이들",
      "roleInDream": "largeSnakeAppearing",
      "source": "explicit",
      "importance": 5,
      "confidence": 0.94
    },
    {
      "text": "수십 마리",
      "normalizedText": "수십마리",
      "candidateId": "many",
      "type": "quantity",
      "evidenceText": "뱀들이 수십 마리가",
      "roleInDream": "manyLivingThingsAppearing",
      "source": "explicit",
      "importance": 4,
      "confidence": 0.9
    }
  ],
  "literalQueries": ["구렁이", "뱀", "우리 땅", "수십 마리", "새벽"],
  "sceneQueries": ["우리 땅에 큰 뱀이 많이 나타남", "많은 뱀이 내 영역에 있음"],
  "themeQueries": ["영역", "생명력", "압도감", "숨은 움직임"],
  "modifierQueries": ["largeSnake", "manySnakes", "ownedLand", "dawn"],
  "selectedMoods": [
    { "source": "wakeMood", "value": "curious" },
    { "source": "dreamMood", "value": "overwhelming" }
  ],
  "inferredEmotions": [
    {
      "label": "놀람",
      "source": "text",
      "evidenceText": "수십 마리",
      "confidence": 0.55
    }
  ],
  "themes": [
    { "label": "영역", "evidenceText": "우리 땅", "confidence": 0.82 },
    { "label": "압도감", "evidenceText": "수십 마리", "confidence": 0.76 }
  ],
  "safetySignals": [],
  "language": "ko"
}
```

## 2. Retrieval Result

RAG 서비스가 2차 LLM에 넘기는 검색 결과 계약이다.

```ts
type DreamRetrievalResult = {
  querySet: {
    literalQueries: string[];
    sceneQueries: string[];
    themeQueries: string[];
    modifierQueries: string[];
  };
  matches: RetrievedSymbolMatch[];
  retrievalSummary: {
    primarySymbolIds: string[];
    supportingSymbolIds: string[];
    excludedSymbolIds: string[];
    averageConfidence: number;
  };
};

type RetrievedSymbolMatch = {
  entryId: string;
  locale: "ko" | "en";
  label: string;
  category: string;
  matchType: "exact" | "alias" | "keyword" | "semantic" | "related" | "fallback";
  confidence: number;
  matchedText?: string;
  sourceCandidateText?: string;
  usedFields: string[];
  rankReason: string;
  evidence: {
    coreMeanings: string[];
    lightReadings: string[];
    shadowReadings: string[];
    sceneModifiers: {
      key: string;
      reading: string;
    }[];
    metaphorHooks: string[];
    avoidExpressions: string[];
  };
};
```

예:

```json
{
  "querySet": {
    "literalQueries": ["구렁이", "뱀", "우리 땅", "수십 마리", "새벽"],
    "sceneQueries": ["우리 땅에 큰 뱀이 많이 나타남"],
    "themeQueries": ["영역", "생명력", "압도감"],
    "modifierQueries": ["largeSnake", "manySnakes", "ownedLand"]
  },
  "matches": [
    {
      "entryId": "snake",
      "locale": "ko",
      "label": "뱀",
      "category": "animal",
      "matchType": "exact",
      "confidence": 0.95,
      "matchedText": "뱀들이 수십 마리가",
      "sourceCandidateText": "뱀",
      "usedFields": ["coreMeanings", "sceneModifiers.many", "sceneModifiers.large"],
      "rankReason": "원문 직접 등장, 수량 modifier 일치",
      "evidence": {
        "coreMeanings": ["본능", "경계", "숨은 움직임", "변화", "생명력"],
        "lightReadings": ["조용히 커지는 가능성", "감각이 예민하게 깨어나는 흐름"],
        "shadowReadings": ["압도감", "어디서 움직일지 모르는 긴장"],
        "sceneModifiers": [
          {
            "key": "many",
            "reading": "여러 갈래의 신호나 감각이 한꺼번에 올라오는 장면"
          },
          {
            "key": "large",
            "reading": "무시하기 어려울 만큼 커진 힘이나 변화감"
          }
        ],
        "metaphorHooks": ["조용히 움직이는 힘", "땅 아래에서 올라온 감각"],
        "avoidExpressions": ["재물운이 반드시 오른다", "태몽이다", "위험한 일이 생긴다"]
      }
    }
  ],
  "retrievalSummary": {
    "primarySymbolIds": ["snake", "owned_land", "many"],
    "supportingSymbolIds": ["dawn"],
    "excludedSymbolIds": [],
    "averageConfidence": 0.88
  }
}
```

## 3. Generated Dream Reading

2차 LLM의 출력 계약이다. 이 결과는 아직 검증 전이다.

```ts
type GeneratedDreamReading = {
  summary: string;
  interpretation: string;
  symbolReadings: SymbolReading[];
  mainThemes: string[];
  smallPrescription: string;
  card: DreamCardDraft;
  grounding: GroundingClaim[];
  safetyRewriteNotes: string[];
};

type SymbolReading = {
  symbolId: string;
  label: string;
  reading: string;
  confidence: number;
};

type DreamCardDraft = {
  name: string;
  type: string;
  keywords: string[];
  summary: string;
  message: string;
  visualPrompt?: string;
};

type GroundingClaim = {
  claim: string;
  basedOnSymbols: string[];
  evidenceText: string[];
  retrievalEntryIds: string[];
  confidence: number;
};
```

규칙:

- `interpretation`은 핵심 해석 1~2개만 담는다.
- `symbolReadings`는 최대 5개다.
- `smallPrescription`은 오늘 할 수 있는 행동 1개다.
- `grounding`의 claim 수는 최대 3개다.
- `safetyRewriteNotes`에는 모델이 낮춘 표현을 남긴다. 사용자에게 노출하지 않는다.

예:

```json
{
  "summary": "우리 땅에 큰 구렁이와 많은 뱀이 나타난 꿈",
  "interpretation": "이 꿈은 불길한 징조라기보다, 내 영역 안에서 조용히 커지고 있던 감각들이 한꺼번에 모습을 드러낸 장면으로 읽을 수 있어요. 큰 구렁이와 수십 마리의 뱀은 하나의 작은 사건보다 여러 갈래의 힘이나 가능성이 동시에 움직이는 느낌에 가깝습니다.",
  "symbolReadings": [
    {
      "symbolId": "snake",
      "label": "뱀",
      "reading": "뱀은 본능적 감각이나 숨은 움직임을 보여주는 상징으로 읽을 수 있어요.",
      "confidence": 0.9
    },
    {
      "symbolId": "owned_land",
      "label": "우리 땅",
      "reading": "우리 땅은 내가 지키고 가꾸는 생활 기반이나 가족의 영역을 떠올리게 합니다.",
      "confidence": 0.84
    }
  ],
  "mainThemes": ["영역", "생명력", "압도감"],
  "smallPrescription": "오늘은 내가 지켜야 한다고 느끼는 영역 하나를 적고, 실제로 챙길 수 있는 작은 행동 하나만 정해보세요.",
  "card": {
    "name": "땅 아래 깨어난 구렁이",
    "type": "earth_moon",
    "keywords": ["영역", "생명력", "경계", "압도감"],
    "summary": "내 기반 안에서 조용히 커지는 힘을 알아차리는 꿈",
    "message": "한꺼번에 올라온 감각을 불길함으로 몰지 말고, 지금 내 영역에서 무엇이 커지고 있는지 살펴보자냥."
  },
  "grounding": [
    {
      "claim": "내 영역 안에서 커지는 감각들이 드러난 장면으로 읽을 수 있다",
      "basedOnSymbols": ["snake", "owned_land", "many"],
      "evidenceText": ["우리 땅에", "큰 구렁이들", "수십 마리"],
      "retrievalEntryIds": ["snake", "owned_land", "many"],
      "confidence": 0.86
    }
  ],
  "safetyRewriteNotes": [
    "재물운, 태몽, 길몽 확정 표현을 사용하지 않음"
  ]
}
```

## 4. Quality Evaluation

검증기는 2차 LLM 결과를 평가하고, retry 여부를 결정한다.

```ts
type DreamReadingEvaluation = {
  scores: {
    groundedness: number;
    specificity: number;
    safety: number;
    toneFit: number;
    actionability: number;
    cardQuality: number;
  };
  violations: EvaluationViolation[];
  retryDecision: "accept" | "rewrite" | "fallback";
  retryInstructions?: string[];
};

type EvaluationViolation = {
  type:
    | "ungroundedClaim"
    | "forbiddenPrediction"
    | "diagnosticLanguage"
    | "tooGeneric"
    | "tooManyClaims"
    | "weakPrescription"
    | "toneMismatch";
  evidenceText: string;
  severity: "low" | "medium" | "high";
};
```

Accept 기준:

- `safety`는 `1.0`이어야 한다.
- `groundedness`, `specificity`, `toneFit`은 각각 `0.75` 이상이어야 한다.
- high severity violation이 있으면 `rewrite` 또는 `fallback`이다.

## 5. Public Analyze Response

클라이언트와 저장 루프에 넘기는 최종 응답이다. 내부 grounding과 evaluation은 기본 응답에 포함하지 않는다.

```ts
type DreamAnalyzeResponse = {
  dreamId: string;
  analysisId: string;
  cardId: string;
  reader: {
    id: "black_cat" | "white_cat" | "cheese_cat" | "gray_cat";
    name: string;
    access: "free" | "annual_premium";
  };
  summary: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  interpretation: string;
  symbolReadings: {
    symbol: string;
    reading: string;
  }[];
  smallPrescription: string;
  readingBasis: {
    usedSymbols: string[];
    mainThemes: string[];
    confidence: number;
  };
  card: {
    name: string;
    type: string;
    keywords: string[];
    summary: string;
    message: string;
    theme: string;
  };
  safetyNotice?: string;
};
```

MVP UI는 `readingBasis`를 짧게 노출한다.

```text
읽은 상징: 뱀, 우리 땅, 수십 마리
주요 흐름: 영역, 생명력, 압도감
```

## Forbidden Claim Rules

다음 claim은 기본 해몽에서 금지한다.

| 유형 | 금지 예 | 허용 변환 |
| --- | --- | --- |
| 금전 예언 | 조만간 큰돈이 들어옵니다 | 자원이나 기회에 대한 감각이 커지는 꿈으로 읽을 수 있어요 |
| 임신/태몽 확정 | 태몽입니다 | 생명력이나 돌봄의 상징으로 읽을 수 있어요 |
| 질병 진단 | 질병의 신호입니다 | 몸과 마음을 살피라는 장면으로 낮게 읽을 수 있어요 |
| 불행 예언 | 나쁜 일이 생길 징조입니다 | 경계감이 커진 장면으로 볼 수 있어요 |
| 심리 진단 | 당신은 불안장애입니다 | 불안과 연결될 수 있는 장면이지만 단정하지 않습니다 |
| 행동 명령 | 반드시 투자하세요 | 오늘 들어오는 제안을 차분히 적어보세요 |

## Related

- [[Dream-Reading-LLM-Logic]]
- [[RAG-Strategy-for-Dream-Reading]]
- [[Dream-Reading-Quality-Safety]]
- [[LLM-Pipeline]]

## See Also

- [[API-Contract]] — 클라이언트-facing API 계약
- [[Multilingual-Symbol-Encyclopedia]] — 백과사전 항목 구조
