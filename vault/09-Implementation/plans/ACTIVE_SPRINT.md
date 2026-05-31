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
| NIGHT-01 | 자기 전 밤의 기록 화면 | review | P1 | `/night` 화면, 저장 루프, 홈 진입점 구현. `/seed`는 호환 리다이렉트 |
| ACCESS-01 | Guest/Free/Moon Pass 접근 정책 | todo | P0 | 하위 ACCESS-01A~01G 구현과 검증 완료 |
| ACCESS-01A | 접근 정책 helper | done | P0 | `access-policy` helper, dev plan simulation, 테스트 구현 |
| ACCESS-01B | 데일리 해몽 사용 기록 | todo | P0 | 05:00 기준 1일 1회 사용 기록 localStorage 구현 |
| ACCESS-01C | Guest 제출 제한 | todo | P0 | 비로그인 1일 1회 초과 시 API 호출 차단과 로그인 CTA 표시 |
| ACCESS-01D | 결과 로그인 CTA | todo | P1 | 꿈 영수증 이후 로그인 유도 CTA 표시, 기본 저장/공유 유지 |
| ACCESS-01E | 상세 해몽 관심 CTA | todo | P1 | Moon Pass 상세 해몽 관심 CTA와 준비 중 피드백 구현 |
| ACCESS-01F | 비즈니스 이벤트 로깅 | todo | P1 | `guest_daily_limit_hit`, `guest_login_cta_clicked`, `detailed_reading_interest_clicked` 저장 |
| ACCESS-01G | 접근 정책 검증 | todo | P0 | focused test, lint, build, backend test/typecheck 통과 |
| SEO-01 | 꿈해몽 백과 SEO 기반 | done | P0 | 상징 페이지 metadata, sitemap/robots, noindex 정책 구현 |
| SEO-02 | 배포 도메인 SEO 고정 | done | P0 | `NEXT_PUBLIC_SITE_URL=https://manyang.vercel.app` 적용, sitemap/robots/canonical 운영 URL 검증 |
| AI-RAG-01 | 해몽 결과 계약 고정 | done | P0 | [[Dream-Reading-Contracts]]에 1차 분석, RAG 결과, 2차 해몽 JSON 필드와 금지 claim 기준 확정 |
| AI-RAG-02 | 다국어 상징 백과 스키마 확정 | done | P0 | [[Symbol-Encyclopedia-Schema]]에 `id`, locale, aliases, sceneModifiers, avoidExpressions, searchText 구조 확정 |
| AI-RAG-03 | pilot 상징 10개 작성 | done | P0 | `vault/05-Content/symbols/*.yaml`에 pilot 10개 작성 |
| AI-RAG-04 | retrieval scoring 계약 작성 | done | P0 | [[Retrieval-Scoring-Contract]]에 exact/alias/vector/meta/rerank confidence 계산 기준 문서화 |
| AI-RAG-05 | golden test set 작성 | done | P0 | [[Dream-Reading-Golden-Test-Set]]에 한국어/영어/애매한 꿈/민감 꿈/전통 해몽 강한 꿈 테스트 케이스 작성 |
| AI-RAG-06 | 구현 handoff plan 작성 | done | P1 | [[../../../docs/plans/2026-05-26-ai-rag-implementation-handoff|AI RAG Implementation Handoff Plan]] 작성 |
| AI-RAG-07 | backend 런타임 백과/RAG 구현 | done | P0 | symbol contracts, runtime data, retrieval scoring, runtime matcher, structured analysis mock 구현 |
| AI-RAG-08 | 해몽 golden 테스트 자동화 | done | P0 | `backend/tests/dream-reading-golden.test.ts`와 public API 테스트 통과 |
| AI-RAG-09 | pgvector 전환 계획 분리 | done | P1 | [[../../../docs/plans/2026-05-26-ai-rag-db-pgvector-later|AI RAG DB pgvector Later Implementation Plan]] 작성 |
| AI-RAG-10 | 백과사전 v0.2 taxonomy migration | done | P0 | 기존 10개 symbol에 `subcategory`, `facets`, `symbolRole`, `interpretationLenses`, `embeddingProfile` 적용 |
| AI-RAG-11 | 백과사전 curated symbol 20개 추가 | done | P0 | backend runtime seed 30개, vault YAML 30개, focused tests 통과 |
| AI-RAG-12 | 실서비스형 LLM provider 구조 | done | P0 | mock/real env switch, OpenAI Responses provider, RAG-grounded prompt, provider fallback 구현 |
| AI-RAG-13 | 품질 유지형 RAG 안정화 최적화 | done | P0 | 해석 품질을 줄이지 않고 벡터 인덱스 캐시, 영수증 UI 보호, timeout/fallback 기준 정리 |

