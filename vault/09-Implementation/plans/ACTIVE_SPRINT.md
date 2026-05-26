---
title: Active Sprint
tags:
  - implementation
  - sprint
status: active
---

# Active Sprint

> 현재 목표: 문서 vault를 기준으로 프로젝트를 시작할 수 있는 Phase 0/1 작업을 정리한다.

---

## Sprint Goal

마냥 꿈해몽의 긴 기획서를 실행 가능한 vault로 분리하고, 바로 Next.js MVP를 시작할 수 있는 작업 순서를 만든다.

## Tasks

| ID | 제목 | 상태 | 우선순위 | 완료 기준 |
| --- | --- | --- | --- | --- |
| DOC-01 | 원본 기획서 vault 분리 | done | P0 | 레이어별 노트와 인덱스 생성 |
| DOC-02 | MVP 실행 계획 작성 | done | P0 | 상세 plan 파일 생성 |
| SETUP-01 | Next.js 프로젝트 생성 | done | P0 | 앱 실행, 첫 화면 표시 |
| UI-01 | 모바일 shell과 홈 화면 | done | P0 | 홈 CTA와 하단 nav 구현 |
| UI-02 | 핵심 메뉴 화면 1차 구현 | done | P0 | 꿈쓰기/기록/백과/아침기분/로딩/결과 화면 라우팅 |
| ASSET-01 | 분리 에셋 제작 요청서 | done | P1 | 필요한 이미지 에셋과 생성 가이드 정리 |
| BE-01 | backend mock 도메인 모듈 분리 | done | P0 | seed, matcher, mock analyzer, 테스트 구현 |
| DATA-01 | 백과사전 seed 10개 구현 | doing | P0 | backend seed 구현 완료, 프론트 목록 렌더링 연결 대기 |
| AI-01 | mock 분석 API 구현 | done | P0 | `POST /api/dreams/analyze`가 mock analyzer 결과 JSON 반환 |
| FLOW-01 | 입력→결과→저장→기록 루프 | review | P0 | localStorage 루프 구현 완료, 브라우저 클릭 검증 대기 |
| SEED-01 | 자기 전 꿈 씨앗 화면 | review | P1 | `/seed` 화면, 저장 루프, 홈 진입점 구현 |
| ACCESS-01 | Guest/Free/Moon Pass 접근 정책 | todo | P0 | 하위 ACCESS-01A~01G 구현과 검증 완료 |
| ACCESS-01A | 접근 정책 helper | done | P0 | `access-policy` helper, dev plan simulation, 테스트 구현 |
| ACCESS-01B | 데일리 해몽 사용 기록 | todo | P0 | 05:00 기준 1일 1회 사용 기록 localStorage 구현 |
| ACCESS-01C | Guest 제출 제한 | todo | P0 | 비로그인 1일 1회 초과 시 API 호출 차단과 로그인 CTA 표시 |
| ACCESS-01D | 결과 로그인 CTA | todo | P1 | 꿈 영수증 이후 로그인 유도 CTA 표시, 기본 저장/공유 유지 |
| ACCESS-01E | 상세 해몽 관심 CTA | todo | P1 | Moon Pass 상세 해몽 관심 CTA와 준비 중 피드백 구현 |
| ACCESS-01F | 비즈니스 이벤트 로깅 | todo | P1 | `guest_daily_limit_hit`, `guest_login_cta_clicked`, `detailed_reading_interest_clicked` 저장 |
| ACCESS-01G | 접근 정책 검증 | todo | P0 | focused test, lint, build, backend test/typecheck 통과 |
| SEO-01 | 꿈해몽 백과 SEO 기반 | done | P0 | 상징 페이지 metadata, sitemap/robots, noindex 정책 구현 |

## ACCESS-01 Implementation Checklist

- [x] `frontend/src/lib/access-policy.ts`와 테스트 추가
- [x] dev override가 `guest/free_account/moon_pass`를 시뮬레이션하도록 구현
- [x] `admin`을 실제 `AccessPlan`에 추가하지 않도록 테스트
- [ ] `frontend/src/lib/daily-reading-usage.ts`와 테스트 추가
- [ ] `DreamEntryForm` 제출 전 Guest 1일 1회 gate 연결
- [ ] 분석 성공 후 기본 해몽 사용 기록 저장
- [ ] Guest 제한 도달 시 로그인 CTA 표시
- [ ] `DreamResultReceipt`에 로그인 CTA 추가
- [ ] `DreamResultReceipt`에 상세 꿈 해몽 관심 CTA 추가
- [ ] `frontend/src/lib/business-events.ts`와 테스트 추가
- [ ] 관심/제한/로그인 CTA 클릭 이벤트 연결
- [ ] Supabase Auth와 실제 결제는 이번 스프린트에서 제외
- [ ] `frontend` test/lint/build와 `backend` test/typecheck 검증

