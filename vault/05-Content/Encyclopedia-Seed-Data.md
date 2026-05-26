---
title: Encyclopedia Seed Data
tags:
  - content
  - encyclopedia
source: docs/manyang-dream-project-spec-updated.md
---

# Encyclopedia Seed Data

> 초기 백과사전은 10개 샘플로 시작하고, MVP 전 30개까지 확장한다.

---

## 데이터 구조

```ts
export type EncyclopediaEntry = {
  symbol: string;
  slug: string;
  category: "place" | "object" | "action" | "nature" | "animal" | "emotion";
  aliases: string[];
  coreMeanings: string[];
  positiveReadings: string[];
  negativeReadings: string[];
  contextQuestions: string[];
  relatedSymbols: string[];
  catInterpretationHint: string;
  body: string;
};
```

## 초기 10개 상징

| 상징 | 핵심 의미 |
| --- | --- |
| 문 | 경계, 선택, 기회, 망설임 |
| 열쇠 | 접근 권한, 해결 방법, 숨겨진 가능성 |
| 복도 | 전환 구간, 이동 중인 마음, 결정 전 상태 |
| 신발 | 이동 준비, 자기 기반, 방향성 |
| 엘리베이터 | 단계 변화, 통제감, 기다림 |
| 물 | 감정 흐름, 무의식, 정화, 압도감 |
| 비 | 해소, 슬픔, 정화, 가라앉은 감정 |
| 학교 | 평가, 학습, 과거의 기준, 준비 상태 |
| 고양이 | 직감, 독립성, 조용한 관찰 |
| 계단 | 단계적 변화, 노력, 진행 과정 |

## 30개 확장 후보

- 장소: 집, 병원, 바다, 방, 지하철, 공항
- 사물: 가방, 거울, 책, 시계, 전화, 창문
- 행동: 잃어버림, 찾기, 뛰기, 기다림, 문을 열기
- 자연/감각: 불, 바람, 어둠, 안개, 별
- 동물/존재: 개, 새, 물고기, 모르는 사람, 어린아이

## 작성 원칙

- 단정형 의미를 쓰지 않는다.
- 좋은/나쁜 꿈으로 나누기보다 문맥 질문을 둔다.
- 결과 화면에서 바로 인용 가능한 짧은 문장을 포함한다.

## Related

- [[Multilingual-Symbol-Encyclopedia]]
- [[RAG-Strategy-for-Dream-Reading]]
- [[Cat-Reader-Voice]]

## See Also

- [[Dream-Encyclopedia]] — 백과사전 화면 (03-Features)
- [[Encyclopedia-Retrieval]] — 검색 방식 (04-AI-System)
