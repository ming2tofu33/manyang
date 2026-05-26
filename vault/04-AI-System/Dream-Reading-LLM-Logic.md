---
title: Dream Reading LLM Logic
tags:
  - ai-system
  - llm
  - dream-reading
status: draft
---

# Dream Reading LLM Logic

> 마냥의 LLM은 꿈을 혼자 점치지 않는다. 시스템이 해석 재료와 허용 범위를 잡고, LLM은 그 안에서 선명한 문장과 카드 경험을 만든다.

---

## 핵심 방향

마냥의 해몽은 **예언하지 않는 상징 리딩**이다.

안전하다는 말은 흐릿하게 말한다는 뜻이 아니다. 금지해야 하는 것은 강한 해석이 아니라 **확정, 공포, 진단, 금전/임신/질병 예언**이다.

| 구분 | 방향 |
| --- | --- |
| 피할 것 | "반드시", "조만간 큰돈", "질병 신호", "불행의 징조", "태몽 확정" |
| 허용할 것 | "읽을 수 있어요", "가까워 보여요", "장면이 만든 감각", "가능성", "오늘 살펴볼 행동" |
| 재미의 원천 | 장면 디테일, 상징 조합, 고양이 해몽사 관점, 카드화, 누적 패턴 |
| 품질 기준 | 원문 근거가 있고, 구체적이며, 저장하고 싶고, 오늘 할 수 있는 처방이 있다 |

## 기본 파이프라인

```text
사용자 꿈 원문 + 선택 옵션
-> 1차 LLM: 구조화 분석
-> RAG: 백과사전 검색과 재랭킹
-> 2차 LLM: 근거 기반 해몽 생성
-> 검증/후처리
-> 카드/처방/저장 데이터 생성
```

## 1차 LLM의 역할

1차 LLM은 해몽을 하지 않는다. 꿈 원문과 사용자가 선택한 옵션을 **검색 가능한 구조**로 바꾼다.

입력에는 최소한 다음이 포함된다.

```json
{
  "dreamText": "학교 복도에서 교실을 찾는데 문이 계속 바뀌었어.",
  "dreamDate": "2026-05-26",
  "wakeMood": "anxious",
  "dreamMood": "confusing",
  "catReaderType": "black_cat",
  "locale": "ko"
}
```

출력은 원문 증거를 포함해야 한다.

```json
{
  "summary": "학교 복도에서 교실을 찾지만 문이 계속 바뀌는 꿈",
  "sceneFacts": ["학교 복도", "교실을 찾기", "문이 계속 바뀜"],
  "symbolCandidates": [
    {
      "symbol": "학교",
      "type": "place",
      "evidenceText": "학교 복도",
      "roleInDream": "evaluation_or_learning_place",
      "importance": 5,
      "confidence": 0.95
    },
    {
      "symbol": "문",
      "type": "object",
      "evidenceText": "문이 계속 바뀌었어",
      "roleInDream": "changing_threshold",
      "importance": 5,
      "confidence": 0.92
    }
  ],
  "literalQueries": ["학교", "복도", "교실", "문"],
  "sceneQueries": ["교실을 찾기", "문이 계속 바뀜"],
  "themeQueries": ["탐색", "전환", "선택 기준이 흔들림"],
  "selectedMoods": ["anxious", "confusing"],
  "inferredEmotions": [
    { "label": "불안", "confidence": 0.72 },
    { "label": "혼란", "confidence": 0.68 }
  ],
  "safetySignals": []
}
```

중요한 점:

- `wakeMood`는 실제 사용자가 선택한 아침 감정이다.
- `dreamMood`는 꿈 안의 분위기다.
- `catReaderType`은 해석 사실보다 말투와 관점에 영향을 준다.
- 감정은 단정하지 않고 `confidence`를 둔다.
- `evidenceText`가 없으면 2차 LLM의 중심 근거로 쓰지 않는다.

## RAG 이후 2차 LLM의 역할

2차 LLM은 다음 자료만 사용한다.

- 꿈 원문
- 1차 구조화 분석 JSON
- 검색된 백과사전 항목
- 고양이 해몽사 프로필
- 안전 표현 규칙

2차 LLM은 해석 결과와 내부 grounding을 함께 출력한다.

```json
{
  "interpretation": "이 꿈은 목적지보다 입구를 계속 다시 고르는 감각에 가까워 보여요...",
  "symbolReadings": [
    {
      "symbolId": "door",
      "reading": "문이 계속 바뀌는 장면은 선택지가 없는 상태보다 기준이 자주 흔들리는 느낌으로 읽을 수 있어요."
    }
  ],
  "grounding": [
    {
      "claim": "선택 기준이 흔들리는 장면으로 읽을 수 있다",
      "basedOnSymbols": ["door", "school", "corridor"],
      "evidenceText": ["문이 계속 바뀌었어", "학교 복도"],
      "confidence": 0.84
    }
  ],
  "smallPrescription": "오늘은 선택지를 두 개까지만 줄여보고, 임시 기준 하나를 적어보세요.",
  "card": {
    "name": "바뀌는 문 앞의 고양이",
    "type": "threshold_moon",
    "keywords": ["탐색", "전환", "기준"],
    "message": "문이 바뀌어도 발밑의 기준 하나는 오늘 정할 수 있다냥."
  }
}
```