| AI-RAG-14 | 해몽 엔진 하드닝 Phase 1 | done | P0 | API 입력 검증, sanitized request, malformed/oversized/invalid enum 400 처리, 테스트 통과 |
| AI-RAG-15 | 해몽 엔진 하드닝 Phase 2A | done | P0 | 백과사전 runtime/YAML을 30개에서 50개로 확장하고 family, relationship, body, transport, work, money, communication, death/loss 항목 20개 추가 |
| AI-RAG-16 | 해몽 엔진 하드닝 Phase 2B | done | P0 | 백과사전 runtime/YAML을 50개에서 70개로 확장하고 route, action, body cue, public scene, nature 항목 20개 추가 |
| AI-RAG-17 | 해몽 엔진 하드닝 Phase 3 | done | P0 | structured-dream-analysis의 데모 if 체인을 백과 alias/modifier 기반 추출기로 교체하고 scene-only 후보 보존 |
| AI-RAG-18 | 해몽 엔진 하드닝 Phase 4 | done | P0 | RAG 검색 결과를 confirmed/candidate evidence로 분리하고 신규 semantic/vector 상징 도입 기준과 prompt/evidence gate 경계를 구현 |
| AI-RAG-19 | 해몽 엔진 하드닝 Phase 5 | done | P0 | 안전 정책 매칭을 substring에서 토큰/구문 경계 기반으로 바꿔 한국어/영어 오탐을 줄이고 고위험 문맥은 유지 |
| AI-RAG-20 | 해몽 엔진 하드닝 Phase 6 | done | P0 | 16개 live quality eval 케이스와 before/after Markdown/JSON 리포트, 품질 메트릭, timeout fallback 기록 구현 |
| AI-RAG-21 | 해몽 엔진 랭킹/폴백 안정화 | done | P0 | confidence 1.0 포화 완화, alias 충돌 회귀 테스트, `chased` alias 정리, deterministic fallback 영어/한국어 조사 품질 개선 |
| AI-RAG-22 | RAG 신규 상징 recall 완화 | done | P0 | explicit 상징이 있어도 강한 semantic/vector 신규 상징을 candidate로 노출하고, 비민감 symbol의 semantic+vector agreement만 confirmed로 승격 |
| AI-RAG-23 | UTF-8 한국어 실입력 회귀 검증 | done | P0 | 정상 한글 입력의 matcher/structure/mock 분석 회귀 테스트 추가, PowerShell stdin 인코딩 오탐과 실제 코드 경로를 분리 확인 |
| AI-RAG-24 | RAG live quality eval 보강 | done | P0 | candidate-only 상징 누수, semantic+vector promotion, sensitive auto-promotion guard를 live eval 케이스와 metrics로 고정 |

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
- [x] 기존 pilot 10개를 v0.2 taxonomy로 migration한다: `category`, `subcategory`, `facets`, `symbolRole`, `interpretationLenses`, `embeddingProfile`.
- [x] 2차 curated symbol 20개를 추가해 runtime seed와 vault 원본을 30개로 확장한다: `home`, `room`, `window`, `key`, `stairs`, `elevator`, `mirror`, `bag`, `shoes`, `lost_item`, `running`, `fire`, `rain`, `sea`, `hospital`, `stranger`, `child`, `dog`, `bird`, `fish`.
- [x] Phase 2A coverage symbol 20개를 추가해 runtime seed와 vault YAML 원본을 50개로 확장한다: `mother`, `father`, `friend`, `partner`, `ex_partner`, `death`, `funeral`, `baby`, `pregnancy`, `toilet`, `bathroom`, `car`, `bus`, `train`, `airplane`, `workplace`, `money`, `phone`, `teeth`, `hair`.
- [x] Phase 2B coverage symbol 20개를 추가해 runtime seed와 vault YAML 원본을 70개로 확장한다: `road`, `bridge`, `bed`, `kitchen`, `food`, `clothes`, `body`, `blood`, `crying`, `falling`, `flying`, `swimming`, `fighting`, `being_chased`, `exam`, `wedding`, `crowd`, `mountain`, `tree`, `flower`.
- [x] `structured-dream-analysis`의 하드코딩된 데모 if 체인을 runtime encyclopedia의 label, alias, scene modifier trigger 기반 추출기로 교체한다.
- [x] RAG 검색 결과를 `confirmedEvidence`와 `candidateEvidence`로 분리하고, candidate evidence는 prompt 문맥과 scene-only 경계로만 전달한다.
- [x] `dream-safety-policy`의 안전어 매칭을 토큰/구문 경계 기반으로 바꿔 `커피/피곤/피아노/암호/돈까스` 같은 substring 오탐을 줄인다.
- [x] 15~20개 고정 live eval 케이스와 before/after 품질 리포트 생성기를 구현한다.
- [x] confidence 포화를 줄이고 alias 충돌을 테스트로 감시하며 fallback 문장의 locale/조사 품질을 보강한다.
- [x] explicit match가 있는 꿈에서도 RAG 신규 상징을 candidate lane으로 살리고, 비민감 semantic+vector agreement만 confirmed evidence로 승격한다.
- [x] 정상 UTF-8 한국어 입력이 runtime matcher, structure analysis, deterministic analysis에서 실제 상징으로 잡히는지 회귀 테스트로 고정한다.
- [x] RAG candidate/promotion 정책을 live quality eval 케이스와 forbiddenSymbols metric으로 검증한다.
- [x] 실서비스형 LLM 연결 구조를 추가한다: `DreamReadingLlmProvider`, OpenAI Responses API provider, RAG-grounded prompt builder, `analyzeDreamWithLlm`, route-level `MANYANG_ANALYSIS_MODE=llm` switch.

