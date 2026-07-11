---
title: Tech Decisions
tags:
  - architecture
  - decisions
source: docs/manyang-dream-project-spec-updated.md
---

# Tech Decisions

> 빠르게 검증하되, 나중에 Supabase와 LLM으로 확장 가능한 결정을 먼저 고정한다.

---

## 결정 1. 웹 MVP 우선

모바일 앱처럼 보이는 웹 MVP로 시작한다. PWA와 네이티브 앱은 Phase 4로 미룬다.

## 결정 2. Prototype Mode를 둔다

처음부터 Supabase와 LLM을 붙이면 UI 루프 검증 속도가 느려진다. 먼저 로컬 seed와 mock analysis로 화면과 저장 경험을 만든다.

## 결정 3. 백과사전 seed는 코드와 DB 모두 가능한 형태로 작성한다

초기에는 `src/data/encyclopedia.ts` 또는 JSON으로 시작한다. Supabase 도입 시 동일한 필드를 table로 이전한다.

## 결정 4. 이미지 생성은 제외한다

꿈 카드와 꿈 영수증은 CSS/HTML 템플릿으로 렌더링한다. 이미지 생성 모델은 소장성 검증 이후 확장한다.

## 결정 5. 안전 문구는 제품 계약이다

꿈 해석은 오락과 자기 성찰용이며 진단이 아니라는 문구를 결과 화면과 설정/고지 영역에 둔다.

## 결정 6. 웹과 모바일 UI를 분리한다

웹은 Next.js로 유지하고 모바일은 Expo·React Native 별도 클라이언트로 제작한다. UI는 플랫폼별로 구현하고 타로·관계·달조각 규칙, 콘텐츠, API 계약, 서버를 공유한다. 세부 구조는 [[Web-Mobile-Shared-Architecture]]를 따른다.

## 결정 7. 웹은 유입, 앱은 관계·수집·결제를 담당한다

웹 결제는 제공하지 않는다. 웹은 무료 체험, SEO, 공유, 앱 설치 전환을 담당하고 앱은 고양이 관계, 수집, 달조각 구매·사용, Moon Pass를 담당한다.

## Related

- [[System-Architecture]]
- [[Database-Schema]]
- [[API-Contract]]
- [[Web-Mobile-Shared-Architecture]]

## See Also

- [[MVP-Scope]] — 기술 결정을 제한하는 MVP 범위 (01-Core)
- [[Safety-&-Compliance]] — 표현 안전 기준 (07-Operations)
