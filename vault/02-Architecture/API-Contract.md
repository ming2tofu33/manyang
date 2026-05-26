---
title: API Contract
tags:
  - architecture
  - api
source: docs/manyang-dream-project-spec-updated.md
---

# API Contract

> 1차 MVP API는 꿈 분석, 꿈 목록, 백과사전 조회 세 가지가 중심이다.

---

## POST `/api/dreams/analyze`

꿈 원문을 받아 분석, 해몽, 카드 데이터를 생성한다.

### Request

```json
{
  "dreamText": "낡은 학교 복도에서 교실을 찾는 꿈을 꿨어.",
  "dreamDate": "2026-05-11",
  "wakeMood": "anxious",
  "dreamMood": "confusing",
  "catReaderType": "black_cat"
}
```

### Response

```json
{
  "dreamId": "uuid",
  "analysisId": "uuid",
  "cardId": "uuid",
  "summary": "낡은 학교 복도에서 교실을 찾는 꿈",
  "symbols": ["학교", "복도", "교실", "찾기"],
  "interpretation": "복도는 목적지에 도착하기 전의 전환 구간과 연결되어 보입니다.",
  "smallPrescription": "오늘 시작하기 전 준비물 하나만 먼저 확인해보자냥.",
  "card": {
    "name": "길 잃은 복도냥",
    "type": "half_moon",
    "keywords": ["탐색", "선택", "조급함"]
  }
}
```

## POST `/api/dreams/morning`

꿈을 기억하지 못한 날의 아침 기록을 생성한다.

```json
{
  "dreamDate": "2026-05-24",
  "wakeMood": "calm",
  "color": "violet",
  "bodyState": "heavy",
  "firstThought": "오늘은 천천히 시작하고 싶다"
}
```

## GET `/api/dreams`

꿈 기록 목록을 조회한다.

```text
?page=1&limit=20&symbol=복도&mood=anxious
```

## GET `/api/encyclopedia`

상징 백과 목록을 조회한다.

## GET `/api/encyclopedia/:slug`

상징 상세, 관련 상징, 사용자의 등장 횟수를 조회한다.

## Contract Rules

- API 응답은 프론트 표시 구조와 DB 저장 구조를 동시에 만족해야 한다.
- LLM 원문 응답을 그대로 클라이언트에 넘기지 않는다.
- 분석 실패 시 사용자에게 저장 가능한 fallback 메시지를 제공한다.
- 실제 LLM/RAG 도입 시 내부 단계별 계약은 [[Dream-Reading-Contracts]]를 따른다.

## Related

- [[System-Architecture]]
- [[Database-Schema]]
- [[Tech-Decisions]]
- [[Dream-Reading-Contracts]]

## See Also

- [[LLM-Pipeline]] — API 내부 AI 흐름 (04-AI-System)
- [[Checklists-&-DoD]] — API 완료 기준 (09-Implementation)
