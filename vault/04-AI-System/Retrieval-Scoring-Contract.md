---
title: Retrieval Scoring Contract
tags:
  - ai-system
  - rag
  - retrieval
  - scoring
status: accepted
---

# Retrieval Scoring Contract

> Contract v0.1. 상징 백과 검색 결과의 `confidence`, `matchType`, `rankReason`, primary/supporting/excluded 분류 기준을 고정한다.

---

## Goal

검색 점수는 "LLM에게 어떤 상징을 중심 근거로 줄 것인가"를 결정한다. 사용자가 직접 쓴 상징을 가장 강하게 반영하고, vector 검색은 표현 차이를 보완하는 역할로 둔다.

## Pipeline

```text
1. structured analysis에서 querySet 생성
2. exact/alias 후보 생성
3. keyword 후보 생성
4. semantic 후보 생성
5. related/fallback 후보 생성
6. 동일 entryId 후보 병합
7. scoring
8. reranking
9. MMR diversity selection
10. primary/supporting/excluded 분류
```

## Match Type Base Score

| matchType | baseScore | 설명 |
| --- | ---: | --- |
| `exact` | 1.00 | 원문 또는 1차 분석 후보가 entry label과 직접 일치 |
| `alias` | 0.92 | aliases와 직접 일치 |
| `keyword` | 0.72 | searchText/BM25 기반 부분 일치 |
| `semantic` | 0.62 | embedding similarity 기반 |
| `related` | 0.48 | relatedIds 기반 보조 후보 |
| `fallback` | 0.32 | 매칭 실패 시 카테고리 기본 후보 |

## Boosts and Penalties

| Factor | 값 | 조건 |
| --- | ---: | --- |
| explicitEvidenceBoost | +0.12 | `source: explicit`인 SymbolCandidate에서 온 후보 |
| sceneModifierBoost | +0.10 | scene modifier trigger와 일치 |
| highImportanceBoost | +0.02 ~ +0.08 | `importance`가 4 또는 5 |
| selectedMoodBoost | +0.03 | 선택 감정과 항목 theme가 약하게 맞음 |
| localeBoost | +0.04 | 사용자 locale과 entry locale 일치 |
| repeatedSymbolBoost | +0.03 ~ +0.08 | 개인화 도입 후 최근 반복 상징 |
| inferredPenalty | -0.10 | `source: inferred` 후보 |
| noEvidencePenalty | -0.18 | 원문 `evidenceText` 없음 |
| sensitivePenalty | -0.05 | `safetyLevel: sensitive`이며 crisis/distress signal 존재 |
| overBroadPenalty | -0.08 | 너무 일반적인 항목이 3개 이상 중복될 때 |

## Confidence Formula

초기 구현에서는 단순 가중 합산을 사용한다.

```text
rawScore =
  baseScore
  + explicitEvidenceBoost
  + sceneModifierBoost
  + highImportanceBoost
  + selectedMoodBoost
  + localeBoost
  + repeatedSymbolBoost
  - inferredPenalty
  - noEvidencePenalty
  - sensitivePenalty
  - overBroadPenalty

confidence = clamp(rawScore, 0.0, 1.0)
```

`highImportanceBoost`:

```text
importance 5: +0.08
importance 4: +0.04
importance 1~3: +0.00
```

`confidence`는 검색 엔진의 객관적 진실 점수가 아니라, **현재 꿈 원문에서 이 항목을 2차 LLM 근거로 써도 되는 정도**다.

## Duplicate Merge

같은 `entryId`가 여러 경로로 검색되면 하나로 병합한다.

규칙:

- 가장 높은 `confidence`를 대표 점수로 쓴다.
- `matchType`은 가장 강한 타입을 쓴다.
- `usedFields`는 합친다.
- `matchedText`는 최대 3개까지만 보관한다.
- scene modifier는 일치한 것만 넘긴다.

match type 우선순위:

```text
exact > alias > keyword > semantic > related > fallback
```

예:

```json
{
  "entryId": "door",
  "matchType": "alias",
  "confidence": 0.94,
  "matchedText": ["문", "입구가 계속 바뀜"],
  "usedFields": ["aliases", "searchText", "sceneModifiers.changing"],
  "rankReason": "alias match와 changing scene modifier가 동시에 일치"
}
```

