---
title: Symbol Encyclopedia Schema
tags:
  - content
  - encyclopedia
  - schema
  - multilingual
status: accepted
---

# Symbol Encyclopedia Schema

> Contract v0.1. 마냥 상징 백과사전의 원본 저장 형태와 런타임 변환 기준을 고정한다.

---

## Storage Decision

MVP의 canonical source는 파일 기반 YAML이다.

```text
vault/05-Content/symbols/*.yaml
```

런타임에서는 YAML을 읽는 대신, 빌드/seed 단계에서 TypeScript seed 또는 DB seed로 변환한다.

```text
vault/05-Content/symbols/*.yaml
-> backend/src/data/symbol-encyclopedia.ts
-> later: Supabase/Postgres tables
-> later: symbol_embeddings pgvector index
```

원칙:

- YAML 파일이 편집 원본이다.
- vector DB는 원본이 아니라 검색 인덱스다.
- prompt 안에 백과사전 전체를 넣지 않는다.
- LLM/RAG는 검색된 항목의 필요한 필드만 받는다.

## File Naming

파일명은 stable `id`와 동일하게 둔다.

```text
snake.yaml
owned_land.yaml
door.yaml
school.yaml
```

규칙:

- 소문자 snake_case만 사용한다.
- locale 이름을 파일명에 넣지 않는다.
- 같은 상징의 언어별 데이터는 하나의 파일 안에 둔다.
- deprecated된 항목은 삭제하지 않고 `status: deprecated`로 둔다.

## Required YAML Shape

```yaml
id: snake
status: active
category: animal
safetyLevel: sensitive
accessTier: free

universalMeanings:
  - instinct
  - hidden movement
  - change
  - life force

tensionAxis:
  - fascination
  - wariness

relatedIds:
  - owned_land
  - transformation

sourceBasis:
  - everyday metaphor
  - animal symbolism
  - scene function
  - product editorial rule

cultureNotes:
  ko:
    weight: 0.7
    exposeByDefault: false
    notes:
      - 구렁이는 터, 생명력, 재물, 태몽과 연결되어 읽히는 경우가 있음
    safeTransform:
      - 커진 생명력
      - 내 영역 안에서 자라는 힘

locales:
  ko:
    label: 뱀
    aliases:
      - 뱀
      - 구렁이
      - 큰 뱀
    searchText: 뱀, 구렁이, 큰 뱀, 수십 마리, 생명력, 경계, 변화, 숨은 움직임
    coreMeanings:
      - 본능
      - 경계
      - 숨은 움직임
      - 변화
      - 생명력
    lightReadings:
      - 조용히 커지는 가능성
      - 감각이 예민하게 깨어나는 흐름
    shadowReadings:
      - 압도감
      - 어디서 움직일지 모르는 긴장
    sceneModifiers:
      many:
        triggerTerms:
          - 많이
          - 수십 마리
          - 가득
        reading: 여러 갈래의 신호나 감각이 한꺼번에 올라오는 장면
        weight: 0.85
      large:
        triggerTerms:
          - 큰
          - 거대한
          - 구렁이
        reading: 무시하기 어려울 만큼 커진 힘이나 변화감
        weight: 0.8
    contextQuestions:
      - 뱀이 위협했나요, 그냥 있었나요?
      - 뱀이 있던 곳은 내 공간이었나요, 낯선 곳이었나요?
    metaphorHooks:
      - 조용히 움직이는 힘
      - 땅 아래에서 올라온 감각
    cardTitleSeeds:
      - 땅 아래 깨어난 구렁이
      - 수십 개의 숨은 움직임
    smallPrescriptions:
      - 오늘은 내가 지켜야 한다고 느끼는 영역 하나를 적어보세요.
    safeReading: 뱀은 불길함으로 단정하기보다, 본능적 감각이나 조용히 커지는 움직임으로 읽을 수 있어요.
    avoidExpressions:
      - 재물운이 반드시 오른다
      - 태몽이다
      - 위험한 일이 생긴다

  en:
    label: Snake
    aliases:
      - snake
      - serpent
      - large snake
    searchText: snake, serpent, large snake, many snakes, instinct, alertness, hidden movement, change
    coreMeanings:
      - instinct
      - alertness
      - hidden movement
      - change
    lightReadings:
      - a quiet force becoming visible
      - instinctive awareness waking up
    shadowReadings:
      - feeling overwhelmed
      - tension around something hard to predict
    sceneModifiers:
      many:
        triggerTerms:
          - many snakes
          - dozens
          - full of snakes
        reading: many signals or instincts appearing at once
        weight: 0.85
      large:
        triggerTerms:
          - large snake
          - huge snake
          - serpent
        reading: a force or change that feels hard to ignore
        weight: 0.8
    contextQuestions:
      - Was the snake threatening you, or simply present?
      - Was it in your own space or somewhere unfamiliar?
    metaphorHooks:
      - a quiet force moving under the surface
      - instinct becoming visible
    cardTitleSeeds:
      - The Snake Beneath the Ground
      - Dozens of Hidden Signals
    smallPrescriptions:
      - Write down one area of life that feels important to protect today.
    safeReading: A snake can point to instinctive movement or a change that feels hard to ignore.
    avoidExpressions:
      - money will definitely arrive
      - this is a pregnancy dream
      - something dangerous will happen
```

## TypeScript Contract

