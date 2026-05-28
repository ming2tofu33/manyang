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

현재 추가 준비 목표는 **실제 LLM/RAG 구현 전에 백과사전 데이터 구조, 검색 계약, 품질 검증 기준을 먼저 고정하는 것**이다.

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
| AI-RAG-01 | 해몽 결과 계약 고정 | done | P0 | [[Dream-Reading-Contracts]]에 1차 분석, RAG 결과, 2차 해몽 JSON 필드와 금지 claim 기준 확정 |
| AI-RAG-02 | 다국어 상징 백과 스키마 확정 | done | P0 | [[Symbol-Encyclopedia-Schema]]에 `id`, locale, aliases, sceneModifiers, avoidExpressions, searchText 구조 확정 |
| AI-RAG-03 | pilot 상징 10개 작성 | done | P0 | `vault/05-Content/symbols/*.yaml`에 pilot 10개 작성 |
| AI-RAG-04 | retrieval scoring 계약 작성 | done | P0 | [[Retrieval-Scoring-Contract]]에 exact/alias/vector/meta/rerank confidence 계산 기준 문서화 |
| AI-RAG-05 | golden test set 작성 | done | P0 | [[Dream-Reading-Golden-Test-Set]]에 한국어/영어/애매한 꿈/민감 꿈/전통 해몽 강한 꿈 테스트 케이스 작성 |
| AI-RAG-06 | 구현 handoff plan 작성 | done | P1 | [[../../../docs/plans/2026-05-26-ai-rag-implementation-handoff|AI RAG Implementation Handoff Plan]] 작성 |
| AI-RAG-07 | backend 런타임 백과/RAG 구현 | done | P0 | symbol contracts, runtime data, retrieval scoring, runtime matcher, structured analysis mock 구현 |
| AI-RAG-08 | 해몽 golden 테스트 자동화 | done | P0 | `backend/tests/dream-reading-golden.test.ts`와 public API 테스트 통과 |
| AI-RAG-09 | pgvector 전환 계획 분리 | done | P1 | [[../../../docs/plans/2026-05-26-ai-rag-db-pgvector-later|AI RAG DB pgvector Later Implementation Plan]] 작성 |

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

## AI/RAG Encyclopedia Prep Checklist

- [x] [[Dream-Reading-Contracts]]에 1차/2차 LLM 출력 계약과 RAG payload를 최종 필드명으로 정리한다.
- [x] 금지 claim 기준을 계약 문서에 포함한다.
- [x] [[Symbol-Encyclopedia-Schema]] 기준으로 백과사전 원본 저장 형식을 `vault/05-Content/symbols/*.yaml`로 확정한다.
- [x] 상징 항목에 반드시 들어갈 필드를 확정한다: `id`, `category`, `safetyLevel`, `ko/en aliases`, `searchText`, `coreMeanings`, `sceneModifiers`, `metaphorHooks`, `cardTitleSeeds`, `smallPrescriptions`, `avoidExpressions`.
- [x] pilot 10개를 먼저 작성한다: `snake`, `owned_land`, `door`, `school`, `corridor`, `searching`, `many`, `dawn`, `water`, `cat`.
- [x] 각 pilot 항목은 단어 뜻풀이가 아니라 장면 modifier를 최소 3개 이상 가진다.
- [x] [[RAG-Strategy-for-Dream-Reading]]와 [[Retrieval-Scoring-Contract]] 기준으로 검색 결과 payload를 확정한다: `entryId`, `matchType`, `confidence`, `matchedText`, `usedFields`, `rankReason`.
- [x] vector DB는 바로 붙이지 않고, 먼저 alias/exact matcher와 future `searchText`를 vector-ready하게 만든다.
- [x] [[Dream-Reading-Quality-Safety]] 기준으로 금지 표현 목록과 retry 조건을 테스트 케이스로 바꾼다.
- [x] "큰 구렁이와 수십 마리의 뱀" 예시를 golden case로 등록해, 전통 해몽처럼 과도한 재물/태몽 예언으로 흐르지 않는지 검증한다.
- [x] 준비 완료 후 별도 구현 plan을 작성하고, 그때 코드 작업을 시작한다.

## AI/RAG Runtime Implementation Checklist

- [x] `backend/src/contracts/symbol-encyclopedia.ts`에 다국어 상징 백과 런타임 타입을 추가한다.
- [x] `backend/src/data/symbol-encyclopedia.ts`에 pilot 10개를 런타임 데이터로 추가한다.
- [x] `backend/src/services/retrieval-scoring.ts`에 deterministic confidence scoring을 구현한다.
- [x] `backend/src/services/symbol-matcher.ts`에 locale-aware runtime symbol search를 추가하고 기존 matcher는 유지한다.
- [x] `backend/src/services/structured-dream-analysis.ts`에 1차 분석 mock을 추가한다.
- [x] `backend/src/services/mock-analysis.ts`가 structured analysis와 runtime retrieval을 사용하도록 연결한다.
- [x] `backend/tests/dream-reading-golden.test.ts`로 전통 해몽 과잉 예언, 민감/의학 claim, 다국어 케이스를 고정한다.
- [x] `backend/src/index.ts`에서 runtime encyclopedia, retrieval, structured analysis API를 export한다.
- [x] pgvector/DB 전환은 post-MVP 계획으로 분리한다.

## Current Plan