## AI/RAG Stabilization Optimization Checklist

- [x] RAG 벡터 인덱스를 `locale + indexPath` 기준으로 메모리 캐시해 요청마다 JSON index를 다시 읽지 않게 한다.
- [x] 캐시 적용 전/후 index load latency를 같은 index 파일로 기록한다: uncached 72~89ms, cached second load 0ms.
- [x] 해석 품질을 떨어뜨릴 수 있는 모델 다운그레이드, 과한 답변 길이 축소, RAG 근거 과소 제공은 이번 작업 범위에서 제외한다.
- [x] 영수증 UI overflow는 해석 내용을 줄이는 방식보다 표시 영역 보호, 접힘/확장, 섹션별 최대 높이 기준으로 검토한다.
- [x] LLM timeout/fallback은 실패 대응 안정화로 분리해, 실패 시 사용자에게 빈 결과가 아니라 deterministic 기본 해석 또는 재시도 안내를 제공하는 기준을 정한다.

## Current Plan

- [[plans/2026-05-24-mvp-foundation|MVP Foundation Plan]]
- [[../../../docs/plans/2026-05-24-backend-mock-analysis|Backend Mock Analysis Plan]]
- [[../../../docs/plans/2026-05-26-access-monetization-foundation|Access Monetization Foundation Plan]]
- [[../../../docs/plans/2026-05-26-business-code-handoff|Business Code Handoff Plan]]
- [[../../../docs/plans/2026-05-26-seo-foundation|SEO Foundation Plan]]
- [[../../../docs/plans/2026-05-26-ai-rag-implementation-handoff|AI RAG Implementation Handoff Plan]]
- [[../../../docs/plans/2026-05-26-ai-rag-db-pgvector-later|AI RAG DB pgvector Later Implementation Plan]]
- [[../../../docs/plans/2026-05-28-frontend-optimization|Frontend Optimization Implementation Plan]]
- [[../../../docs/plans/2026-05-29-dream-reading-engine-hardening|Dream Reading Engine Hardening Implementation Plan]]
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
- AI/RAG 최적화는 해석 품질을 낮추는 방향이 아니라, 결과 내용은 유지하고 index load, UI overflow, timeout 같은 안정성 병목부터 줄인다.
- 참고 이미지는 `ref/` 폴더에 있다.

