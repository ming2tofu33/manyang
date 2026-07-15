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

## Web/Mobile Shared Foundation (2026-07-15)

- [x] 루트 npm workspace 구성
- [x] `@manyang/contracts`와 꿈 transport 계약 생성
- [x] 백엔드와 웹의 꿈 transport 계약 공유
- [x] API reader/locale 검증 상수 통합
- [ ] Expo 클라이언트 시작 (이번 스프린트 범위 아님)

### Next Recommended Sprint

- 공통 타로 계약과 content/domain 분리

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
| THEME-01 | 고양이 해몽사 → 고양이 테마 전환 | done | P0 | `catReaderType`이 해몽 결과/문체/access를 바꾸지 않고 시각 테마로만 동작 |
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
| I18N-01 | EN front-door 기반 + 엔진 locale 연결 | done | P0 | locale 스토어/사전/훅, API에 locale 전송, EN 고양이 이름(Midnight/Luna/Sol/Ash), 프로필 언어 토글 구현 |
| I18N-02 | 나머지 UI 문구 EN 이관 | todo | P0 | 아래 I18N 체크리스트의 한국어 잔여 UI 문구를 ko/en 사전 기반으로 전환 |
| ENC-01 | 백과사전 작성 스타일 가이드·시장 조사 | done | P0 | `docs/dream-tarot-content-research.md`, `docs/dream-encyclopedia-style-guide.md` 작성 |
| ENC-02 | 미사용 필드 제거 | done | P0 | `interpretationLenses`/`cultureNotes`/`tensionAxis`를 contract·helper·121항목·test에서 제거, tsc·전체 테스트 통과 |
| ENC-03 | 어색한 표제어 라벨 감사 | done | P1 | 땅·여럿·변기·잃어버린 물건·알몸 + en Land 재명명, 골든/mock 테스트 갱신 |
| ENC-04 | 이중문화 원칙 확정(ko=동양/en=서양) | done | P0 | 스타일 가이드 §0-A + memory, locale=문화 분기, 번역본 금지 |
| ENC-05 | 1차 배치 8항목 재작성(B안+이중문화) | done | P0 | 땅·뱀·똥·돼지·물·치아·돈·쫓김 ko/en, sceneModifier 6개 확장, fortune 문화 분리 |
| ENC-06 | coverage_gap 신규 심볼 26개 추가 | done | P0 | 해/태양·하늘·안개·번개·사자·코끼리·늑대·토끼·여우·경찰·군인·도둑·선생님·할머니·절·교회·배·자전거·총·모자·안경·편지·컴퓨터·오줌·시체·키스 — coverage 72/72(0 gap), 총 147 심볼 |
| ENC-07 | 나머지 ~101개 전수 재작성 | todo | P0 | 전 항목 ko=동양/en=서양 + B안 정보화, 우회동사 제거, sceneModifier 5~7개, fortune 분리 |
| ENC-08 | vault YAML(05-Content/symbols) 동기화 | todo | P1 | 변경 항목 YAML 반영(라벨 변경 포함), PyYAML 파싱 확인 |
| RAG-IMP-01 | 검색 평가셋 + recall@k/precision 하니스 | done | P0 | `retrieval-eval.ts` 32케이스(ID 기반), `npm run eval:retrieval`, 회귀 테스트, baseline 저장 |
| RAG-IMP-02 | 벡터 경로 실서비스 활성화(하이브리드) | done | P0 | ko/en 인덱스(872청크, text-embedding-3-small) 빌드 → `output/rag/`, `.env` 활성, 하이브리드 eval로 lift 확인 |
| RAG-IMP-03 | 형태소 lemma를 matcher/structure에 연결 | done | P1 | 라이브 경로는 이미 lemma 공급(llm-dream-analysis), retriever가 매처로 전달. eval에도 연결. 단 lemma는 **lemma친화 alias가 있어야** 효과(아래 RAG-IMP-04와 조합) |
| RAG-IMP-04 | 트리거/searchText 동의어 확장 | done | P1 | eval 미스 4건(teeth·death·chased·en-teeth) 폐쇄: 과거형 구문 alias(이가 빠졌/도망쳤), 죽은/죽었, molar(s), KOREAN_SUFFIXES에 "와서" 추가. **micro/macro recall 1.0, precision@5 0.885, 전 태그 1.0** |
| RAG-IMP-05 | 재랭킹/임계값 튜닝 | doing | P1 | (완료: 벡터 explicit-동반 임계값 0.68→0.62 — en teeth 0.628 구제, precision 0.738 유지) 남은: exact 포화·일반어 라벨 과매치 |
| RAG-IMP-06 | 무매칭/저매칭 폴백 전략 | done | P2 | `dream-fallback-grounding.ts` 안전·보편 grounding 데이터 세트 + 리졸버. structured가 explicit 상징 0이면 `fallbackGrounding` 세팅(남은 감정/분위기 앵커), mock baseline·LLM 프롬프트가 그것에 기대 — 상징 날조 대신 "남은 느낌"을 읽음. evidence-gate 유지, 점/의료 금지. 7 신규 테스트 |
| RAG-IMP-07 | 타로 카드 데이터 테이블 분리 | todo | P2 | 78장 의미를 RAG 아닌 버전관리 lookup 데이터로 정리 |
| RAG-IMP-08 | coverage eval(심볼 충분도) | done | P0 | `coverage-eval.ts` 72개 흔한 상징 탐침, matching/coverage 갭 분리, `npm run eval:coverage`, 회귀 테스트 |
| RAG-IMP-09 | 하드코딩 정리 | done | P2 | 흩뿌린 if-체인을 데이터 표로: mock-analysis `SYMBOL_COMBO_OVERRIDES`(3함수 6블록→1표), structured `SYMBOL_EMOTION_SIGNALS`·`SCENE_QUERY_RULES`(trigger 선언형)·`AMBIGUOUS_SCENE_OVERRIDES`(searching 3곳 통합). 동작 보존(167 테스트·eval 불변), 새 조합=표에 한 줄 |
| TAROT-00 | 마이너 카드 누끼와 1장 뽑기 연결 | done | P0 | 원본 보존, 56장 배경 제거 산출물 생성, minor asset mapping, daily one-card minor 렌더 검증 |
| TAROT-DOC-01 | 타로 카드 해설 문서 커밋 준비 | review | P0 | `docs/tarot/`의 메이저/마이너 해설 문서를 커밋 가능한 기준 문서로 확정 |
| TAROT-01 | 타로 78장 카드 데이터 계약 통합 | review | P0 | 공통 `TarotCard`, 안정 `cardKey`, legacy major id 호환 테스트 구현 완료. 명시적 `deckMode`는 후속 |
| TAROT-02 | 오늘의 한 장 78장 확장 | done | P0 | daily one-card가 전체 78장 덱에서 뽑히고 기존 저장 결과가 계속 열림 |
| TAROT-03 | 질문별 한 장 리딩 MVP | review | P0 | 상태 선택 -> 질문 5개 -> 카드 결과 -> 저장/공유 진입점 구현. `question_one_card`, `tarot_question_one_card`, future `rewarded_ad` 계약 포함 |
| TAROT-04 | 카드 기록/회고 루프 | todo | P1 | 사용자가 뽑은 카드, 질문, 한 줄 회고를 기록에서 다시 확인 |
| TAROT-05 | 공유용 타로 결과 콘텐츠 | review | P1 | 질문/카드/짧은 메시지를 공유 가능한 결과물로 생성. 공유 이벤트 로깅은 후속 |
| ENC-09 | 미해결 matching 케이스 | todo | P1 | retrieval-eval 잔여 miss: 우수수→teeth(형태소), 도망쳤어→chased(패러프레이즈), molar→teeth, en chased 보강 |

