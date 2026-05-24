---
title: Database Schema
tags:
  - architecture
  - database
source: docs/manyang-dream-project-spec-updated.md
---

# Database Schema

> 꿈 원문, 분석 결과, 백과사전, 카드, 상징 히스토리를 분리해 저장한다.

---

## 핵심 테이블

| 테이블 | 역할 |
| --- | --- |
| `users` | 사용자, 플랜, 표시명 |
| `dream_entries` | 꿈 원문과 날짜, 기억 여부, 기분 |
| `dream_analyses` | LLM 분석과 최종 해몽 |
| `dream_encyclopedia` | 상징 백과사전 |
| `dream_cards` | 꿈 카드/영수증 데이터 |
| `user_symbol_history` | 사용자별 상징 등장 횟수 |
| `weekly_reports` | 주간 리포트 |

## MVP 최소 스키마

Prototype Mode에서는 DB 없이 아래 타입만 먼저 고정한다.

```ts
export type DreamEntry = {
  id: string;
  dreamDate: string;
  rawText: string;
  remembered: boolean;
  wakeMood?: string;
  dreamMood?: string;
  createdAt: string;
};

export type DreamAnalysis = {
  id: string;
  dreamId: string;
  summary: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  encyclopediaRefs: string[];
  interpretation: string;
  smallPrescription: string;
  catReaderType: "black_cat";
  createdAt: string;
};

export type DreamCard = {
  id: string;
  dreamId: string;
  cardName: string;
  cardType: string;
  keywords: string[];
  summary: string;
  message: string;
  theme: string;
  createdAt: string;
};
```

## Supabase 전환 기준

- 꿈 입력과 결과 저장 루프가 UI에서 안정적으로 동작한다.
- 백과사전 seed 구조가 최소 30개 항목까지 확정된다.
- LLM 출력 JSON schema가 10개 샘플에서 깨지지 않는다.

## Related

- [[System-Architecture]]
- [[API-Contract]]
- [[Tech-Decisions]]

## See Also

- [[Dream-Archive-&-Calendar]] — 저장 데이터가 쓰이는 화면 (03-Features)
- [[Encyclopedia-Seed-Data]] — 백과사전 seed (05-Content)