## Evidence

- AI-RAG-14: `docs/plans/2026-05-29-dream-reading-engine-hardening.md`에 API validation, KB 확장, structure analysis refactor, RAG evidence policy, safety matching, live quality eval 순서의 6-phase 계획을 작성. Phase 1로 `frontend/src/app/api/dreams/analyze/route.ts`에 수동 validator를 추가해 malformed JSON, non-object body, empty/oversized `dreamText`, invalid `locale`, invalid `catReaderType`, invalid `dreamDate`, oversized optional string을 400으로 차단하고 sanitized request만 backend analyzer에 전달한다. `frontend` focused route test, 전체 test, build와 `backend` typecheck/test 통과.
- AI-RAG-15: Dream reading engine hardening Phase 2A로 `backend/src/data/symbol-encyclopedia.ts`와 `vault/05-Content/symbols/*.yaml`에 20개 coverage symbol을 추가해 전체 백과를 50개로 확장. `backend/tests/symbol-encyclopedia-data.test.ts`는 50개 accepted ID와 Phase 2A category/sensitive coverage를 검증하도록 업데이트. 새 YAML 20개는 PyYAML로 파싱 확인. `backend` focused tests, 전체 test, typecheck 통과.
- AI-RAG-16: Dream reading engine hardening Phase 2B로 `backend/src/data/symbol-encyclopedia.ts`와 `vault/05-Content/symbols/*.yaml`에 20개 coverage symbol을 추가해 전체 백과를 70개로 확장. `backend/tests/symbol-encyclopedia-data.test.ts`는 70개 accepted ID와 Phase 2B category/sensitive coverage를 검증하고, `backend/tests/runtime-symbol-matcher.test.ts`는 길/다리/쫓김/피 매칭을 검증한다. `blood`가 검증 상징으로 승격되면서 `evidence-gate`는 semantic chunk의 넓은 matched text가 `cancer` 같은 미등록 안전 단어를 검증 근거로 승격하지 못하도록 좁혔다. 새 YAML 20개는 PyYAML로 파싱 확인. `backend` focused tests, 전체 test, typecheck와 `frontend` build 통과. `frontend test`는 기존 버튼 이미지 크기 fixture 불일치로 실패.
- AI-RAG-17: Dream reading engine hardening Phase 3로 `backend/src/services/structured-dream-analysis.ts`의 하드코딩된 데모 if 체인을 제거하고 runtime encyclopedia의 localized label, alias, `sceneModifiers.triggerTerms` 기반 구조 추출기로 교체. 기존 snake/owned-land, school/door/corridor golden 동작은 `largeSnake`, `manySnakes`, `ownedLand`, `changingDoor` 호환 query label로 유지했다. Phase 2A/2B symbol인 `car`, `bridge`, `being_chased`, `blood`가 구조 분석에서 추출되는 테스트와 English alias/modifier 테스트, 미등록 noun-like detail을 낮은 confidence scene-only 후보로 남기는 테스트를 추가했다. `bridge` 영어 modifier에는 `across` trigger를 보강하고 YAML 원본도 동기화했다. `backend` 전체 test/typecheck, `frontend` analyze route focused test, `frontend` build 통과.
- AI-RAG-18: Dream reading engine hardening Phase 4로 `backend/src/services/dream-rag-retriever.ts`에 `retrieveDreamEvidenceSet`을 추가해 RAG 검색 결과를 `confirmedEvidence`와 `candidateEvidence`로 분리했다. 확정 evidence는 explicit alias/label 및 그 explicit symbol을 보강하는 chunk/vector만 포함하고, 신규 semantic/vector symbol은 candidate로만 유지한다. Semantic 후보는 의미 있는 matched term 2개 이상이 있을 때만 도입하고 `감정/마음/장면/어려운/blurry` 같은 넓은 단어는 후보 근거에서 제외한다. Vector-only 후보는 configurable threshold를 넘겨도 확정하지 않는다. `evidence-gate`와 `dream-reading-prompt`는 candidate evidence를 scene-only/context-only로 전달해 LLM이 미확정 상징을 `symbolReadings`에 넣지 못하게 했다. `backend` focused RAG/evidence/prompt/LLM tests, 전체 test, typecheck 통과.
- AI-RAG-19: Dream reading engine hardening Phase 5로 `backend/src/services/dream-safety-policy.ts`의 raw substring matching을 boundary-aware matcher로 교체했다. 한국어는 조사/어미가 붙은 `피가`, `암을`, `돈이`, `큰 병이나`, `죽고 싶었어`를 계속 잡되 `커피`, `피곤`, `피아노`, `암막`, `암호`, `돈까스`, `돈독한` 같은 일반 단어 내부 substring은 safety risk로 보지 않는다. 영어는 word/phrase boundary를 적용해 `diet`, `birthday`, `skilled`, `rich-looking` 같은 오탐을 줄이고 `blood`, `cancer`, `pregnancy dream`, `lottery`, `death`, `don't want to live`는 유지한다. `backend` focused safety/evidence/prompt/LLM tests, 전체 test, typecheck와 `frontend` analyze route focused test, build 통과.
- AI-RAG-20: Dream reading engine hardening Phase 6로 `backend/src/services/dream-reading-quality-eval.ts`를 추가해 16개 고정 live eval 케이스를 관리한다. 품질 축은 구체성, 안전성, 페르소나 차이, RAG 근거, timeout fallback이며, 각 케이스는 expectedDetails/expectedSymbols/safety expectation/persona compare group을 가진다. `runDreamReadingQualityEval`은 before/after 결과를 비교해 detail hit rate, expected symbol hit rate, forbidden claim, safety notice, provider errors, latency, fallback count, timeout fallback count를 JSON으로 만들고 `createDreamReadingQualityMarkdown`은 사람이 읽는 리포트를 생성한다. `backend` package script `quality:live`를 추가해 `npm --prefix backend run quality:live -- <caseId>`로 선택 실행 가능하다. Live smoke로 `ko_school_corridor_black` 1건을 실행해 `output/eval/live-dream-quality-2026-05-29T15-43-17-581Z.json`과 `.md`를 생성했고, fallback 없이 detail/symbol hit rate 1.0을 확인했다. `backend` focused quality/package tests, 전체 test, typecheck와 `frontend` analyze route focused test, build 통과.
- AI-RAG-21: Review feedback 우선순위 중 confidence 포화, alias 충돌, deterministic fallback 품질을 먼저 처리했다. `scoreRetrievalCandidate`는 exact/alias confidence가 1.0으로 포화되지 않도록 scene modifier 유무에 따라 상한을 분산하고, `running`의 broad alias `chased`는 제거해 `being_chased`와의 충돌을 줄였다. 백과 데이터 테스트에는 고위험 alias collision guard를 추가했고, deterministic fallback은 영어 꿈에서 영어 문장을 반환하며 한국어 fallback은 `엘리베이터는`, `바다는`처럼 받침 기반 조사를 사용한다. `backend` 전체 test/typecheck, `frontend` analyze route focused test, `frontend` build 통과.
- AI-RAG-22: RAG recall 완화 단계로 `backend/src/services/dream-rag-retriever.ts`의 explicit-match 종속을 줄였다. 이제 explicit symbol이 있어도 강한 신규 semantic/vector symbol은 candidate evidence로 전달되며, chunk-only/vector-only 후보는 계속 scene-only/context-only로 유지된다. 다만 비민감 symbol이 semantic chunk와 vector search에서 동시에 강하게 잡히면 `promoted by semantic/vector agreement`로 confirmed evidence에 승격된다. Sensitive symbol은 hybrid agreement가 있어도 자동 승격하지 않는다. 영어 semantic token matching은 짧은 stopword와 과한 substring 포함을 줄여 `care/recovery/waiting` 같은 장면에서 `Hospital`이 broad `Baby/Child`보다 앞서도록 조정했다. `backend` 전체 test/typecheck와 `frontend` analyze route focused test 통과.
- AI-RAG-23: 정상 UTF-8 한국어 입력이 실제 코드 경로에서 매칭되는지 확인했다. `runtime-symbol-matcher`, `structured-dream-analysis`, `mock-analysis` 테스트에 `내 땅에 큰 구렁이와 뱀이 수십 마리 나왔어`, `엘리베이터에 갇혔고 바다를 봤어` 케이스를 추가해 `snake/owned_land/many`, `elevator/sea`가 잡히는 것을 고정했다. 별도 Unicode escape 스모크에서도 같은 결과를 확인했다. 이전 `tsx -` 수동 스모크의 `[]` 결과는 PowerShell stdin이 한글을 `????`로 깨뜨린 입력 경로 문제로 판단했다. `backend` 전체 test/typecheck와 `frontend` analyze route focused test 통과.
- AI-RAG-24: live quality eval에 RAG candidate boundary와 promotion 기준을 추가했다. `en_rag_candidate_snake_hospital`은 명시된 `Snake`가 잡히면서 semantic candidate인 `Hospital`이 confirmed/symbolReading으로 새지 않는지 검증하고, `en_rag_promotion_train_path`는 semantic chunk와 vector search가 함께 잡은 비민감 `Train`이 confirmed evidence로 승격되는지 검증한다. `en_rag_sensitive_vector_guard`는 민감 상징 자동 승격 방지 케이스로 유지했다. `RagGroundingMetrics`에는 `forbiddenSymbols/forbiddenSymbolHits`를 추가했고, Markdown report도 forbidden symbol hit를 표시한다. `backend` focused quality/RAG/LLM tests, 전체 test, typecheck와 `frontend` analyze route focused test 통과.