## Encyclopedia Quality & RAG Sprint (2026-06-03)

### 배경

백과사전 한국어가 (1) 번역체·우회동사("비춘다")로 정보 전달이 약하고, (2) ko/en이 서로의 번역본이라 문화권 분리가 안 되어 있었다. 또한 미사용 필드(interpretationLenses 등)와 어색한 표제어가 남아 있었다.
별도로, RAG 관점 냉정 평가 결과 **기본 검색이 어휘(lexical) 매칭**이고 벡터 경로는 옵션으로만 존재(`embeddingProvider && vectorIndex` 주입 시에만 가동), 검색 품질 측정 지표가 없다는 것이 확인됐다. (형태소 분석기 Kiwi는 B-4로 배포됨, 단 LLM 경로 보강 위주.)

### 합의된 순서 (2026-06-03)

1. **RAG 우선** (콘텐츠 ENC-06~07보다 먼저). 구조적 한계(어휘 매칭 recall)부터 해결.
2. **측정부터** — RAG-IMP-01(평가셋 + recall@k/precision)을 가장 먼저. 측정 없이 튜닝하지 않는다.
3. 콘텐츠 ENC-07 전수 작업은 **카테고리 단위**(장소→사물→사람→행동→자연→감정)로, RAG가 안정된 뒤 진행.