- [[plans/2026-05-24-mvp-foundation|MVP Foundation Plan]]
- [[../../../docs/plans/2026-05-24-backend-mock-analysis|Backend Mock Analysis Plan]]
- [[../../../docs/plans/2026-05-26-access-monetization-foundation|Access Monetization Foundation Plan]]
- [[../../../docs/plans/2026-05-26-business-code-handoff|Business Code Handoff Plan]]
- [[../../../docs/plans/2026-05-26-seo-foundation|SEO Foundation Plan]]
- [[../../../docs/plans/2026-05-26-ai-rag-implementation-handoff|AI RAG Implementation Handoff Plan]]
- [[../../../docs/plans/2026-05-26-ai-rag-db-pgvector-later|AI RAG DB pgvector Later Implementation Plan]]
- [[../../../docs/plans/2026-05-28-frontend-optimization|Frontend Optimization Implementation Plan]]
- [[Frontend-Optimization-Guide|Frontend Optimization Guide]]
- [[Dream-Reading-Contracts|Dream Reading Contracts]]
- [[Dream-Reading-LLM-Logic|Dream Reading LLM Logic]]
- [[RAG-Strategy-for-Dream-Reading|RAG Strategy for Dream Reading]]
- [[Retrieval-Scoring-Contract|Retrieval Scoring Contract]]
- [[Multilingual-Symbol-Encyclopedia|Multilingual Symbol Encyclopedia]]
- [[Symbol-Encyclopedia-Schema|Symbol Encyclopedia Schema]]
- [[Dream-Reading-Quality-Safety|Dream Reading Quality and Safety]]
- [[Dream-Reading-Golden-Test-Set|Dream Reading Golden Test Set]]

## Notes

- 먼저 Prototype Mode로 시작한다.
- Supabase와 실제 LLM API는 UI 루프가 통과한 뒤 붙인다.
- 접근 정책은 Guest 1일 1회 체험, 로그인 무료 데일리, Moon Pass 상세 해몽의 3단 구조로 시작한다.
- ACCESS-01은 Prototype Mode 기준으로 localStorage 정책과 CTA/이벤트만 구현하고, 실제 Auth/Payment는 검증 이후로 미룬다.
- 테스트용 admin 경험은 별도 플랜이 아니라 dev override로 구현한다. localStorage에서 `guest/free_account/moon_pass`를 시뮬레이션하되 production에서는 무시한다.
- SEO는 블로그보다 백과 상징 페이지를 먼저 공개 검색 자산으로 만든다.
- AI/RAG는 코드 구현 전에 데이터 계약과 golden case를 먼저 고정한다. 벡터 DB는 MVP 첫 단계의 필수 의존성으로 두지 않는다.
- 참고 이미지는 `ref/` 폴더에 있다.

## Evidence

- SEED-01: `/seed` 화면과 `manyang:dream-seed` localStorage 저장 구현. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과. 모바일 브라우저에서 홈 진입, 선택 상태, 100자 제한, 저장, reload persistence, Today nav active 상태 확인.
- ACCESS-01A: `frontend/src/lib/access-policy.ts`와 테스트 추가. 실제 `AccessPlan`은 `guest/free_account/moon_pass`만 유지하고, dev override로 세 플랜 시뮬레이션과 daily limit bypass를 지원. `admin` 값은 무시하도록 테스트. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- SEO-01: 백과 상세 페이지를 seed 기반 SSG로 전환. `/encyclopedia/[slug]` metadata/canonical/Open Graph, `/sitemap.xml`, `/robots.txt`, app flow noindex 구현. `frontend`의 focused test, `npm test`, `npm run lint`, `npm run build`, `backend`의 `npm test`, `npm run typecheck` 통과. `http://127.0.0.1:3000/encyclopedia/cat`, `/sitemap.xml`, `/robots.txt` 응답 확인.
- AI-RAG-07~09: backend에 `symbol-encyclopedia` runtime types/data, retrieval scoring, runtime symbol matcher, structured analysis mock, enriched `analyzeDream` response, golden tests, public exports 추가. pgvector 전환 계획은 `docs/plans/2026-05-26-ai-rag-db-pgvector-later.md`로 분리. `backend`의 `npm test`, `npm run typecheck` 통과.

- SETUP-01: `frontend/` 생성 완료, `npm run lint` 통과, `npm run build` 통과.
- UI-01: `frontend/src/app/page.tsx` 기본 Next 화면을 마냥 홈 셸로 교체, `http://127.0.0.1:3000` 브라우저 스냅샷에서 제목/CTA/하단 내비게이션 확인. Screenshot: `manyang-home-mobile.png`.
- UI-02: `frontend/src/app/write`, `/archive`, `/encyclopedia`, `/morning`, `/loading`, `/result` 1차 화면 구현. Mobile screenshots: `manyang-today-v4.png`, `manyang-write-mobile-v4.png`, `manyang-archive-mobile-v4.png`, `manyang-encyclopedia-mobile-v4.png`.
- ASSET-01: [[../../08-Design/Asset-Generation-Brief|Asset Generation Brief]] 작성.
- BE-01: `backend/` TypeScript 도메인 모듈 생성. `encyclopediaEntries`, `findMatchingSymbols`, `analyzeDream` 구현. `npm test`, `npm run typecheck` 통과.
- AI-01: `frontend/src/app/api/dreams/analyze/route.ts` 생성. `@manyang/backend` 로컬 패키지를 Next route handler에서 호출. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- FLOW-01: `DreamEntryForm`, `DreamResultReceipt`, `DreamArchiveList`, `dream-storage` 추가. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과. Browser MCP가 다른 세션 프로필을 사용 중이라 클릭 검증은 대기.
- Verification: `npm test`, `npm run lint`, `npm run build` 통과.
- Dev server: `http://127.0.0.1:3000` 응답 확인.