- NIGHT-01: `/night` 화면과 `manyang:night-checkin` 저장 구현. 기존 `/seed`는 `/night`로 리다이렉트. 홈 진입, 선택 상태, 100자 제한, 로그인 사용자 저장, 기록 달력, 결과 영수증의 어젯밤 기록 맥락 연결을 확인한다.
- ACCESS-01A: `frontend/src/lib/access-policy.ts`와 테스트 추가. 실제 `AccessPlan`은 `guest/free_account/moon_pass`만 유지하고, dev override로 세 플랜 시뮬레이션과 daily limit bypass를 지원. `admin` 값은 무시하도록 테스트. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- SEO-01: 백과 상세 페이지를 seed 기반 SSG로 전환. `/encyclopedia/[slug]` metadata/canonical/Open Graph, `/sitemap.xml`, `/robots.txt`, app flow noindex 구현. `frontend`의 focused test, `npm test`, `npm run lint`, `npm run build`, `backend`의 `npm test`, `npm run typecheck` 통과. `http://127.0.0.1:3000/encyclopedia/cat`, `/sitemap.xml`, `/robots.txt` 응답 확인.
- SEO-02: Vercel 환경변수 `NEXT_PUBLIC_SITE_URL=https://manyang.vercel.app` 적용 후 redeploy 완료. 운영 URL에서 `https://manyang.vercel.app/robots.txt`가 canonical sitemap을 가리키고, `https://manyang.vercel.app/sitemap.xml`에 38개 URL이 포함되며 Vercel 임시 deployment 도메인이 제거된 것을 확인. `https://manyang.vercel.app/encyclopedia/cat`은 200 응답, canonical `https://manyang.vercel.app/encyclopedia/cat`, `noindex=false` 확인.
- AI-RAG-07~09: backend에 `symbol-encyclopedia` runtime types/data, retrieval scoring, runtime symbol matcher, structured analysis mock, enriched `analyzeDream` response, golden tests, public exports 추가. pgvector 전환 계획은 `docs/plans/2026-05-26-ai-rag-db-pgvector-later.md`로 분리. `backend`의 `npm test`, `npm run typecheck` 통과.
- AI-RAG-10: 기존 10개 YAML과 backend runtime seed를 v0.2 taxonomy로 migration. 대분류는 `category`, 세부 분류는 `subcategory`, vector/rerank용 의미 태그는 `facets`, 중심/보조 역할은 `symbolRole`, 동서양/보편 해석 축은 `interpretationLenses`로 분리. `backend`의 focused test, `npm test`, `npm run typecheck` 통과.
- AI-RAG-11: 2차 curated symbol 20개를 backend runtime seed와 `vault/05-Content/symbols/*.yaml` 원본에 추가해 전체 30개로 확장. 새 everyday/object/action/nature/relationship/living_being symbol은 v0.2 taxonomy(`subcategory`, `facets`, `symbolRole`, `interpretationLenses`, `embeddingProfile`)를 따른다. `backend`의 `npm run typecheck`, `npm test`, `frontend`의 analyze route focused test, `npm run build` 통과.
- AI-RAG-12: `backend/src/services/llm-provider.ts`, `dream-reading-prompt.ts`, `llm-dream-analysis.ts`, `openai-responses-provider.ts`를 추가해 실서비스형 LLM 연결 구조를 분리. 기본값은 mock이고, `MANYANG_ANALYSIS_MODE=llm`과 서버 `OPENAI_API_KEY`가 있을 때만 real provider를 사용한다. Provider 실패 또는 invalid JSON은 deterministic analyzer로 fallback한다. `frontend/.env.example`에 서버 환경 변수 예시를 추가했다. 실제 `frontend/.env`로 OpenAI live smoke test를 실행해 provider structured JSON 호출과 `analyzeDreamWithLlm` full dream reading 병합이 통과했다. 기본 `backend npm test`에서는 live smoke가 skip된다. `backend`의 focused test, `npm run typecheck`, `npm test`, `frontend`의 analyze route focused test 통과. `frontend npm run build`는 기존 `encyclopedia-page-client.tsx`의 `selectedCatReaderId` prop 타입 불일치로 실패.
- AI-RAG-13: `loadCachedDreamVectorIndex`로 RAG vector JSON index를 path 기준 메모리 캐시. index load 벤치마크는 uncached 72~89ms, cached second load 0ms. 긴 LLM 해석이 영수증을 과도하게 늘리지 않도록 해석/고양이 메모/작은 처방 섹션에 최대 높이, 내부 스크롤, 긴 해석 전체 보기/접기 컨트롤을 추가. LLM provider timeout 기본값은 25초로 두고 `MANYANG_LLM_TIMEOUT_MS`로 1~60초 범위에서 조정 가능하게 했다. 품질 실험 후 local real LLM 환경은 `MANYANG_LLM_TIMEOUT_MS=45000`으로 올리고, 예시 env도 같은 값으로 맞췄다. timeout 또는 provider 실패 시 빈 결과가 아니라 deterministic 기본 해석과 safety notice를 반환한다. OpenAI fetch에는 `AbortSignal`을 전달한다. 실제 결과 검토에서 발견한 회색냥 reader note placeholder를 제거하고, safety notice가 영수증에 보이도록 UI와 테스트를 추가했다. `backend`의 typecheck/test, `frontend`의 focused receipt test, 전체 test, build 통과. `/result` 로컬 dev 서버 200 응답 확인.

