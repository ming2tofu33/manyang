---
title: Web Mobile Shared Architecture
tags:
  - architecture
  - web
  - mobile
  - react-native
  - monorepo
source: product discussion 2026-07-11
status: confirmed
updated: 2026-07-15
---

# Web Mobile Shared Architecture

> Next.js 웹과 Expo·React Native 앱은 UI를 분리하고, 제품 규칙·콘텐츠·API 계약·서버를 공유한다.

---

## 결정 요약

- 웹은 현재 Next.js 앱을 계속 사용한다.
- 모바일은 Expo·React Native 기반의 별도 클라이언트로 제작한다.
- Capacitor 중간 앱은 만들지 않는다.
- 웹과 앱의 UI 컴포넌트는 각각 관리한다.
- 타로, 관계, 달조각, 콘텐츠, API 계약은 공통 패키지로 분리한다.
- 앱 결제는 StoreKit과 Google Play Billing을 사용하고 서버에서 검증한다.

## 왜 UI를 분리하는가

웹과 앱의 역할이 다르다.

- 웹은 SEO, 공유 링크, 무료 체험, 빠른 실험에 최적화한다.
- 앱은 캐릭터 방, 관계, 수집, 결제, 푸시, 애니메이션에 최적화한다.

같은 브랜드와 데이터 모델을 사용하되 화면 구조와 상호작용은 플랫폼에 맞게 설계한다.

## 목표 저장소 구조

```text
manyang/
├─ frontend/                    # 현재 Next.js 웹, 이후 apps/web 후보
├─ mobile/                      # Expo·React Native 앱
├─ packages/
│  ├─ contracts/               # API 요청·응답과 영속 데이터 계약
│  ├─ domain/                  # 타로·관계·달조각 순수 규칙
│  ├─ content/                 # 카드·질문·고양이·에피소드·공통 문구
│  ├─ api-client/              # 플랫폼 독립 HTTP 클라이언트
│  └─ design-tokens/           # 색상·타이포·간격·테마 값
├─ backend/                     # AI·DB·결제 검증·서버 유스케이스
└─ supabase/                    # DB 마이그레이션
```

초기 리팩터링에서는 `frontend/`를 이동하지 않는다. 루트 npm workspace와 `packages/`를 먼저 도입하고 기존 웹이 공통 패키지를 사용하도록 전환한다.

## 패키지 경계

### contracts

- 꿈·타로 API 요청과 응답
- 관계 상태와 해금 결과
- 달조각 잔액·장부·구매 검증 결과
- 리딩·편지·수집 아이템 저장 형식
- 런타임 검증 스키마

React, Next.js, Node 전용 API를 포함하지 않는다.

### domain

- 관계 단계 계산
- 의미 있는 활동일 판정
- 타로 선택과 리딩 비용 규칙
- 달조각 차감 가능 여부
- 콘텐츠 해금 조건
- 날짜 경계와 일일 제한

순수 함수로 작성하고 저장소를 직접 읽지 않는다.

### content

- 타로 카드 데이터
- 질문 카테고리와 문구
- 고양이 프로필과 관계 에피소드
- 리딩 후 반응 문구
- 공통 다국어 콘텐츠

웹 이미지 경로나 React 컴포넌트는 넣지 않는다.

### api-client

- 플랫폼 독립 `fetch` 호출
- 공통 오류 매핑
- 요청 ID와 재시도 정책
- 인증 토큰 공급자를 외부에서 주입

웹은 쿠키 기반 동일 출처 요청을 사용하고, 모바일은 Supabase access token을 Bearer 헤더로 전달한다.

### design-tokens

- 브랜드 색상
- 고양이별 테마 키
- 타이포 스케일
- 간격과 radius
- 그림자와 모션 duration 이름

웹은 CSS 변수나 Tailwind 값으로, 앱은 React Native 스타일 값으로 변환한다.

## 플랫폼별 코드

### 웹 전용

- Next.js App Router와 Route Handler
- SEO, sitemap, robots, 공개 백과 페이지
- CSS, Tailwind, DOM 기반 애니메이션
- 게스트 localStorage
- 웹 공유 이미지 렌더링

### 앱 전용

- Expo Router 또는 모바일 내비게이션
- React Native 화면과 제스처
- StoreKit·Google Play Billing
- 푸시 알림, 딥링크, 보안 저장소
- 고양이 방과 네이티브 애니메이션
- 기기 캐시

## API 경계

현재 Next.js API는 공통 HTTP API로 발전시킨다.

```text
Web Client
→ Cookie Auth
→ /api/v1/*

Mobile Client
→ Authorization: Bearer <Supabase access token>
→ /api/v1/*
```

Route Handler의 책임:

1. 인증 해석
2. 요청 스키마 검증
3. 서버 유스케이스 호출
4. HTTP 상태와 응답 변환

AI, DB, 결제, 관계 계산은 Route Handler에서 직접 구현하지 않는다.

## 인증 원칙

