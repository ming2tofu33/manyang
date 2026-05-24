---
title: Implementation Plan
tags:
  - implementation
  - planning
---

# Implementation Plan

> 속도는 유지하되, 핵심 루프와 계약이 깨지지 않게 만드는 실행 계약.

---

## 문서 역할 분리

| 문서 | 역할 |
| --- | --- |
| [[Implementation-Plan]] | 실행 계약, 상태 규칙, hard gates |
| [[Phase-Flow]] | Phase와 Gate |
| [[Checklists-&-DoD]] | 완료 기준 |
| [[plans/ACTIVE_SPRINT]] | 현재 스프린트 |
| `vault/09-Implementation/plans/` | 개별 작업 계획 |

## Hard Gates

### 1. 꿈 입력 루프가 깨지면 다음 기능을 추가하지 않는다

홈, 입력, 분석, 결과, 저장, 기록 조회가 end-to-end로 동작해야 다음 화면을 붙인다.

### 2. DB/API/타입 계약은 같이 바꾼다

Supabase schema, API response, TypeScript type 중 하나가 바뀌면 같은 작업에서 함께 반영한다.

### 3. AI 호출은 서버를 통과한다

LLM API key는 클라이언트에 노출하지 않는다. 모든 AI 호출은 Next.js API route 또는 Edge Function에서 처리한다.

### 4. 해몽 안전 표현은 테스트 대상이다

진단, 예언, 질병, 불행 단정 표현은 결과에 나오면 안 된다.

### 5. 결과 저장은 MVP의 일부다

해몽 결과를 보는 데서 끝나면 제품 차별점이 약하다. 결과는 반드시 기록에 저장되어야 한다.

### 6. 디자인은 모바일 화면에서 검증한다

참고 이미지는 모바일 앱형이다. MVP UI는 모바일 viewport 기준으로 먼저 확인한다.

## 상태 규칙

| 상태 | 의미 |
| --- | --- |
| `todo` | 시작 전 |
| `doing` | 진행 중 |
| `review` | 동작하지만 검증/정리 대기 |
| `blocked` | 결정 또는 의존성 부족 |
| `done` | 검증 증거까지 완료 |
| `cancelled` | 의도적으로 제외 |

## Related

- [[Phase-Flow]]
- [[Checklists-&-DoD]]
- [[plans/ACTIVE_SPRINT]]

## See Also

- [[MVP-Scope]] — 실행 범위의 제품 근거 (01-Core)
- [[System-Architecture]] — 기술 구조 (02-Architecture)

