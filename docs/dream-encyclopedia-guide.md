# Dream Encyclopedia Guide

Manyang의 꿈 상징 백과사전은 RAG 해몽 시스템의 기준 지식이다. LLM은 이 백과사전에서 검색되고 검증된 근거를 바탕으로 꿈을 해석한다.

이 문서는 백과사전 데이터를 어떻게 이해하고, 작성하고, 확장해야 하는지 설명한다. 전체 RAG 흐름은 `docs/dream-rag-system-overview.md`를 함께 참고한다.

## 1. 백과사전의 역할

꿈해몽에서 백과사전은 단순한 단어장이나 뜻풀이 목록이 아니다.

백과사전은 다음 역할을 한다.

- 꿈에 등장한 상징을 식별한다.
- 상징별로 해석 가능한 범위를 제한한다.
- LLM이 사용할 수 있는 안전한 표현을 제공한다.
- LLM이 피해야 할 단정, 예언, 진단 표현을 정의한다.
- 한국어와 영어 입력을 모두 처리할 수 있게 한다.
- 고양이 페르소나가 달라도 같은 근거 위에서 해몽하도록 만든다.
- 향후 벡터 검색과 개인화 분석의 기준 데이터를 제공한다.

핵심 원칙은 다음과 같다.

> 사용자가 꿈에 쓴 모든 단어를 해석하지 않는다. 백과사전에 등록되고 근거가 확인된 상징만 적극적으로 해석한다.

## 2. 현재 저장 위치

현재 런타임 기준 백과사전 데이터는 TypeScript seed 파일에 있다.

```text
backend/src/data/symbol-encyclopedia.ts
```

타입 계약은 다음 파일에 있다.

```text
backend/src/contracts/symbol-encyclopedia.ts
```

현재 등록된 상징 수는 121개다. 향후에는 Supabase/Postgres 테이블과 pgvector 인덱스로 옮길 수 있지만, 현재 원본 데이터는 코드 기반 seed로 관리한다.

권장 장기 구조는 다음과 같다.

```text
editorial source
-> TypeScript seed or DB seed
-> runtime symbol entries
-> RAG chunks
-> vector embeddings
-> LLM prompt evidence
```

## 3. 상징 항목의 큰 구조

하나의 상징 항목은 다음 세 층으로 구성된다.

```text
SymbolEntry
  - 공통 메타데이터
  - 해석 렌즈
  - locale별 콘텐츠
```

예를 들어 `snake`는 하나의 SymbolEntry이고, 그 안에 한국어 `뱀` 콘텐츠와 영어 `Snake` 콘텐츠가 함께 들어간다.

```text
snake
  category: animal
  subcategory: reptile
  locales.ko.label: 뱀
  locales.en.label: Snake
```

locale별 파일을 따로 만드는 방식이 아니라, 같은 상징 ID 안에 언어별 표현을 함께 둔다.

## 4. 공통 메타데이터 필드

### id

상징의 안정적인 식별자다.

규칙:

- 영어 `snake_case`를 사용한다.
- UI 문구나 번역이 바뀌어도 id는 바꾸지 않는다.
- DB, 기록, 통계, 벡터 인덱스에서 계속 참조될 값이므로 신중하게 정한다.

예:

```text
snake
owned_land
being_chased
lost_item
```

### status

상징의 사용 상태다.

```text
draft
active
deprecated
```

- `draft`: 작성 중. 기본 검색에 넣지 않는다.
- `active`: 현재 사용 가능.
- `deprecated`: 더 이상 새 해몽에 사용하지 않지만, 과거 기록 호환을 위해 남긴다.

### editorialStatus

콘텐츠 검수 상태다.

```text
needs_review
approved
```

운영 기준으로는 `active`이면서 `approved`인 항목만 사용자-facing 해몽에 쓰는 것이 안전하다.

### category

대분류다. 검색, 필터, 통계, MMR 다양성, UI 그룹에 사용한다.

현재 허용되는 대분류는 다음과 같다.

```text
place
person
animal
nature
object
body
action
event
food
emotion
abstract
```

대분류는 너무 자주 늘리지 않는다. 큰 분류는 안정적으로 유지하고, 세부 차이는 `subcategory`와 `facets`에서 처리한다.