- SETUP-01: `frontend/` 생성 완료, `npm run lint` 통과, `npm run build` 통과.
- UI-01: `frontend/src/app/page.tsx` 기본 Next 화면을 마냥 홈 셸로 교체, `http://127.0.0.1:3000` 브라우저 스냅샷에서 제목/CTA/하단 내비게이션 확인. Screenshot: `manyang-home-mobile.png`.
- UI-02: `frontend/src/app/write`, `/archive`, `/encyclopedia`, `/morning`, `/loading`, `/result` 1차 화면 구현. Mobile screenshots: `manyang-today-v4.png`, `manyang-write-mobile-v4.png`, `manyang-archive-mobile-v4.png`, `manyang-encyclopedia-mobile-v4.png`.
- ASSET-01: [[../../08-Design/Asset-Generation-Brief|Asset Generation Brief]] 작성.
- BE-01: `backend/` TypeScript 도메인 모듈 생성. `encyclopediaEntries`, `findMatchingSymbols`, `analyzeDream` 구현. `npm test`, `npm run typecheck` 통과.
- AI-01: `frontend/src/app/api/dreams/analyze/route.ts` 생성. `@manyang/backend` 로컬 패키지를 Next route handler에서 호출. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- FLOW-01: `DreamEntryForm`, `DreamResultReceipt`, `DreamArchiveList`, `dream-storage` 추가. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과. Browser MCP가 다른 세션 프로필을 사용 중이라 클릭 검증은 대기.
- Verification: `npm test`, `npm run lint`, `npm run build` 통과.
- Dev server: `http://127.0.0.1:3000` 응답 확인.