### 원칙 (확정)

- **백과사전 = 정보 전달.** 화자 톤은 프롬프트에서 입힌다. 분위기 형용사 금지, "X 꿈은 ~라는 뜻이다" 사전식 직접 단언(B안).
- **locale = 문화권.** `locales.ko`=동양 전통(재물·태몽·길흉 점사), `locales.en`=서양 전통(융·신화·심리). 번역 금지.
- **안전 우선.** sensitive 상징은 avoidExpressions로 단정·예언 차단. 전통 길흉은 fortune에 "전통적으로 ~" 인용으로만.
- 참고: `docs/dream-encyclopedia-style-guide.md`, `docs/dream-tarot-content-research.md`.

### Phase A — 콘텐츠 (ENC)

- [x] ENC-01~05 완료 (가이드/조사, 필드 제거, 라벨 감사, 이중문화, 1차 8항목)
- [x] ENC-06 ✓ **완결**: coverage_gap 26개 신규 심볼을 처음부터 이중문화(ko=동양/en=서양)로 추가. nature(해/태양→sun·하늘·안개·번개) / animal(사자=King of Beasts·코끼리=Ganesha/memory·늑대=the shadow/pack·토끼=white rabbit·여우=Reynard) / person(경찰=superego·군인=the warrior·도둑=the shadow that takes·선생님=the Mentor·할머니=Wise Old Woman) / place(절=inner sanctum·교회=sanctuary) / object(배=Charon's vessel·자전거·총=decisive force·모자=persona·안경=lens·편지·컴퓨터) / body·event·action(오줌=release·시체=what has died·키스=awakening kiss). `eval:coverage` 72/72(gap 0, over_match 0), 총 147 심볼, retrieval micro 0.912 유지. 보석→gold alias·할머니→grandmother로 over_match 2건 해소.
- [x] ENC-07 ✓ **완결 (121/121)**: 기존 121개 전수를 ko=동양/en=서양 + B안으로 재작성. 전 카테고리(animal·nature·object·place·person·body·event·action·food·emotion·abstract) 완료. `npm run enc:status` = reviewed 121 / pending 0. action·food·emotion·abstract 막bat치: 음식=the feast·communion(재물 제거), 고기=the flesh·fatted calf(재물 제거), 술=Dionysian·in vino veritas, 날기=the soul's flight, 떨어짐=the Fall, 싸움=confronting the shadow(역몽 제거), 분노=the shadow's fire(역몽 제거), 울음=catharsis, 노래=the voice of the soul(길조 제거), 춤=Dionysian ecstasy(길조 제거), 군중=the collective/mob, 동굴/집=무의식·psyche. (running·lost_item·many = 보편 심리/구조 modifier라 en 이미 보편적)

  - **결함 스캔 기반 우선순위(2026-06-03)**: 카테고리 순서 대신 `grep`로 잔여 결함을 스캔해 우선 처리. en "In Korean tradition"/"conception dream" 누수 8건(불·비·물고기·용·호랑이·곰·고래·개구리)을 전부 서양(융·신화·변태)으로 교체, 누수 0 확인. ko safeReading "비추는 상징/장소/공간" 14건 → "담은 …"으로 일괄 정리(비추 safeReading 0건, 거울·별 metaphorHook의 올바른 "비추는"은 보존). lightReadings의 "인지동작+흐름/장면" 번역체(알아차리는 흐름/확인하는 장면 등) 23건을 직접 서술로 정리 → **번역체 0건**. 남은 "흐름/장면"(~37)은 "재산이 되는 흐름"·"어우러지는 흐름"처럼 자연스러운 관용 용법이라 보존(churn 방지).
- [ ] ENC-08: vault YAML 동기화 (또는 YAML을 backend seed에서 생성하는 단방향 소스 결정)

#### ENC-07 카테고리별 진행 (1차 8개 = 일부 완료, 총 121)

진행 순서는 분량/임팩트 고려해 정한다. 각 카테고리 완료 = 그 안 모든 항목 ko/en 재작성 + 테스트 통과.

- [x] **place** 18개 ✓ (18/18) — 동양 재물·음택 유지, en은 서양 상징으로: 집/방=the house as the psyche(융, 방=자아의 일부·지하실=무의식), 무덤=the past laid to rest·the buried(음택 재물 제거), 동굴=the unconscious·womb of rebirth·hero's descent&return, 변기=healthy letting-go·catharsis(재물 제거), 욕실=ritual cleansing·washing away guilt, 부엌=the hearth(Hestia)·cauldron·raw→cooked, 다리=the crossing between worlds·Styx, 길=the crossroads·road of life, 계단=Jacob's ladder·descent into the depths(출세 제거), 시장=the agora·Vanity Fair(재물 제거), 문=Janus, 복도=the liminal, 감옥=self-imposed prison. (school·elevator·workplace·hospital = 현대/보편물이라 en 이미 보편적. 땅 batch1)
- [x] **object** 21개 ✓ (21/21) — 동양 재물·인연 유지, en은 서양 상징으로: 금=alchemical/incorruptible Self·Midas greed, 반지=the unbroken circle·covenant·binding ring, 책=Book of Life·sacred/hidden knowledge, 열쇠=key to the unconscious·answer to a mystery, 신발=standpoint·Cinderella's slipper·walking in another's shoes, 거울=Narcissus·true self vs persona, 문=threshold·Janus·rite of passage, 창문=window of the soul, 가방=emotional baggage, 옷=persona(Jung), 비행기=Icarus, 칼=sword of discrimination·double-edged, 침대=intimate threshold, 시계=Father Time. (car·bus·train·phone·photo = 현대 보편물이라 en 이미 보편적, ko 정리만. 똥·돈 batch1)
- [x] **person** 12개 ✓ (조상·스님·아기·어머니 = 동양 고유/태몽 vs 융 원형 / stranger·child·father·friend·partner·ex_partner·ghost·celebrity = B안+보편)
- [x] **action** 10개 ✓ (10/10) — en은 서양 상징으로: 날기=the soul's flight/transcendence, 떨어짐=the Fall/surrender, 수영=the waters of the unconscious, 싸움=confronting the shadow(역몽 제거), 노래=the voice of the soul(길조 제거), 춤=Dionysian ecstasy(길조 제거), 찾기=the quest. (running·lost_item = 보편 심리 동사라 en 이미 보편적. 쫓김 batch1)
- [x] **animal** 21개 ✓ (21/21) — 동양 길몽/재물 유지, en은 서양 상징으로 교체: 소=Earth Mother/양육·milked dry, 쥐=the small·갉는 작은 불안, 거미=the weaver/Arachne·Great Mother, 거북=world-bearer·tortoise-and-hare·shell, 나비=psyche/soul·metamorphosis, 닭=cock heralds dawn·the egg, 사슴=gentle hart·skittish innocence, 원숭이=trickster·monkey mind·aping vanity, 말=life-force·instinctual body·white steed, 고양이=witch's familiar·intuitive feminine, 개=loyalty·protective instinct, 새=soul/spirit·freedom, 벌레=getting under your skin. (뱀·돼지·용·호랑이·물고기·곰·고래·개구리 기존 완료)
- [x] **nature** 17개 ✓ — en을 서양 원형으로(달=anima·홍수=Noah·산=Self·나무=tree of life·바다·강=무의식/생의 행로). 나머지(dawn·rainbow·wind·rock·star·earthquake)는 en이 이미 보편적이라 확인+ko 정리만.
- [x] **body** 8개 ✓ (치아·임신·머리카락·몸·피·알몸·손·발) — 임신=태몽 vs 창의적 잉태, 나머지 B안. (피=재물 전통은 안전정책상 의도적 배제 유지)
- [x] **event** 6개 ✓ (죽음·장례식·시험·결혼식·전쟁·사고) — death=동양 역몽 fortune 추가, funeral/wedding/war en fortune 서양으로 재구성, 나머지 B안
- [x] **food** 3개 ✓ — en은 서양 상징으로(재물 제거): 음식=the feast·communion·spiritual nourishment, 고기=the flesh·carnal appetite·the fatted calf, 술=Dionysian·in vino veritas·loosening the ego's guard.
- [x] **emotion** 3개 ✓ — en은 서양 상징으로: 울음=catharsis(Greek)·cleansing tears, 분노=wrath·the shadow's fire·the repressed finding voice(역몽 제거), 웃음=the healing of mirth·the divine comedy(복/길조 제거).
- [x] **abstract** 2개 ✓ — 군중=the mob·the collective·losing the self in the mass, 여럿=강도·누적 구조 modifier(보편).

> 카테고리별 정확한 ID 목록은 `npm run eval:coverage` 산출물·seed로 대조. 진행하며 coverage_gap 신규 심볼(ENC-06/RAG)도 해당 카테고리에 흡수한다.

### Phase B — RAG 기술 (RAG-IMP) · 콘텐츠와 병행 가능

선후 관계: **RAG-IMP-01(측정) → 02(벡터) → 03~05(recall·ranking)**. 측정 없이 튜닝하지 않는다.

- [x] RAG-IMP-01: 평가셋 32개(한/영, common/tradition/sensitive/paraphrase) + recall@k·precision 스크립트 + baseline. **Baseline(k=5): micro 0.842 / macro 0.781.** tag별: common 1.0, tradition 1.0, sensitive 0.333, paraphrase 0.556, en 0.833. 노출된 구멍: sceneModifier-only 미surface, 단음절 alias 가드(물↛흙탕물), 패러프레이즈, 영어 형태소(chasing↛chased)
- [x] RAG-IMP-03 + 04(조합): 라이브 경로의 형태소 lemma(Kiwi)를 eval에도 연결하고, lemma친화 bare-stem alias(being_chased "도망치/뒤따라/following")를 추가. **결과: hybrid macro recall 0.891→0.938, paraphrase 0.667→0.833** (도망쳤어→"도망치"→쫓김). 발견: lemma는 정확하지만 alias가 구문형("도망치는 꿈")이면 연결 안 됨 → lemma는 alias와 조합해야 효과. precision: lexical 0.823 / hybrid 0.749(후보 tier). `npm run eval:retrieval:vector`. alias 충돌 가드로 "도망"(running과 겹침)은 제외.
- [~] RAG-IMP-05: 벡터 explicit-동반 임계값 0.68→0.62 (`dream-rag-retriever.ts`). 진단 결과 한국어 짧은 구어체(도망쳤어→being_chased)는 벡터 점수가 노이즈 바닥(0.38)이라 임계값으로 못 잡음 → **RAG-IMP-03(형태소/lemma)** 필요. precision 0.738 유지.
- [x] RAG-IMP-02: ko/en 인덱스 빌드(`npm run build:rag-index`, 각 872청크) → `output/rag/dream-rag-{ko,en}.json`, `.env` 활성(이미 라우트 배선됨). **하이브리드 eval(`npm run eval:retrieval:vector`): macro recall 0.859→0.891, sensitive 0.5→0.833.** 벡터가 alias-갭(이가 우수수 빠졌어→teeth)을 precision 붕괴 없이 의미로 잡음. 남은 미스(도망쳤어→chased, molar→teeth)는 threshold 튜닝(RAG-IMP-05) 대상. 주의: 인덱스(각 38MB)는 `output/`(gitignore) → 배포 시 빌드 스텝 필요.
- [ ] RAG-IMP-03: 매처/구조분석 경로에 lemma 공급(현재 LLM 경로 한정), `safeLemmatize` 폴백
- [x] RAG-IMP-04 ✓: 평가셋 recall 구멍 4건 전부 폐쇄. 핵심 인사이트 = 한국어 과거형 축약(빠지+었→빠졌, 도망치+었→도망쳤)은 어간이 바뀌어 현재형 alias로 못 잡으니 **과거형 구문 alias를 따로** 넣어야 하고, 오다/가다 불규칙 연결어미 "와서"는 KOREAN_SUFFIXES에 없어 "뒤따라"가 "뒤따라와서"를 못 잡았다(추가함). 결과 micro/macro recall 1.0·precision@5 0.885·perfect-recall 1.0. retrieval-eval.test floor를 0.95/0.95/0.85로 상향해 gain 고정.
- [ ] RAG-IMP-05: 재랭킹 — exact 포화 완화, 일반어 라벨 과매치 보정(예: "땅" 라벨이 snake를 제친 사례)
- [ ] RAG-IMP-06: 저/무매칭 폴백
- [ ] RAG-IMP-07: 타로 카드 의미를 버전관리 lookup 데이터로 분리(타로는 닫힌 집합이라 RAG 대상 아님)

### 측정 결과 (2026-06-03)

- **Matching recall (RAG-IMP-01)**: baseline k=5 micro 0.842 / macro 0.781 / precision 0.698. 타깃 alias 3건(흙탕물·장례식장·chasing) 후 **micro 0.895 / macro 0.859 / precision 0.792** (recall↑, precision↑). → 낮은 recall은 심볼 부족이 아니라 **매칭(alias/형태소/패러프레이즈)** 문제임이 입증됨.
- **Coverage (RAG-IMP-08)**: 흔한 상징 72개 탐침 → covered 44, **matching_gap 0**(있는 심볼은 bare 키워드로 100% 매칭), **coverage_gap 26**(항목 없음), over_match 2(보석→gold, 할머니→ancestor).
- **결론**: 두 축 분리 확인. 매칭은 견고(0.86), 그러나 **흔한 상징의 ~37%가 미등록** = 실재하는 coverage 부족. → ENC-07 우선 추가 목록 확보.
- **ENC-07 우선 추가 후보(coverage_gap 26)**: 해·태양·하늘·배(船)·자전거·총·경찰·군인·도둑·절·교회·사자·코끼리·늑대·토끼·여우·오줌·시체·키스·안개·번개·모자·안경·선생님·할머니(전용)·편지·컴퓨터
- 아티팩트: `backend/output/eval/retrieval-eval-latest.{md,json}`, `coverage-eval-latest.{md,json}`. 재생성: `npm run eval:retrieval` / `npm run eval:coverage`.

### 완료 기준 (Definition of Done)

- 모든 활성 심볼 ko=동양/en=서양로 분리되고 우회동사 0, sceneModifier ≥5
- RAG 평가셋에서 baseline 대비 recall@5 개선 수치 기록
- backend tsc·전체 테스트·frontend build 통과, vault/docs 동기화

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

## THEME-01 Implementation Checklist

- [x] 고양이 선택 UI 문구를 "해몽사 선택"에서 "테마 선택"으로 변경
- [x] `gray_cat`이 `detailed` 해몽 권한을 자동 부여하지 않도록 `access-policy` 수정
- [x] 분석 요청에서 선택 고양이가 LLM persona/prompt 분기로 전달되지 않도록 수정
- [x] backend `cat-reader-personas` 기반 프롬프트 분기를 제거하거나 공통 persona로 단일화
- [x] mock analysis의 고양이별 `readerNote` 차이를 제거하고 공통 문구로 고정
- [x] 결과/로딩/홈/프로필에서는 고양이를 이미지, 배경, 스탬프, 테마 색에만 사용
- [x] `gray_cat_interest_clicked` 계열 이벤트는 현재 코드에 없음을 확인하고, 추후 도입 시 `premium_cat_theme_interest_clicked`와 `tarot_addon_interest_clicked`로 분리
- [x] 기존 `cat_reader_type` 저장 필드는 당장 유지하되 의미를 theme id로 제한하고, post-MVP migration을 별도 계획으로 분리
- [x] 관련 frontend/backend 테스트를 새 정책 기준으로 업데이트

## I18N English Localization Checklist

> 한·영 동시 출시 작업. **해몽 엔진(백과사전/길흉/RAG/프롬프트/안전문구)은 이미 ko/en 이중언어**이고, locale은 프로필의 언어 토글로 선택해 API 요청·UI에 반영된다(기본 ko). 아래는 **아직 한국어로 하드코딩돼 있어 영어로 이관해야 하는 UI 껍데기** 목록이다. 방식: `frontend/src/lib/i18n/messages.ts` 사전에 ko/en 키 추가 → 컴포넌트에서 `useLocale().t(...)`로 치환.

- [x] i18n 기반: `locale` 스토어, `messages` 사전(키 파리티 타입 강제 + `{var}` 인터폴레이션), `useLocale`/`t()`, `LanguageToggle`
- [x] API 요청에 현재 locale 전송 (`/api/dreams/analyze`)
- [x] EN 고양이 이름 Midnight/Luna/Sol/Ash + `getCatReaderName(reader, locale)`
- [x] 프로필 설정에 언어 토글 배치, cat picker의 이름 표시 locale 연동
- [x] 꿈 입력 폼 제출/빈입력 문구
- [x] EN matcher 퀵윈: `flying→fly/flew`, `swimming→swim/swims` alias
- [ ] **분위기/감각 옵션 라벨** (`frontend/src/lib/dream-entry-options.ts` — 현재 한국어 단일)
- [ ] **꿈 영수증** (`dream-result-receipt.tsx`): 섹션 제목, "테마", 버튼/캡션, 디스클레이머
- [ ] 공유 이미지 텍스트 (`result-actions.ts`의 "테마: …")
- [ ] 꿈 입력 폼 잔여 문구: 분위기/감각 섹션 제목·안내, `DreamSubmitButton` aria/alt("고양이가 꿈을 읽는 중" 등)
- [ ] cat picker의 tag/role/sheet 카피 (`cat-reader-home-copy.ts`, `cat-readers.ts`의 role/shortDescription/ctaLabel)
- [ ] 접근 게이트 안내/CTA (`access-policy.ts` 반환 문구 → reason 기반 사전 매핑으로 UI에서 현지화)
- [ ] 하단 네비 라벨 (`bottom-nav`)
- [ ] 프로필 나머지 섹션 제목/설명(앱 설정/기록 관리/도움말/Moon Pass), 로딩 화면, night 체크인 화면 문구
- [ ] `<html lang>`과 메타데이터 locale (`layout.tsx` 현재 `ko`/`ko_KR` 고정), `og:locale` 분기
- [ ] (옵션) 첫 방문 시 브라우저 언어 기반 EN 추천 — 현재는 기본 ko 고정, 토글 수동 전환만

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
- [[plans/2026-07-03-tarot-content-expansion-sprint|Tarot Content Expansion Sprint]]
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

- TAROT-02/TAROT-03/TAROT-05: `tarotCards` 통합 78장 덱과 minor asset mapping으로 오늘의 한 장을 확장하고, 질문별 한 장 MVP를 `/tarot/question`에 추가했다. 질문 플로우는 상태 6개 -> 질문 5개 -> 1장 draw -> LLM 결과 -> 저장/공유로 이어지며, API/DB/localStorage/share payload는 `question_one_card`, `reading_key`, `tarot_question_one_card`, `unlockMethod`를 포함한다. 현재 `rewarded_ad`는 타입과 403 `rewarded_ad_required` 응답으로 대비하고 실제 광고 검증은 후속 작업으로 남긴다.
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
- I18N-01: 해몽 엔진은 이미 ko/en 이중언어임을 감사로 확인(백과 72심볼 ko/en 패리티, EN fortune·RAG 인덱스·안전문구 존재)하고, 부재하던 프론트 EN front-door를 추가했다. `frontend/src/lib/locale.ts`(localStorage+event+`useSyncExternalStore` 전역 스토어, 기본 ko), `i18n/messages.ts`(키 파리티 타입 강제 + `{var}` 인터폴레이션), `use-locale.ts`(`useLocale`/`t`), `LanguageToggle`를 추가. `dream-entry-form`이 현재 locale을 `/api/dreams/analyze`에 전송하고 제출/빈입력 문구를 `t()`로 이관. EN 고양이 이름 Midnight/Luna/Sol/Ash와 `getCatReaderName(reader, locale)`를 추가해 cat picker 이름이 locale에 따라 전환되고, 프로필 설정에 언어 토글 섹션을 배치. EN matcher 퀵윈으로 `flying→fly/flew`, `swimming→swim/swims` alias 추가. locale/messages/cat-readers/cat-reader-picker/profile-room 테스트와 frontend typecheck 통과. 나머지 UI 껍데기 문구 이관은 I18N-02와 위 I18N 체크리스트로 분리. 커밋: i18n 기반(`feat(i18n): add locale store...`), EN 이름+토글(`feat(i18n): English cat names + language selector...`).
- B-4(한국어 형태소 서비스): `services/korean-analyzer`(Kiwi warm HTTP, Railpack/Node22, 부팅 시 모델 보장)를 Railway에 배포 완료(`manyang-production.up.railway.app`, `/health`·`/lemmatize` 라이브 스모크 통과), 앱 env `MANYANG_LEMMATIZER_URL` 설정 후 재배포 완료. LLM 경로에서 KO 입력이 형태소 lemma로 보강되며, 서비스 미설정/다운 시 `safeLemmatize`로 폴백.