```ts
type SymbolEntryStatus = "draft" | "active" | "deprecated";
type SymbolSafetyLevel = "safe" | "sensitive";
type SymbolAccessTier = "free" | "premium";
type SupportedLocale = "ko" | "en";

type SymbolCategory =
  | "place"
  | "object"
  | "action"
  | "nature"
  | "animal"
  | "person"
  | "emotion"
  | "quantity"
  | "time";

type SymbolEntry = {
  id: string;
  status: SymbolEntryStatus;
  category: SymbolCategory;
  safetyLevel: SymbolSafetyLevel;
  accessTier: SymbolAccessTier;
  universalMeanings: string[];
  tensionAxis: string[];
  relatedIds: string[];
  sourceBasis: string[];
  cultureNotes?: Partial<Record<SupportedLocale, CultureNote>>;
  locales: Record<SupportedLocale, LocalizedSymbolEntry>;
};

type CultureNote = {
  weight: number;
  exposeByDefault: false;
  notes: string[];
  safeTransform: string[];
};

type LocalizedSymbolEntry = {
  label: string;
  aliases: string[];
  searchText: string;
  coreMeanings: string[];
  lightReadings: string[];
  shadowReadings: string[];
  sceneModifiers: Record<string, SceneModifier>;
  contextQuestions: string[];
  metaphorHooks: string[];
  cardTitleSeeds: string[];
  smallPrescriptions: string[];
  safeReading: string;
  avoidExpressions: string[];
};

type SceneModifier = {
  triggerTerms: string[];
  reading: string;
  weight: number;
};
```

## Field Rules

| Field | Rule |
| --- | --- |
| `id` | stable identifier. UI label이나 번역이 바뀌어도 유지 |
| `status` | MVP 검색 대상은 `active`만 기본 포함 |
| `category` | MMR 다양성, 필터링, 결과 설명에 사용 |
| `safetyLevel` | `sensitive`는 표현 강도와 금지어 검사를 강화 |
| `accessTier` | free/premium 백과 깊이 분리용. MVP는 대부분 `free` |
| `universalMeanings` | 언어권 공통 의미. 사용자에게 직접 노출하지 않아도 됨 |
| `tensionAxis` | 상징의 양면성. 예: fascination/wariness |
| `relatedIds` | exact match가 없을 때 related/fallback 검색에 사용 |
| `sourceBasis` | 내부 근거. 외부 사이트 문구 복사 금지 |
| `cultureNotes` | 내부 가중치와 safe transform용. 기본 결과에는 숨김 |
| `searchText` | embedding/BM25 대상. 설명문보다 검색 친화적으로 작성 |
| `sceneModifiers` | 단어 뜻풀이를 장면 해석으로 바꾸는 핵심 필드 |
| `avoidExpressions` | 후처리와 evaluator 금지 표현에 사용 |

## Content Requirements

active 항목은 최소 기준을 만족해야 한다.

| 항목 | 최소 수 |
| --- | --- |
| locale | `ko`, `en` 모두 작성 |
| aliases | locale별 3개 이상 |
| coreMeanings | locale별 3개 이상 |
| lightReadings | locale별 2개 이상 |
| shadowReadings | locale별 2개 이상 |
| sceneModifiers | locale별 3개 이상 |
| contextQuestions | locale별 2개 이상 |
| metaphorHooks | locale별 2개 이상 |
| cardTitleSeeds | locale별 2개 이상 |
| smallPrescriptions | locale별 1개 이상 |
| avoidExpressions | locale별 2개 이상 |

## Runtime Transformation

YAML 원본은 구현 단계에서 다음 형태로 변환한다.

```ts
type RuntimeSymbolEntry = {
  id: string;
  category: SymbolCategory;
  safetyLevel: SymbolSafetyLevel;
  accessTier: SymbolAccessTier;
  label: string;
  aliases: string[];
  searchText: string;
  relatedIds: string[];
  evidence: {
    coreMeanings: string[];
    lightReadings: string[];
    shadowReadings: string[];
    sceneModifiers: Record<string, SceneModifier>;
    metaphorHooks: string[];
    avoidExpressions: string[];
  };
};
```

`locale`에 맞는 localizations만 runtime entry에 펼친다. 2차 LLM에는 전체 YAML이 아니라 `RuntimeSymbolEntry`의 검색된 일부만 전달한다.

## Later DB Tables

Supabase/Postgres 이전 시 테이블은 다음으로 분리한다.

```text
symbol_entries
- id
- status
- category
- safety_level
- access_tier
- universal_meanings jsonb
- tension_axis jsonb
- related_ids text[]
- source_basis jsonb
- created_at
- updated_at

symbol_localizations
- symbol_id
- locale
- label
- aliases text[]
- search_text
- core_meanings jsonb
- light_readings jsonb
- shadow_readings jsonb
- safe_reading

symbol_scene_modifiers
- symbol_id
- locale
- modifier_key
- trigger_terms text[]
- reading
- weight

symbol_generation_assets
- symbol_id
- locale
- metaphor_hooks jsonb
- card_title_seeds jsonb
- small_prescriptions jsonb
- avoid_expressions jsonb

symbol_culture_notes
- symbol_id
- locale
- weight
- expose_by_default
- notes jsonb
- safe_transform jsonb

symbol_embeddings
- symbol_id
- locale
- chunk_type
- content
- embedding vector
- metadata jsonb
```

## Related

- [[Multilingual-Symbol-Encyclopedia]]
- [[Dream-Reading-Contracts]]
- [[RAG-Strategy-for-Dream-Reading]]

## See Also

- [[Encyclopedia-Seed-Data]] — 현재 seed 구조
- [[Dream-Reading-Quality-Safety]] — 금지 표현과 품질 기준
