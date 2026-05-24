---
title: LLM Pipeline
tags:
  - ai-system
  - pipeline
source: docs/manyang-dream-project-spec-updated.md
---

# LLM Pipeline

> 꿈 원문을 구조화하고, 백과사전 항목을 검색한 뒤, 근거 기반 해몽과 카드 문구를 생성한다.

---

## 기본 파이프라인

```text
1. 사용자가 꿈 입력
2. LLM이 구조화 분석 JSON 생성
3. symbols 기반으로 백과사전 검색
4. 관련 백과사전 항목을 LLM에 전달
5. LLM이 최종 해몽 생성
6. LLM이 꿈 카드/영수증 정보 생성
7. DB 또는 localStorage에 저장
8. 결과 화면 렌더링
```

## 1차 LLM: 구조화 분석

목적:

- 꿈 원문 요약
- 상징, 감정, 테마 추출
- 백과사전 검색 키워드 생성

출력:

```json
{
  "summary": "string",
  "symbols": ["string"],
  "symbol_candidates": [
    {
      "text": "string",
      "type": "place | object | action | person | animal | nature | emotion",
      "importance": 1
    }
  ],
  "emotions": ["string"],
  "themes": ["string"],
  "dream_mood": "string",
  "safety_note": "string | null"
}
```

## 2차 LLM: 최종 해몽

입력:

- 꿈 원문
- 구조화 분석 JSON
- 백과사전 검색 결과
- 고양이 해몽사 프로필
- 사용자 선택 감정

출력:

```json
{
  "dream_reading": "string",
  "symbol_readings": [
    {
      "symbol": "string",
      "reading": "string"
    }
  ],
  "small_prescription": "string",
  "card": {
    "name": "string",
    "type": "string",
    "keywords": ["string"],
    "summary": "string",
    "message": "string",
    "visual_prompt": "string"
  }
}
```

## 실패 처리

- JSON parse 실패 시 한 번 재시도한다.
- 백과사전 매칭이 없으면 가장 가까운 seed 항목 1~3개를 fallback으로 사용한다.
- AI 호출 실패 시 mock 해몽 결과를 반환해 UI 루프를 막지 않는다.

## Related

- [[Prompt-Guides]]
- [[Encyclopedia-Retrieval]]

## See Also

- [[API-Contract]] — API 응답 계약 (02-Architecture)
- [[Safety-&-Compliance]] — AI 표현 안전 기준 (07-Operations)

