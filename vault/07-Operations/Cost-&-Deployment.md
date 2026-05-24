---
title: Cost & Deployment
tags:
  - operations
  - cost
  - deployment
source: docs/manyang-dream-project-spec-updated.md
---

# Cost & Deployment

> 초기 비용은 LLM 호출 횟수와 이미지 생성 여부가 결정한다. 1차 MVP는 템플릿 기반으로 비용을 제한한다.

---

## 비용 원칙

- 이미지 생성 모델은 1차 MVP에서 제외한다.
- LLM 호출은 꿈 1건당 구조화 분석 1회, 최종 해몽 1회로 제한한다.
- Prototype Mode에서는 mock 결과로 UI 검증을 먼저 한다.
- 같은 꿈 재분석은 명시적 요청이 없으면 하지 않는다.

## 배포 후보

| 영역 | 후보 |
| --- | --- |
| Frontend | Vercel |
| DB/Auth | Supabase |
| Storage | Supabase Storage |
| Monitoring | Vercel Analytics, Supabase logs |

## MVP 배포 기준

- 홈, 입력, 결과, 기록 화면이 모바일에서 동작한다.
- mock mode와 real AI mode를 env로 분리할 수 있다.
- API key가 클라이언트 번들에 노출되지 않는다.

## Related

- [[Safety-&-Compliance]]

## See Also

- [[System-Architecture]] — 배포 대상 구조 (02-Architecture)
- [[Checklists-&-DoD]] — 배포 전 체크리스트 (09-Implementation)