### subcategory

소분류다. category보다 더 구체적인 그룹을 표현한다.

예:

```text
category: animal
subcategory: reptile

category: place
subcategory: home_space

category: object
subcategory: threshold_item
```

소분류는 검색과 운영 분석에 도움이 되지만, 사용자에게 그대로 노출하는 정보는 아니다.

### facets

상징의 성격을 나타내는 태그다.

예:

```text
["instinct", "hidden_movement", "transformation"]
["transition", "choice", "boundary"]
["memory", "loss", "searching"]
```

facets는 다음 용도로 쓴다.

- 유사 상징 비교
- 검색 보조
- 향후 벡터 chunk 구성
- 반복 상징 분석
- 월간 리포트 테마 집계

### symbolRole

상징이 해몽에서 어떤 역할을 할 수 있는지 나타낸다.

```text
primary_candidate
modifier
context_signal
```

- `primary_candidate`: 중심 상징으로 해석 가능하다.
- `modifier`: 다른 상징의 장면 조건을 보정한다.
- `context_signal`: 감정, 시간, 수량처럼 문맥을 보강한다.

예를 들어 `snake`는 중심 상징이 될 수 있지만, `many`는 주로 “많음”이라는 수량 modifier로 작동한다.

### safetyLevel

상징의 민감도를 나타낸다.

```text
safe
sensitive
```

`sensitive`는 조심스럽게 다룬다. 예를 들어 피, 병원, 죽음, 사고, 자해와 연결될 수 있는 상징은 LLM이 확정적 의미를 붙이지 않도록 제한해야 한다.

### accessTier

상징 또는 해석 깊이의 접근 등급이다.

```text
free
premium
```

현재 대부분의 기본 상징은 `free`다. 향후 Moon Pass에서 반복 상징, 깊은 심리 해석, 월간 분석 등에 `premium` 레이어를 붙일 수 있다.

## 5. 해석 렌즈

각 상징은 세 가지 해석 렌즈를 가진다.

```text
universal
east_asian
western
```

### universal

문화권과 무관하게 비교적 넓게 적용할 수 있는 해석이다.

예:

- 물: 감정, 흐름, 정화
- 문: 선택, 경계, 전환
- 길: 방향, 이동, 과정

### east_asian

동양권 상징 감각이나 민속적 해석을 참고하는 렌즈다.

주의할 점:

- 사용자에게 “동양권에서는”이라고 꼭 말하지 않는다.
- 길몽/흉몽을 단정하지 않는다.
- 재물, 태몽, 성공 같은 해석은 가능성을 낮은 강도로만 사용한다.

### western

서양권의 심리적, 신화적, 상징적 연결을 참고하는 렌즈다.

주의할 점:

- 정신분석 진단처럼 말하지 않는다.
- 특정 학파의 이론을 직접 주장하지 않는다.
- 보편적 은유와 감정 흐름 중심으로 변환한다.

### safeTransform

각 렌즈의 원자료를 사용자에게 안전하게 바꾼 문장이다.

예:

```text
원자료 느낌: 뱀은 재물, 태몽, 위험, 유혹 등으로 해석될 수 있다.
safeTransform: 뱀은 조용히 커지는 감각이나 무시하기 어려운 변화의 신호로 읽을 수 있다.
```

### avoidClaims

해당 상징에서 피해야 하는 주장이다.

예:

```text
돈이 반드시 들어온다.
임신을 의미한다.
사고가 생긴다.
누군가 배신한다.
```

avoidClaims는 프롬프트와 후처리, 품질 평가에서 모두 중요하다.

## 6. Locale별 콘텐츠

각 상징은 `ko`, `en` 콘텐츠를 모두 가진다.

```text
locales.ko
locales.en
```

각 locale에는 다음 필드가 들어간다.

### label

사용자-facing 대표 이름이다.

예:

```text
ko: 뱀
en: Snake
```

label은 UI, 꿈 영수증, symbolReadings에 쓰일 수 있다.

### aliases

사용자가 실제 꿈에 쓸 법한 표현이다.

예:

```text
ko: ["뱀", "구렁이", "큰 뱀", "독사"]
en: ["snake", "serpent", "large snake", "viper"]
```

alias 작성 규칙:

- 사용자가 실제로 입력할 표현을 넣는다.
- 너무 넓은 단어는 피한다.
- 짧고 흔한 단어는 오탐을 만들 수 있으므로 조심한다.
- 다른 상징과 alias가 겹치면 의도적인지 확인한다.
- 한국어는 띄어쓰기 변형을 고려한다.
- 영어는 단수/복수, 동사형, 일반 표현을 고려한다.

나쁜 alias 예:

```text
좋다
불안
사람
것
피
```

이런 표현은 너무 넓거나 오탐 위험이 크다.

### searchText

RAG 검색과 의미 검색에 쓰기 좋은 압축 설명문이다.

searchText에는 다음을 넣는다.

- 대표 표현
- 관련 표현
- 장면 표현
- 핵심 의미
- 은유적 연결

예:

```text
door, gate, doorway, threshold, locked door, changing door, boundary, choice, transition
```

searchText는 사용자가 직접 보는 문장이 아니다. 검색 친화적으로 쓰되, 너무 장황하게 쓰지 않는다.

### coreMeanings

상징의 핵심 의미 키워드다.

예:

```text
["경계", "선택", "전환"]
["emotion", "flow", "release"]
```

coreMeanings는 LLM에게 “이 상징이 어떤 범위에서 해석될 수 있는지” 알려준다.

### lightReadings

상징을 비교적 긍정적이거나 가능성 중심으로 읽는 문장이다.

예:

```text
새로운 문이 열리는 감각
막혀 있던 흐름이 움직이기 시작하는 장면
```

### shadowReadings

상징의 긴장, 불안, 부담을 읽는 문장이다.

예:

```text
선택 앞에서 망설이는 마음
예측하기 어려운 변화에 대한 긴장
```

light/shadow는 길몽/흉몽 이분법이 아니다. 같은 상징의 밝은 면과 부담스러운 면을 함께 제공하기 위한 장치다.

### sceneModifiers

장면 조건에 따라 해석을 조정하는 필드다.

예:

```text
many:
  triggerTerms: ["많이", "수십 마리", "가득"]
  reading: 여러 신호나 감각이 한꺼번에 올라오는 장면
  weight: 0.85
```

scene modifier는 다음 상황에 유용하다.

- 많다 / 적다
- 크다 / 작다
- 열려 있다 / 닫혀 있다
- 깨졌다 / 사라졌다
- 쫓긴다 / 도망친다
- 물이 맑다 / 탁하다
- 집 안 / 낯선 곳

modifier 작성 규칙:

- triggerTerms는 실제 입력에 나올 법한 표현으로 쓴다.
- reading은 상징 의미를 더 구체화해야 한다.
- weight는 0.5~0.9 사이를 기본으로 한다.
- modifier 하나가 독립 상징처럼 과도하게 커지면 별도 SymbolEntry로 분리한다.

### contextQuestions

사용자에게 더 물어볼 수 있는 질문이다.

예:

```text
그 문은 열려 있었나요, 닫혀 있었나요?
뱀은 위협적으로 느껴졌나요, 아니면 그냥 그 자리에 있었나요?
```

현재 서비스가 매번 추가 질문을 하지는 않더라도, 향후 깊은 해석이나 Moon Pass에 활용할 수 있다.

### metaphorHooks

해몽 문장에 쓸 수 있는 은유 재료다.

예:

```text
문턱 앞에 선 마음
수면 아래에서 움직이는 감각
손에 잡히지 않는 흐름
```

LLM이 문장을 더 풍부하게 만들 때 사용하지만, 그대로 복사하지 않도록 프롬프트에서 제한한다.

### cardTitleSeeds

꿈 카드나 영수증 제목을 만들 때 참고할 수 있는 제목 재료다.

예:

```text
문턱 앞의 밤
수면 아래의 신호
사라진 열쇠를 찾는 꿈
```

### smallPrescriptions

사용자가 오늘 가볍게 해볼 수 있는 작은 제안이다.

예:

```text
오늘은 미뤄둔 선택 하나를 종이에 적어보세요.
지키고 싶은 경계 하나를 조용히 정리해보세요.
```

주의할 점:

- 강한 행동 지시가 되면 안 된다.
- 의료, 금전, 인간관계 결정을 대신하면 안 된다.
- “반드시 해야 한다”가 아니라 “가볍게 해볼 수 있다”에 가깝게 쓴다.

### safeReading

이 상징을 가장 안전하게 요약한 해석문이다.

safeReading은 fallback, RAG chunk, 품질 평가에 모두 중요하다.

좋은 safeReading:

```text
문은 선택이나 전환 앞에 선 마음을 비추는 상징으로 읽을 수 있다.
```

나쁜 safeReading:

```text
문이 나오면 곧 인생의 큰 기회가 반드시 온다.
```

### avoidExpressions

해당 상징에서 피해야 할 표현이다.

예:

```text
반드시 돈이 들어온다.
임신을 뜻한다.
병이 생긴다.
상대가 배신한다.
```

avoidExpressions는 상징별 안전 장치다. 일반 안전 정책과 별개로 반드시 작성한다.

### fortune

선택 필드다. 전통적 길몽/징조 느낌을 아주 가볍게 사용할 때만 쓴다.

주의할 점:

- 확정 예언이 아니다.
- playful 또는 tradition 모드에서만 제한적으로 쓴다.
- 사용자에게 현실 결과를 보장하지 않는다.
- cautious가 있으면 조건에 따라 조심스러운 방향도 함께 제공한다.

## 7. 좋은 항목의 기준

좋은 백과사전 항목은 다음 조건을 만족한다.

- 사용자가 실제로 쓸 표현을 alias에 담고 있다.
- 핵심 의미가 2~5개로 선명하다.
- light/shadow가 모두 있다.
- 장면 modifier가 최소 2~3개 있다.
- 동양권/서양권 렌즈가 있더라도 사용자에게 단정적으로 노출하지 않는다.
- safeReading이 짧고 안전하다.
- avoidExpressions가 구체적이다.
- 관련 상징이 연결되어 있다.
- 한국어와 영어 품질이 비슷하다.

좋지 않은 항목은 다음과 같다.

- alias가 너무 적어 검색이 안 된다.
- alias가 너무 넓어 오탐이 많다.
- “좋은 일이 생긴다”처럼 모든 꿈에 붙일 수 있는 문장만 있다.
- 동양/서양 렌즈가 복사 붙여넣기처럼 비슷하다.
- 해석이 예언, 진단, 지시처럼 들린다.
- safeReading과 lightReadings가 같은 말만 반복한다.

## 8. 새 상징 추가 기준

새 상징은 다음 경우에 추가한다.

- 사용자가 자주 입력할 가능성이 높다.
- 기존 상징의 modifier로는 설명하기 어렵다.
- 꿈 장면에서 중심 역할을 할 수 있다.
- 검색 누락 로그에서 반복적으로 등장한다.
- 콘텐츠적으로 카드, 기록, 월간 분석에 활용 가치가 있다.

반대로 다음 경우는 새 상징으로 만들지 않는다.

- 단순 형용사나 부사다.
- 기존 상징의 modifier로 충분하다.
- 너무 드물거나 개인적인 고유명사다.
- 안전 위험이 큰데 해석 가치가 낮다.
- alias가 다른 상징과 거의 완전히 겹친다.

예:

```text
새 상징으로 적합:
  elevator, teeth, exam, wedding, snake, sea

modifier로 충분:
  very big, many, broken, locked, bright, dark
```

단, `many`처럼 여러 상징에 걸쳐 매우 자주 쓰이고 구조 분석에 중요하면 modifier 성격이 강해도 별도 상징으로 둘 수 있다.

## 9. 대분류와 소분류 사용법

대분류는 안정적으로 유지한다.

```text
place, person, animal, nature, object, body, action, event, food, emotion, abstract
```

소분류는 더 유연하게 쓴다.

예:

```text
animal / reptile
animal / mammal
nature / water_body
object / key_item
place / transit_space
body / mouth
event / evaluation
```

운영 기준:

