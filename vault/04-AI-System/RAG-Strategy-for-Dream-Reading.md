---
title: RAG Strategy for Dream Reading
tags:
  - ai-system
  - rag
  - retrieval
status: draft
---

# RAG Strategy for Dream Reading

> 마냥의 RAG는 문서 Q&A가 아니라 상징 리딩을 위한 검색 시스템이다. 목표는 정답 문서를 찾는 것이 아니라 꿈 장면을 해석할 수 있는 상징 재료를 안정적으로 고르는 것이다.

---

## 목표

RAG는 다음 문제를 해결한다.

- LLM이 근거 없이 해몽을 지어내는 문제
- `뱀 = 재물`, `문 = 기회`처럼 단어 뜻풀이만 하는 문제
- 다국어 입력에서 같은 상징을 놓치는 문제
- 사용자의 원문과 백과사전 항목 사이의 표현 차이
- 장면 modifier를 반영하지 못해 해몽이 밋밋해지는 문제

점수 계산과 primary/supporting/excluded 분류는 [[Retrieval-Scoring-Contract]]를 따른다.

## 검색 단계

```text
1차 LLM 구조화 분석
-> exact/alias match
-> keyword/BM25 search
-> vector semantic search
-> metadata filtering
-> reranking
-> MMR diversity selection
-> top 3~5 entries 전달
```

## 1. Hybrid Search

마냥에는 hybrid search가 가장 중요하다.

| 방식 | 역할 |
| --- | --- |
| exact/alias match | 사용자가 직접 쓴 상징을 강하게 반영 |
| keyword/BM25 | 조사, 복합어, 다국어 토큰 변형 보완 |
| vector search | "입구가 사라짐"처럼 직접 단어가 없는 장면을 상징으로 연결 |

초기 가중치 예시:

```text
exact/alias score: 45%
keyword score: 25%
vector score: 30%
```

예:

```text
입력: 학교에서 교실을 찾는데 입구가 계속 바뀌었어.

exact/alias:
학교, 교실

vector:
문, 복도, 찾기, 전환

최종 후보:
학교 0.95
문 0.86
복도 0.82
찾기 0.78
```

## 2. Metadata Filtering

백과사전 항목에는 검색 제어용 metadata가 필요하다.

```ts
type RetrievalMetadata = {
  locale: "ko" | "en";
  category: "place" | "object" | "action" | "nature" | "animal" | "person" | "emotion" | "quantity" | "time";
  safetyLevel: "safe" | "sensitive";
  cultureScope: "global" | "ko" | "en";
  accessTier: "free" | "premium";
};
```

사용 예:

- 한국어 사용자: `ko`와 `global` 우선
- 영어 사용자: `en`과 `global` 우선
- 위험 신호가 있는 꿈: `sensitive` 항목은 표현 강도를 낮춤
- 무료 사용자: 기본 상징과 짧은 scene modifier 중심
- 프리미엄 사용자: 반복 패턴, 세부 modifier, 다른 관점 추가

## 3. Query Expansion

1차 LLM은 검색어를 한 줄로 만들지 않고 여러 층으로 분리한다.

```json
{
  "literalQueries": ["학교", "복도", "교실", "문"],
  "sceneQueries": ["교실을 찾기", "문이 계속 바뀜"],
  "themeQueries": ["탐색", "전환", "선택 기준이 흔들림"],
  "modifierQueries": ["changing door", "owned territory", "many snakes"]
}
```

규칙:

- `literalQueries`는 원문 직접 근거가 있어야 한다.
- `themeQueries`는 중심 해석에 바로 쓰지 않고 검색 보조로만 사용한다.
- query expansion은 해몽을 생성하면 안 된다. 검색 표현만 확장한다.

## 4. Reranking

검색 결과는 그대로 2차 LLM에 넘기지 않는다. 다음 기준으로 재정렬한다.

| 기준 | 우선순위 |
| --- | --- |
| 사용자 원문에 직접 등장 | 높음 |
| exact/alias match | semantic match보다 높음 |
| scene modifier 일치 | 일반 항목보다 높음 |
| 1차 LLM importance | 높을수록 우선 |
| 선택 감정과의 연결 | 보조 가중치 |
| 최근 반복 상징 | 개인화 사용 시 가중치 |
| confidence 낮음 | 중심 해석에서 제외 |

출력 예:

```json
{
  "entryId": "snake",
  "label": "뱀",
  "matchType": "exact",
  "confidence": 0.95,
  "matchedText": "뱀들이 수십마리",
  "usedFields": ["coreMeanings", "sceneModifiers.many"],
  "rankReason": "원문 직접 등장, 수량 modifier 일치"
}
```