- 웹은 기존 Supabase 쿠키 인증을 유지한다.
- 모바일은 Supabase 세션의 access token을 사용한다.
- 서버는 쿠키와 Bearer 인증을 동일한 사용자 컨텍스트로 정규화한다.
- 결제·달조각·관계·개인화 API는 인증 사용자만 호출할 수 있다.
- 게스트 웹 기록은 앱 설치와 로그인 시 명시적 이전 흐름을 제공한다.

## 저장 원칙

- 로그인 사용자의 서버 기록이 기준 데이터다.
- 웹 localStorage는 게스트 기록과 임시 draft에만 사용한다.
- 모바일 기기 저장소는 캐시와 임시 draft에만 사용한다.
- 달조각 잔액, 구매, 차감, 관계 단계, 소유 아이템은 서버에서만 변경한다.
- 모든 금전성 작업은 멱등 키와 원자적 트랜잭션을 사용한다.

## 결제 구조

```text
Apple IAP ─────┐
               ├→ 영수증 검증 → 구매 장부 → 달조각 장부 → 잔액
Google Billing ┘
```

- 웹 결제는 제공하지 않는다.
- iOS와 Android 상품 ID를 내부 상품 SKU에 매핑한다.
- 외부 거래 ID는 전역 유일 키로 저장한다.
- 구매 지급과 달조각 차감을 append-only 장부로 기록한다.
- 구매분과 프로모션 지급분을 구분한다.
- 환불과 차지백은 삭제가 아니라 반대 조정 거래로 남긴다.
- 리딩 생성은 차감 예약과 완료·복구 상태를 가진다.

## 현재 코드에서 분리할 대상

| 현재 위치 | 분리 방향 |
| --- | --- |
| `frontend/src/lib/daily-tarot.ts` | 순수 타로 규칙은 domain, localStorage는 web adapter |
| `frontend/src/lib/cat-readers.ts` | 캐릭터 카탈로그는 content, 선택 저장은 web adapter |
| `frontend/src/lib/tarot-question-prompts.ts` | content |
| `frontend/src/lib/tarot-*-cards.ts` | content |
| `frontend/src/lib/access-policy.ts` | 순수 접근 정책은 domain, dev storage는 web adapter |
| `frontend/src/lib/server/manyang-db.ts` | backend server persistence |
| `backend/src/contracts/*` | contracts |
| `frontend/src/lib/i18n/messages.ts` | 공통 콘텐츠와 웹 UI 문구를 분리 |

## 의존성 규칙

```text
web UI ───────┐
mobile UI ────┼→ api-client / domain / content / contracts
backend ──────┘

contracts → 외부 플랫폼 의존 없음
domain → contracts만 의존 가능
content → contracts만 의존 가능
api-client → contracts만 의존 가능
web/mobile → backend 직접 import 금지
```

웹과 모바일의 UI 코드 공유는 목표가 아니다. 공통 규칙과 콘텐츠를 한 번만 작성하는 것이 목표다.

## 단계적 이전 순서

1. 루트 npm workspace 구성
2. contracts 패키지 생성과 API 타입 이전
3. domain 패키지 생성과 순수 규칙 이전
4. content 패키지 생성과 카드·질문·캐릭터 데이터 이전
5. 기존 웹이 공통 패키지를 사용하도록 전환
6. API에 쿠키·Bearer 인증 동시 지원
7. 로그인 기록을 서버 기준으로 통일
8. api-client와 design-tokens 추가
9. Expo 모바일 클라이언트 생성
10. 앱 결제와 푸시 연결

각 단계는 기존 웹의 테스트, 타입 검사, 빌드를 통과한 뒤 다음 단계로 이동한다.

## 검증 기준

- 웹의 기존 사용자 흐름과 SEO URL이 유지된다.
- 브라우저 API가 domain·content·contracts에 들어가지 않는다.
- 웹 UI가 `@manyang/backend`를 직접 import하지 않는다.
- 동일 계약 테스트를 웹 API와 모바일 클라이언트가 공유한다.
- 쿠키와 Bearer 인증이 같은 사용자 권한을 만든다.
- 결제 콜백 재전송으로 달조각이 중복 지급되지 않는다.
- 리딩 실패·타임아웃 시 달조각 잔액이 보존된다.
- 모바일이 없어도 공통 패키지로 전환된 웹이 정상 동작한다.

## 열린 결정

- Expo 앱 내비게이션과 상태 관리 선택
- 이미지·애니메이션 에셋 패키징 방식
- 게스트 웹 기록의 모바일 이전 UX
- 푸시 제공자와 알림 스케줄러
- 앱 분석 이벤트 수집 도구
- 앱 최소 지원 OS

## Progress

- 2026-07-15: 루트 npm workspace와 `@manyang/contracts`를 도입하고, 꿈(dream) transport 계약을 백엔드와 웹이 공유하도록 전환했다. 타로 계약과 content/domain 분리는 후속 스프린트로 남긴다. Expo 클라이언트는 아직 시작하지 않았다.

## Related

- [[System-Architecture]]
- [[Tech-Decisions]]
- [[API-Contract]]
- [[Database-Schema]]

## See Also

- [[Character-Reading-Retention-and-Monetization]] — 캐릭터·타로·재화 제품 원칙 (06-Business)
- [[Dream-Reading-Contracts]] — 기존 꿈 리딩 계약 (04-AI-System)