- 대분류는 UX와 통계 기준이다.
- 소분류는 검색 품질과 콘텐츠 관리 기준이다.
- facets는 실제 의미 연결 기준이다.

## 10. Alias 충돌 관리

백과사전이 커질수록 alias 충돌이 중요해진다.

예를 들어 `chased`가 `running`과 `being_chased` 양쪽에 있으면, “개에게 쫓겼다”는 꿈에서 `running`이 과하게 잡힐 수 있다.

관리 원칙:

- 중심 상징 alias와 행동 modifier alias를 구분한다.
- 같은 alias가 여러 상징에 필요하면 더 구체적인 triggerTerms를 추가한다.
- 짧은 단어는 단독 alias로 쓰지 않는다.
- 한국어 조사/어미 변형은 matcher에서 처리하되, 핵심 alias는 명확하게 둔다.
- 테스트에서 “한 표현이 너무 많은 상징을 깨우는지” 확인한다.

## 11. 등록되지 않은 상징과 scene-only

백과사전에 없거나 근거가 부족한 요소는 scene-only로 다룬다.

scene-only는 다음 뜻이다.

```text
사용자 꿈 장면으로 언급할 수는 있지만, 상징적 의미를 붙이면 안 되는 요소
```

예:

```text
사용자 입력:
  엘리베이터가 떨어졌고, 옆에 파란 가방이 있었어요.

confirmed:
  elevator, falling

scene-only 가능:
  파란 가방
```

이 경우 파란 가방에 “숨겨진 재물” 같은 의미를 붙이면 안 된다. 단, “꿈에는 파란 가방 같은 세부 장면도 함께 남아 있었다”처럼 장면 묘사는 가능하다.

## 12. 작성 프로세스

새 상징을 추가할 때는 아래 순서를 따른다.

1. 상징 후보를 정한다.
2. 기존 백과사전에 비슷한 상징이 있는지 확인한다.
3. category, subcategory, facets를 정한다.
4. 한국어/영어 label과 aliases를 작성한다.
5. coreMeanings를 2~5개로 정리한다.
6. lightReadings와 shadowReadings를 작성한다.
7. sceneModifiers를 2~4개 만든다.
8. safeReading을 작성한다.
9. avoidExpressions를 작성한다.
10. relatedIds를 연결한다.
11. 테스트 꿈 2~3개로 매칭을 확인한다.
12. 오탐이 있으면 alias를 줄이거나 modifier로 옮긴다.

## 13. 검수 체크리스트

상징 항목을 approved로 올리기 전에 다음을 확인한다.

- id가 안정적인가?
- 대분류가 현재 enum 안에 있는가?
- subcategory가 너무 넓거나 너무 임의적이지 않은가?
- alias가 실제 사용자 표현인가?
- alias가 다른 상징과 위험하게 겹치지 않는가?
- 한국어와 영어가 모두 작성되어 있는가?
- light/shadow가 둘 다 있는가?
- scene modifier가 장면 차이를 실제로 반영하는가?
- safeReading이 예언처럼 들리지 않는가?
- avoidExpressions가 충분히 구체적인가?
- 민감 상징이면 safetyLevel이 `sensitive`인가?
- sourceBasis가 내부 기준으로 설명 가능한가?
- LLM이 그대로 복사해도 위험한 문장이 없는가?

## 14. 예시 템플릿

새 상징을 만들 때는 아래 구조를 기준으로 생각하면 된다.

```text
id:
category:
subcategory:
facets:
symbolRole:
safetyLevel:
accessTier:

universalMeanings:
tensionAxis:
relatedIds:
sourceBasis:

ko:
  label:
  aliases:
  searchText:
  coreMeanings:
  lightReadings:
  shadowReadings:
  sceneModifiers:
  contextQuestions:
  metaphorHooks:
  cardTitleSeeds:
  smallPrescriptions:
  safeReading:
  avoidExpressions:

en:
  label:
  aliases:
  searchText:
  coreMeanings:
  lightReadings:
  shadowReadings:
  sceneModifiers:
  contextQuestions:
  metaphorHooks:
  cardTitleSeeds:
  smallPrescriptions:
  safeReading:
  avoidExpressions:
```

## 15. 예시: 좋은 safeReading 변환