## Reranking Rules

점수 계산 후 다음 규칙으로 재정렬한다.

1. `confidence` 높은 순서
2. `source: explicit` 후보 우선
3. `sceneModifiers` 일치 후보 우선
4. `importance` 높은 후보 우선
5. category 다양성을 위해 같은 category 과밀 후보는 뒤로 이동
6. `fallback`은 항상 마지막

## Primary, Supporting, Excluded

| Group | 조건 | 2차 LLM 사용 |
| --- | --- | --- |
| primary | confidence >= 0.82, 원문 evidence 있음 | 중심 해석 가능 |
| supporting | 0.62 <= confidence < 0.82 | 보조 해석 가능 |
| excluded | confidence < 0.62 | 기본적으로 사용 금지 |

예외:

- primary가 0개면 supporting 중 상위 1개를 primary로 승격할 수 있다.
- `fallback`은 confidence가 높아도 primary가 될 수 없다.
- `time`, `quantity` category는 보통 modifier이며 단독 primary가 되지 않는다.

## MMR Diversity Selection

최종 2차 LLM에는 3~5개 항목만 넘긴다.

권장 구성:

```text
primary place/object/animal/action 2~3개
supporting quantity/time/emotion/theme 1~2개
```

중복 방지:

- 같은 category가 3개 이상이면 하위 점수 후보를 제외한다.
- `door`, `gate`, `threshold`처럼 같은 entry로 병합 가능한 후보는 하나로 합친다.
- `many`, `dawn` 같은 modifier는 중심 상징을 보조할 때만 포함한다.

## Rank Reason Templates

`rankReason`은 디버깅 가능한 짧은 문장으로 남긴다.

```text
원문 직접 등장, exact match
alias match와 scene modifier 일치
semantic match이나 evidenceText가 있어 supporting으로 유지
related match이며 중심 상징 보조용
fallback 후보라 중심 해석에서 제외
```

## Example: Snake Dream

입력:

```text
우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.
```

검색 결과:

```json
{
  "matches": [
    {
      "entryId": "snake",
      "matchType": "exact",
      "confidence": 1.0,
      "matchedText": ["구렁이", "뱀들이 수십 마리"],
      "usedFields": ["aliases", "sceneModifiers.large", "sceneModifiers.many"],
      "rankReason": "원문 직접 등장, exact/alias match와 large/many modifier 일치"
    },
    {
      "entryId": "owned_land",
      "matchType": "alias",
      "confidence": 0.96,
      "matchedText": ["우리 땅"],
      "usedFields": ["aliases", "sceneModifiers.filledWithAnimals"],
      "rankReason": "원문 직접 등장, owned territory와 filledWithAnimals modifier 일치"
    },
    {
      "entryId": "many",
      "matchType": "alias",
      "confidence": 0.92,
      "matchedText": ["수십 마리"],
      "usedFields": ["aliases", "sceneModifiers.manyAnimals"],
      "rankReason": "수량 modifier가 원문에 직접 등장"
    },
    {
      "entryId": "dawn",
      "matchType": "alias",
      "confidence": 0.76,
      "matchedText": ["새벽"],
      "usedFields": ["aliases"],
      "rankReason": "시간 modifier로 보조 반영"
    }
  ],
  "retrievalSummary": {
    "primarySymbolIds": ["snake", "owned_land"],
    "supportingSymbolIds": ["many", "dawn"],
    "excludedSymbolIds": [],
    "averageConfidence": 0.91
  }
}
```

2차 LLM 사용 규칙:

- `snake`, `owned_land`는 중심 해석에 사용한다.
- `many`는 압도감/강도 modifier로 사용한다.
- `dawn`은 낮은 가중치의 시간 modifier로만 사용한다.
- `재물운`, `태몽`, `예지몽` claim은 검색 결과에 없으므로 사용하지 않는다.

## Related

- [[RAG-Strategy-for-Dream-Reading]]
- [[Dream-Reading-Contracts]]
- [[Symbol-Encyclopedia-Schema]]

## See Also

- [[Dream-Reading-Quality-Safety]] — confidence 이후 품질 검증
- [[Multilingual-Symbol-Encyclopedia]] — 상징 항목의 검색 필드