`grounding`은 사용자에게 그대로 보여주기보다 품질 검증과 디버깅에 사용한다. 결과 화면에서는 `읽은 상징`, `주요 흐름`, `오늘의 처방` 정도만 노출한다.

## 해석 Claim 제한

LLM이 아무 말처럼 느껴지는 결과는 보통 claim이 너무 많다. 마냥은 한 번의 해몽에서 해석 축을 제한한다.

| 항목 | 제한 |
| --- | --- |
| 핵심 해석 | 최대 2개 |
| 보조 해석 | 최대 1개 |
| 주요 상징 | 3~5개 |
| 오늘의 처방 | 1개 |
| 카드 키워드 | 3~4개 |
| 미래 사건 예측 | 금지 |

예를 들어 뱀 꿈에서 `재물`, `사업`, `권력`, `태몽`, `협력자`, `건강`을 모두 말하면 재미있어 보이지만 품질은 낮다. 중심을 1~2개로 좁혀야 한다.

## 좋은 안전 표현과 나쁜 안전 표현

나쁜 안전한 해몽:

```text
이 꿈은 여러 감정과 연결되어 있을 수 있어요. 오늘은 마음을 살펴보세요.
```

좋은 안전한 해몽:

```text
학교 복도에서 교실을 찾는 장면은 "아직 도착하지 못한 상태"보다 "어디로 들어가야 할지 계속 고르는 마음"에 가까워 보여요. 문이 계속 바뀌었다면 선택지가 없는 게 아니라 선택 기준이 자주 흔들리는 흐름으로 읽을 수 있어요.
```

차이는 원문 장면을 직접 반영했는지, 상징 사이의 관계를 설명했는지, 단정 없이도 선명한 해석을 했는지에 있다.

## 전통 해몽 스타일과의 거리

외부 LLM이나 일반 해몽 서비스는 다음처럼 답하기 쉽다.

```text
본인의 땅에 큰 구렁이와 수십 마리의 뱀이 나타난 것은 매우 길한 징조입니다.
조만간 재물운이 크게 상승하고, 사업이 확장될 가능성이 높습니다.
```

이 방식은 사용자가 "해몽 받았다"는 느낌을 받기 쉽다. 그러나 서비스 기본 엔진으로 쓰기에는 예언형 표현이 강하다.

마냥은 구조와 재미는 참고하되 확정성을 낮춘다.

```text
이 꿈은 불길함보다 "내 기반 안에서 강한 에너지와 가능성이 한꺼번에 올라오는 장면"에 가깝게 읽을 수 있어요. 우리 땅은 내가 지키고 가꾸는 영역을 떠올리게 하고, 큰 구렁이와 많은 뱀은 하나의 작은 감정보다 여러 갈래의 힘이 동시에 움직이는 감각을 보여줍니다.
```

## 예시: 큰 구렁이와 수십 마리의 뱀

사용자 입력:

```text
오늘 새볔에 꿈을 꾸었는데 우리 땅에 큰 구렁이들하고 뱀들이 수십마리가 나왔어.
```

1차 분석:

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
      "symbol": "구렁이",
      "type": "animal",
      "importance": 5,
      "evidenceText": "큰 구렁이들",
      "roleInDream": "large_snake"
    },
    {
      "symbol": "뱀",
      "type": "animal",
      "importance": 5,
      "evidenceText": "뱀들이 수십마리",
      "roleInDream": "many_snakes"
    },
    {
      "symbol": "우리 땅",
      "type": "place",
      "importance": 4,
      "evidenceText": "우리 땅에",
      "roleInDream": "owned_territory"
    }
  ],
  "themes": ["영역", "낯선 생명력", "압도감", "숨은 움직임", "경계"],
  "ragQueries": ["뱀", "구렁이", "큰 뱀", "우리 땅", "땅", "많은 동물", "수십 마리", "새벽"]
}
```

RAG가 가져와야 하는 지식:

- `snake`: 본능, 경계, 변화, 생명력, 숨은 움직임
- `large_snake`: 무시하기 어려운 힘, 크게 자라난 감각, 강한 생명력
- `owned_land`: 생활 기반, 가족/자기 영역, 지켜야 한다고 느끼는 범위
- `many`: 압도감, 여러 갈래의 신호, 한꺼번에 올라오는 감각
- `dawn`: 전환 시간, 낮은 가중치

최종 해몽의 중심:

```text
이 꿈은 "나쁜 징조"라기보다, 내 영역 안에서 조용히 커지고 있던 감각들이 한꺼번에 모습을 드러낸 장면으로 읽을 수 있어요.
```

카드 예시:

```json
{
  "name": "땅 아래 깨어난 구렁이",
  "type": "earth_moon",
  "keywords": ["영역", "생명력", "경계", "압도감"],
  "message": "한꺼번에 올라온 감각을 불길함으로 몰지 말고, 지금 내 영역에서 무엇이 커지고 있는지 살펴보자냥."
}
```

## Related

- [[Dream-Reading-Contracts]]
- [[LLM-Pipeline]]
- [[Prompt-Guides]]
- [[RAG-Strategy-for-Dream-Reading]]
- [[Multilingual-Symbol-Encyclopedia]]

## See Also

- [[Dream-Reading-Quality-Safety]] — 품질 검증, 안전 route, retry 기준
- [[Cat-Reader-Voice]] — 고양이 해몽사 말투 기준