꿈해몽 전통에서 강하게 말할 수 있는 표현도 Manyang에서는 안전하게 바꾼다.

```text
강한 표현:
  뱀은 재물운이 크게 들어오는 꿈입니다.

Manyang식 표현:
  뱀은 조용히 커지는 감각이나 무시하기 어려운 변화가 드러나는 장면으로 읽을 수 있어요.
```

```text
강한 표현:
  이빨이 빠지면 가족에게 안 좋은 일이 생깁니다.

Manyang식 표현:
  이빨이 빠지는 꿈은 자신감, 표현력, 통제감이 흔들리는 느낌과 연결해 볼 수 있어요.
```

```text
강한 표현:
  돈 꿈은 곧 돈이 들어온다는 뜻입니다.

Manyang식 표현:
  돈은 가치, 교환, 내가 중요하게 여기는 자원에 대한 감각으로 읽을 수 있어요.
```

## 16. 백과사전과 RAG의 연결

백과사전 필드는 RAG에서 다음처럼 쓰인다.

| 백과사전 필드 | RAG에서의 역할 |
| --- | --- |
| `label` | 사용자-facing 대표 상징명 |
| `aliases` | 명시 매칭 |
| `searchText` | keyword/semantic 검색 |
| `coreMeanings` | 해석 범위 제한 |
| `lightReadings` | 긍정 가능성 방향 |
| `shadowReadings` | 긴장/불안 방향 |
| `sceneModifiers` | 장면별 의미 보정 |
| `metaphorHooks` | 이미지 있는 문장 생성 |
| `safeReading` | fallback 및 안전한 요약 |
| `avoidExpressions` | 금지 표현 방어 |
| `relatedIds` | 관련 상징 보조 |
| `facets` | 유사도, 통계, 개인화 |

LLM에게는 전체 백과사전이 아니라, 검색과 evidence gate를 통과한 일부 필드만 전달된다.

## 17. 향후 DB 이전 시 구조

Supabase/Postgres로 옮길 때는 하나의 거대한 JSON보다 테이블을 나누는 것이 좋다.

권장 방향:

```text
symbol_entries
symbol_localizations
symbol_scene_modifiers
symbol_generation_assets
symbol_culture_notes
symbol_embeddings
```

이렇게 나누면 다음 장점이 있다.

- locale별 수정이 쉽다.
- scene modifier만 따로 추가/검수할 수 있다.
- embedding chunk를 독립적으로 재생성할 수 있다.
- 관리자 UI에서 필드별 편집이 가능하다.
- RLS와 검수 상태를 분리하기 쉽다.

하지만 DB로 옮겨도 백과사전의 본질은 바뀌지 않는다. DB는 저장소이고, 해몽 품질은 여전히 필드 설계와 콘텐츠 품질에 달려 있다.

## 18. 운영 원칙

백과사전 운영에서 가장 중요한 원칙은 다음이다.

1. 넓게 맞히는 것보다 잘못 해석하지 않는 것이 우선이다.
2. 재미를 위해 단정적인 예언을 만들지 않는다.
3. 상징 하나에 여러 가능성을 열어둔다.
4. 사용자에게 지역/문화권 라벨을 과하게 노출하지 않는다.
5. LLM이 그대로 따라 해도 안전한 표현만 넣는다.
6. alias는 늘릴수록 recall이 좋아지지만, 오탐도 함께 늘어난다.
7. 등록되지 않은 상징은 장면으로 남겨도 괜찮다.
8. 백과사전은 한 번에 완성하는 것이 아니라, 실제 입력 로그와 품질 평가로 계속 다듬는다.

## 19. 요약

Manyang의 꿈 상징 백과사전은 LLM에게 “무엇을 말해도 되는지”와 “어떻게 안전하게 말해야 하는지”를 알려주는 기준 데이터다.

좋은 백과사전 항목은 단순한 뜻풀이가 아니라, alias, 장면 modifier, light/shadow reading, safeReading, avoidExpressions를 함께 갖춘다. 이 구조가 있어야 RAG가 정확히 작동하고, 고양이 페르소나도 각자의 목소리를 유지하면서 근거 있는 해몽을 할 수 있다.