## Current Plan

- [[plans/2026-05-24-mvp-foundation|MVP Foundation Plan]]
- [[../../../docs/plans/2026-05-24-backend-mock-analysis|Backend Mock Analysis Plan]]
- [[../../../docs/plans/2026-05-26-access-monetization-foundation|Access Monetization Foundation Plan]]
- [[../../../docs/plans/2026-05-26-business-code-handoff|Business Code Handoff Plan]]
- [[../../../docs/plans/2026-05-26-seo-foundation|SEO Foundation Plan]]

## Notes

- 먼저 Prototype Mode로 시작한다.
- Supabase와 실제 LLM API는 UI 루프가 통과한 뒤 붙인다.
- 접근 정책은 Guest 1일 1회 체험, 로그인 무료 데일리, Moon Pass 상세 해몽의 3단 구조로 시작한다.
- ACCESS-01은 Prototype Mode 기준으로 localStorage 정책과 CTA/이벤트만 구현하고, 실제 Auth/Payment는 검증 이후로 미룬다.
- 테스트용 admin 경험은 별도 플랜이 아니라 dev override로 구현한다. localStorage에서 `guest/free_account/moon_pass`를 시뮬레이션하되 production에서는 무시한다.
- SEO는 블로그보다 백과 상징 페이지를 먼저 공개 검색 자산으로 만든다.
- 참고 이미지는 `ref/` 폴더에 있다.

## Evidence

- SEED-01: `/seed` 화면과 `manyang:dream-seed` localStorage 저장 구현. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과. 모바일 브라우저에서 홈 진입, 선택 상태, 100자 제한, 저장, reload persistence, Today nav active 상태 확인.
- ACCESS-01A: `frontend/src/lib/access-policy.ts`와 테스트 추가. 실제 `AccessPlan`은 `guest/free_account/moon_pass`만 유지하고, dev override로 세 플랜 시뮬레이션과 daily limit bypass를 지원. `admin` 값은 무시하도록 테스트. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- SEO-01: 백과 상세 페이지를 seed 기반 SSG로 전환. `/encyclopedia/[slug]` metadata/canonical/Open Graph, `/sitemap.xml`, `/robots.txt`, app flow noindex 구현. `frontend`의 focused test, `npm test`, `npm run lint`, `npm run build`, `backend`의 `npm test`, `npm run typecheck` 통과. `http://127.0.0.1:3000/encyclopedia/cat`, `/sitemap.xml`, `/robots.txt` 응답 확인.

- SETUP-01: `frontend/` 생성 완료, `npm run lint` 통과, `npm run build` 통과.
- UI-01: `frontend/src/app/page.tsx` 기본 Next 화면을 마냥 홈 셸로 교체, `http://127.0.0.1:3000` 브라우저 스냅샷에서 제목/CTA/하단 내비게이션 확인. Screenshot: `manyang-home-mobile.png`.
- UI-02: `frontend/src/app/write`, `/archive`, `/encyclopedia`, `/morning`, `/loading`, `/result` 1차 화면 구현. Mobile screenshots: `manyang-today-v4.png`, `manyang-write-mobile-v4.png`, `manyang-archive-mobile-v4.png`, `manyang-encyclopedia-mobile-v4.png`.
- ASSET-01: [[../../08-Design/Asset-Generation-Brief|Asset Generation Brief]] 작성.
- BE-01: `backend/` TypeScript 도메인 모듈 생성. `encyclopediaEntries`, `findMatchingSymbols`, `analyzeDream` 구현. `npm test`, `npm run typecheck` 통과.
- AI-01: `frontend/src/app/api/dreams/analyze/route.ts` 생성. `@manyang/backend` 로컬 패키지를 Next route handler에서 호출. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- FLOW-01: `DreamEntryForm`, `DreamResultReceipt`, `DreamArchiveList`, `dream-storage` 추가. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과. Browser MCP가 다른 세션 프로필을 사용 중이라 클릭 검증은 대기.
- Verification: `npm test`, `npm run lint`, `npm run build` 통과.
- Dev server: `http://127.0.0.1:3000` 응답 확인.