## 5. MMR Diversity

꿈 하나에서 비슷한 항목만 여러 개 잡히면 결과가 단조롭다.

나쁜 결과:

```text
문, 대문, 입구, 문턱, 창문
```

좋은 결과:

```text
문, 복도, 학교, 찾기, 혼란
```

마냥은 top-k를 고를 때 category 다양성을 유지한다.

```text
장소 1~2개
사물 1~2개
행동 1개
감정/테마 1개
수량/시간은 보조 modifier
```

## 6. Vector DB 도입 시점

초기 백과사전이 30~100개라면 별도 vector DB는 필수 아니다. alias와 rule-based matcher로 시작해도 된다.

도입이 필요한 순간:

- 백과 항목이 300개 이상으로 늘어난다.
- 영어/한국어 입력을 동시에 안정적으로 처리해야 한다.
- 사용자가 상징을 직접 쓰지 않고 묘사로 표현한다.
- 반복 기록과 개인화 검색이 중요해진다.

권장 순서:

```text
1. aliases, searchText, category, sceneModifiers를 먼저 설계
2. 현재 문자열/alias matcher 유지
3. 미매칭 로그 수집
4. Postgres + pgvector 도입
5. exact + vector hybrid로 전환
```

처음에는 Pinecone/Weaviate보다 `Postgres + pgvector`가 적합하다. 백과사전, 사용자 기록, embedding을 한 DB에서 관리할 수 있어 운영이 단순하다.

## 7. 무엇을 Embedding할 것인가

백과사전 본문 전체를 통째로 embedding하면 검색이 흐려질 수 있다. 항목별 `searchText`를 별도로 만든다.

```text
id: door
ko searchText: 문, 대문, 입구, 문턱, 잠긴 문, 열리지 않는 문, 선택, 경계, 전환
en searchText: door, gate, doorway, threshold, locked door, changing door, boundary, choice, transition
scene modifiers: open, locked, changing, broken, unreachable
```

Embedding 대상:

- label
- aliases
- core meanings
- scene modifiers
- metaphor hooks
- context questions

Embedding에서 제외하거나 낮게 반영:

- 긴 설명문
- 사용자-facing 감성 문장
- 카드 제목 seed
- 안전 고지

## 8. Personal Memory Retrieval

개인화는 차별점이 크지만 민감도도 높다. 원문 전체보다 구조화된 요약 데이터를 우선 저장한다.

```json
{
  "symbolIds": ["school", "corridor", "door"],
  "themes": ["searching", "transition"],
  "moods": ["anxious"],
  "date": "2026-05-26"
}
```

사용자-facing 표현:

```text
최근 기록에서는 학교, 복도, 찾기 상징이 자주 보여요. 단정하기보다, 요즘 꿈은 "도착"보다 "탐색" 쪽으로 기울어 있는 흐름으로 읽을 수 있어요.
```

금지:

```text
당신은 평가 불안에 시달리고 있습니다.
```

## 9. Dynamic Few-Shot Retrieval

백과 RAG와 별도로 좋은 해몽 예시를 검색해 2차 LLM에 넣을 수 있다. 목적은 의미 검색이 아니라 **문체와 구성 안정화**다.

예시 저장 단위:

- 비슷한 꿈 구조
- 좋은 해몽 문단
- 좋은 카드 제목
- 좋은 작은 처방
- 안전하게 낮춘 표현 예시

사용 규칙:

- 예시는 2~3개로 제한한다.
- 예시의 상징 의미를 그대로 복사하지 않는다.
- 현재 꿈의 RAG 근거가 예시보다 우선한다.

## 나중으로 미룰 기능

| 기능 | 판단 |
| --- | --- |
| HyDE | 가상의 해몽 문서가 검색에 섞여 hallucination 위험이 있음 |
| Parent Document Retriever | 백과 항목이 구조화되어 있으면 과함 |
| Contextual Compression | 긴 문서 RAG용에 가깝고, 마냥은 필드를 골라 넘기면 됨 |
| 전용 vector DB | 초기에는 pgvector로 충분 |

## Related

- [[Encyclopedia-Retrieval]]
- [[Dream-Reading-Contracts]]
- [[Retrieval-Scoring-Contract]]
- [[Dream-Reading-LLM-Logic]]
- [[Multilingual-Symbol-Encyclopedia]]

## See Also

- [[System-Architecture]] — 확장 흐름과 pgvector 위치
- [[Dream-Reading-Quality-Safety]] — retrieval confidence와 검증 기준
