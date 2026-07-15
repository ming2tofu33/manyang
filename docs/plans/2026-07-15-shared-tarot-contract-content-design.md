# Shared Tarot Contract and Content Design

**Date:** 2026-07-15
**Status:** Approved
**Product context:** 고양이가 읽어주는 감성 운세·리딩 서비스의 웹·React Native 공용 기반

## Goal

웹과 향후 React Native 앱이 같은 타로 타입, 78장 카드 데이터, 질문 문구를 한 번만 관리하도록 공용 패키지로 분리한다. 웹과 앱 어느 쪽도 원본이 되지 않으며, 모노레포의 공용 패키지가 제품 데이터의 원본이 된다.

이번 작업은 내부 소스 오브 트루스를 정리하는 스프린트다. 현재 웹 UI, API 요청·응답, 저장된 리딩, 카드 뽑기 규칙은 바꾸지 않는다.

## Decisions

- 타로 전송 계약은 `@manyang/contracts`가 소유한다.
- 78장 카드 데이터와 질문 문구는 새 `@manyang/content` 패키지가 소유한다.
- 공용 콘텐츠에는 웹 URL이나 React Native `require()`를 넣지 않고 안정적인 `imageKey`만 저장한다.
- 웹은 별도 어댑터에서 `imageKey`를 현재 `manyangAssets` URL로 변환한다.
- React Native 앱은 후속 스프린트에서 같은 `imageKey`를 네이티브 이미지 에셋으로 변환한다.
- 기존 웹 모듈 경로와 공개 함수는 호환 레이어로 유지한다.
- 정적 콘텐츠는 초기에는 패키지에 번들한다. 앱 업데이트 없이 자주 바꿔야 할 운영 콘텐츠가 생기면 후속 단계에서 서버 API 또는 CMS를 검토한다.

## Approaches Considered

### Separate contracts and content packages — selected

타입·전송 경계와 실제 카드·질문 데이터를 분리한다. 의존 방향이 명확하고, 이후 domain과 API client를 추가하기 쉽다.

### Single tarot-core package

초기 파일 수는 적지만 타입, 콘텐츠, 규칙, 저장 어댑터가 다시 한 패키지에 섞일 가능성이 높아 선택하지 않았다.

### Server-first content API

앱 배포 없이 콘텐츠를 바꿀 수 있지만 현재 단계에서는 DB 스키마, 관리 도구, 캐시, 장애 대응이 필요해 과도하다. 정적 공용 패키지 이후의 확장 옵션으로 남긴다.

## Target Architecture

```text
manyang/
├─ packages/
│  ├─ contracts/
│  │  └─ src/
│  │     └─ tarot.ts
│  └─ content/
│     └─ src/
│        └─ tarot/
│           ├─ major.ts
│           ├─ minor.ts
│           ├─ questions.ts
│           └─ index.ts
├─ frontend/
│  └─ src/lib/
│     ├─ tarot-major-cards.ts      # web compatibility adapter
│     ├─ tarot-minor-cards.ts      # web compatibility adapter
│     ├─ tarot-cards.ts            # existing combined web API
│     └─ tarot-question-prompts.ts # content re-export + web helper
└─ backend/
   └─ src/                         # AI execution; shared contract consumer
```

Dependency direction:

```text
@manyang/content  ──> @manyang/contracts
frontend          ──> @manyang/content + @manyang/contracts
backend           ──> @manyang/contracts
mobile (later)    ──> @manyang/content + @manyang/contracts
```

`@manyang/contracts` and `@manyang/content` must not depend on frontend, backend, Next.js, React, DOM, or browser storage.

## Contract Package

`packages/contracts/src/tarot.ts` contains the platform-neutral public tarot contract. Existing values remain unchanged.

Expected runtime value sets and derived types include:

- spread: `daily_one_card`, `question_one_card`, `daily_three_card`
- orientation: `upright`, `reversed`
- position: `today`, `situation`, `flow`, `advice`
- unlock method: `daily_free`, `rewarded_ad`, `moon_pass`, `admin`
- question context
- selected card and generated card reading shapes
- tarot reading request and response transport shapes needed by web and backend

Types should derive from readonly runtime constants where validation also needs the values. The contract must preserve current API payload names and optionality.

## Content Package

`@manyang/content` owns static tarot content:

- 22 major arcana records
- 56 minor arcana records
- combined 78-card lookup
- six question states and their question prompts
- lookup helpers that depend only on the static content

The platform-neutral card record contains content fields such as:

```ts
type TarotCardContent = {
  id: number;
  cardKey: string;
  imageKey: string;
  arcana: "major" | "minor";
  slug: string;
  nameKo: string;
  nameEn: string;
  keywords: readonly string[];
  visualSymbols: readonly string[];
  symbolMeanings: readonly TarotCardSymbolMeaning[];
  mood: string;
  upright: TarotCardMeaning;
  reversed: TarotCardMeaning;
  contexts: {
    love: string;
    career: string;
    money: string;
    general: string;
  };
};
```

Minor-only suit and rank fields remain available. Major and minor numeric ID compatibility remains unchanged, while `cardKey` is the stable cross-platform identity.

## Image Asset Boundary

The content package stores only `imageKey`. It does not import `manyangAssets` and does not contain `/public` URLs.

Web flow:

```text
TarotCardContent(imageKey)
→ web asset resolver
→ existing web TarotCard(image URL)
→ current UI, API route, localStorage
```

Future mobile flow:

```text
TarotCardContent(imageKey)
→ native asset resolver
→ React Native image source
```

The web resolver must cover every shared `imageKey`. Missing or duplicate keys fail tests before runtime.

## Web Compatibility Layer

Existing imports should not require a broad UI rewrite in this sprint.

- `tarot-major-cards.ts` reads shared major content and attaches web image URLs.
- `tarot-minor-cards.ts` reads shared minor content and attaches web image URLs.
- `tarot-cards.ts` keeps the existing 78-card lookup API and legacy numeric ID behavior.
- `tarot-question-prompts.ts` re-exports shared question states and types.
- Custom-question normalization and stable hashing remain outside static content unless moving them is required only to preserve the current public API. Their behavior must not change.
- `daily-tarot.ts` keeps browser storage, events, subscriptions, and draw behavior in the web layer for this sprint.

Existing serialized readings keep their current `id`, `cardKey`, `image`, spread, question context, and generated reading fields.

## Data Flow

```text
Shared contracts ───────────────┐
                               ├─> Web API and UI
Shared tarot content ─> Web adapter
                               └─> Existing storage and share payloads

Shared contracts ─────────────────> Backend AI service

Shared contracts + content ───────> React Native app (later)
```

The backend remains responsible for AI generation and server persistence. User records, relationship state, currency, and purchases remain server/Supabase source-of-truth data and are not part of this content package.

## Error Handling and Validation

Static content errors must be caught during tests or build, not when a user draws a card.

- exactly 22 major and 56 minor cards
- exactly 78 combined cards
- unique `cardKey`
- unique `imageKey` where one-to-one mapping is required
- every shared `imageKey` resolves to a web asset
- valid arcana, suit, rank, spread, orientation, position, and unlock values
- unique question-state keys and question keys within each state
- no browser globals or framework imports in shared packages

API validators should use the shared runtime constants without changing accepted or rejected payloads.

## Testing Strategy

### Contracts

- runtime constants expose the current accepted values once
- derived types compile for current request and response fixtures
- public export boundary tests prevent web/backend definitions from drifting

### Content

- 22/56/78 card counts
- unique card keys and lookup consistency
- stable major/minor legacy lookup behavior
- question-state and prompt-key uniqueness
- no `window`, `document`, `localStorage`, Next.js, React, or backend imports

### Web compatibility

- every image key maps to the existing web asset
- current card lookup results retain image URLs and public field shapes
- current daily tarot, question tarot, three-card, storage, share, and API route tests remain green
- compatibility boundary tests ensure card definitions and question text are no longer duplicated in frontend files

### Repository

- root tests and typechecks
- frontend lint and production build
- `git diff --check`

## Scope

Included:

- shared tarot contract
- shared 78-card content source
- shared question-state and prompt content
- image-key model and web asset adapter
- compatibility imports and boundary tests

Not included:

- changing draw probabilities or deck modes
- separating `localStorage` and browser events
- redesigning API payloads
- changing card copy at scale
- reflection notes and archive UI changes
- relationship, moon-piece, purchase, or Moon Pass implementation
- Expo client creation
- CMS or database-backed content delivery

## Completion Criteria

- `@manyang/contracts` is the source of truth for public tarot transport values and types.
- `@manyang/content` is the source of truth for all 78 card records and question prompts.
- shared packages contain no platform-specific imports or browser globals.
- the web resolves every shared image key and preserves current public card objects.
- existing API payloads, stored readings, routes, and UI behavior remain unchanged.
- all focused and repository-level verification passes.

## Follow-up Order

1. Separate pure tarot draw/domain rules from browser storage.
2. Split browser storage adapters for tarot and selected cat.
3. Implement relationship domain and server persistence.
4. Add cookie/Bearer unified API authentication.
5. Add app-only moon-piece ledger and purchase-verification contracts.
6. Create the Expo client foundation.
