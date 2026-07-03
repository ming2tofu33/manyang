---
title: Tarot Content Expansion Sprint
tags:
  - implementation
  - sprint
  - tarot
status: planned
source: Codex discussion 2026-07-03
---

# Tarot Content Expansion Sprint

> 오늘의 한 장을 78장 전체 덱으로 확장하고, 질문별 한 장 리딩을 추가해 타로 콘텐츠를 가벼운 반복 사용 루프로 만든다.

---

## Sprint Goal

타로를 단순 부가 기능이 아니라 사용자가 자주 돌아올 수 있는 짧은 리딩 콘텐츠로 확장한다.

이번 스프린트의 핵심은 **마이너 카드 이미지 자산을 먼저 사용할 수 있는 상태로 만들고**, 그 위에 78장 카드 데이터 계약, 오늘의 한 장, 질문별 한 장, 기록/공유 루프를 얹는 것이다. 3장 리딩은 무료 핵심 루프가 아니라 유료 또는 심화 리딩으로 유지한다.

## 범위

| 영역 | 이번 스프린트 방향 |
| --- | --- |
| 오늘의 한 장 | 기존 메이저 22장 중심에서 78장 전체 덱으로 확장 |
| 질문별 한 장 | 상태 선택 후 질문 5개 중 하나를 고르고 한 장을 뽑는 흐름 추가 |
| 3장 리딩 | 유료/심화 리딩으로 유지하고 무료 루프를 침범하지 않게 분리 |
| 카드 기록 | 질문, 카드, 짧은 회고를 저장해 다시 볼 수 있게 설계 |
| 공유 콘텐츠 | 질문과 카드 메시지를 공유 가능한 짧은 결과물로 정리 |

## 비범위

- 이번 스프린트에서 복잡한 커스텀 스프레드 편집기는 만들지 않는다.
- 마이너 카드까지 포함한 3장 리딩 품질 고도화는 질문별 한 장 MVP 이후로 둔다.
- 타로 해석을 RAG나 LLM 실시간 검색 기반으로 만들지 않는다. 78장 카드 의미는 버전관리 가능한 lookup 데이터로 유지한다.
- 예언, 확정적 미래 단정, 의료/법률/투자 판단처럼 고위험 조언으로 읽힐 수 있는 문장은 결과에서 제외한다.

## 현재 상태

- 런타임 타로 리딩은 메이저 카드 중심이다.
- 마이너 카드 이미지는 `frontend/public/manyang/tarot/minor/` 아래에 있으나, 현재 리딩 데이터 모델에는 통합되어 있지 않다.
- 마이너 카드 이미지는 실제 카드 뽑기 UI에 쓰기 전에 배경 제거/투명화 품질 확인이 필요하다.
- 정리된 카드 해설 문서는 `docs/tarot/` 아래에 커밋 가능한 문서로 옮겨져 있다.
- 질문별 한 장의 제품 설계와 질문 문안은 vault 문서로 분리되어 있다.

## 구현 순서

### Phase 0. 마이너 카드 누끼와 1장 뽑기 연결

- [x] 마이너 카드 원본 이미지 56장이 모두 있는지 확인한다.
- [x] 원본 이미지는 보존하고, 배경 제거된 결과물은 별도 경로에 둔다. 권장 경로: `frontend/public/manyang/tarot/minor-cutout/`.
- [x] 누끼 결과물이 모바일 카드 프레임에서 어색하지 않은지 확인한다: 카드 외곽 잘림, 흰 테두리, 그림자, 투명 배경.
- [x] 마이너 카드 이미지 경로를 런타임 asset mapping에 추가한다.
- [x] 오늘의 한 장 draw 로직이 마이너 카드 이미지를 정상 표시할 수 있게 최소 연결한다.
- [x] 테스트를 추가한다: 마이너 카드 56장 이미지 존재, 중복 카드 키 없음, 1장 뽑기에서 minor card도 렌더 가능.

완료 기준:

- [x] 마이너 카드 56장 배경 제거 산출물이 생성되어 있다.
- [x] 원본 이미지는 삭제하거나 덮어쓰지 않는다.
- [x] 오늘의 한 장에서 마이너 카드가 뽑혔을 때 이미지와 카드명이 정상 표시된다.
- [x] 기존 메이저 카드 1장 뽑기는 깨지지 않는다.

검증:

- `npm --prefix frontend test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `minor-cutout files=56 transparentRatio=5.97%-9.95%`

### Phase 1. 문서와 데이터 소스 고정

- [ ] `docs/tarot/original-major-arcana-deck-guide.md`와 `docs/tarot/original-minor-arcana-deck-guide.md`를 커밋 범위로 확정한다.
- [ ] 카드 의미 데이터의 기준 필드를 정한다: 이름, 아르카나, 슈트, 번호, 정방향, 역방향, 질문별 해석, 리딩 포인트, 이미지 경로.
- [ ] 런타임 데이터는 문서 원문을 직접 파싱하기보다 별도 TypeScript 데이터 테이블로 둔다.
- [ ] 카드별 안정 키를 정한다. 숫자 id만 쓰면 메이저/마이너 충돌 위험이 있으므로 `major:00`, `minor:wands:01` 같은 `cardKey`를 사용한다.

### Phase 2. 78장 공통 카드 모델

- [ ] `TarotMajorCard` 중심 타입을 `TarotCard` 공통 타입으로 확장한다.
- [ ] `arcana: "major" | "minor"`를 추가한다.
- [ ] 마이너 카드는 `suit: "wands" | "cups" | "swords" | "pentacles"`를 가진다.
- [ ] `deckMode: "major_only" | "minor_only" | "full_78"` 개념을 추가한다.
- [ ] 기존 저장된 메이저 카드 reading이 계속 열리도록 legacy id 호환 레이어를 둔다.
- [ ] 테스트를 추가한다: 78장 개수, 중복 `cardKey` 없음, 이미지 경로 존재, legacy major id 로드 가능.

권장 타입 초안:

```ts
type TarotArcana = "major" | "minor";
type TarotSuit = "wands" | "cups" | "swords" | "pentacles";
type TarotDeckMode = "major_only" | "minor_only" | "full_78";

type TarotCard = {
  cardKey: string;
  arcana: TarotArcana;
  suit?: TarotSuit;
  number?: number;
  nameKo: string;
  nameEn: string;
  imagePath: string;
  upright: string;
  reversed: string;
  readingPoint: string;
  questionReadings?: {
    relationship?: string;
    work?: string;
    money?: string;
    advice?: string;
  };
};
```

### Phase 3. 오늘의 한 장 78장 확장

- [ ] 오늘의 한 장 draw 로직이 `tarotMajorCards`가 아니라 `full_78` 덱을 사용할 수 있게 바꾼다.
- [ ] 저장 payload에 `cardKey`를 포함한다.
- [ ] 기존 저장 데이터에 숫자 id만 있어도 결과 화면에서 정상 표시되게 한다.
- [ ] 결과 문구는 마이너 카드가 나와도 가볍고 일상적인 톤으로 읽히게 조정한다.
- [ ] 78장 확장 후 체감 품질을 확인한다: 메이저는 큰 흐름, 마이너는 작은 상황/감정/현실 조언으로 느껴져야 한다.

### Phase 4. 질문별 한 장 MVP

- [ ] 첫 화면은 질문을 바로 나열하지 않고 상태를 먼저 고르게 한다.
- [ ] 상태 카드는 6개로 시작한다: 마음이 복잡해, 관계가 신경 쓰여, 일이 막힌 느낌이야, 돈이나 현실이 불안해, 선택을 앞두고 있어, 그냥 오늘의 신호가 궁금해.
- [ ] 상태를 고르면 질문 5개를 보여준다.
- [ ] 질문 문안은 [[Tarot-Question-Prompts]]를 기준으로 구현한다.
- [ ] 결과 화면에는 선택한 질문, 뽑은 카드, 짧은 해석, 오늘 볼 포인트를 보여준다.
- [ ] 질문별 한 장도 저장/공유 진입점을 가진다.

### Phase 5. 카드 기록과 회고

- [ ] 저장 데이터에 리딩 종류를 구분한다: `daily_one_card`, `question_one_card`, `daily_three_card`.
- [ ] 질문별 한 장은 선택 상태, 질문, 카드, 작성 시간을 저장한다.
- [ ] 사용자가 한 줄 회고를 남길 수 있게 한다.
- [ ] 기록 화면에서 오늘의 카드와 질문별 카드가 섞여 보여도 구분 가능해야 한다.
- [ ] 같은 질문을 반복해서 뽑는 UX는 과몰입을 만들 수 있으므로 제한 또는 부드러운 안내를 둔다.

### Phase 6. 공유용 콘텐츠

- [ ] 공유 결과는 짧게 만든다: 질문, 카드명, 한 문장 메시지.
- [ ] 공유 이미지는 카드 이미지가 중심이고, 앱 설명 문구는 최소화한다.
- [ ] 공유 문구는 결과 전체를 복사하는 방식보다 다시 들어오고 싶게 만드는 짧은 티저를 우선한다.
- [ ] 공유 이벤트를 기록한다: `tarot_share_clicked`, `tarot_share_completed`.

## API와 저장 계약 체크리스트

- [ ] API validator가 메이저 카드 id만 허용하는 구조인지 확인한다.
- [ ] `cardKey` 기반 저장을 추가하되 기존 숫자 id를 깨지 않게 한다.
- [ ] spread 타입에 `question_one_card`를 추가한다.
- [ ] 질문별 리딩에는 `questionKey`, `questionText`, `stateKey`를 저장한다.
- [ ] 서버에 저장하는 구조와 localStorage 구조가 달라지지 않도록 공통 타입을 둔다.

## UI 체크리스트

- [ ] 오늘의 한 장과 질문별 한 장은 서로 다른 진입점으로 둔다.
- [ ] 질문별 한 장 첫 화면은 카테고리명이 아니라 사용자 상태 문장으로 보여준다.
- [ ] 질문 선택 화면은 5개를 넘기지 않는다.
- [ ] 결과 화면은 설명이 길어지지 않게 카드 메시지, 오늘 볼 포인트, 저장/공유 CTA만 우선한다.
- [ ] 3장 리딩 CTA는 결과 하단에서 자연스럽게 연결하되 무료 결과를 빈약하게 만들지 않는다.

## 콘텐츠 품질 기준

- [ ] 정방향/역방향 문장은 번역투나 추상 명사 나열로 끝나지 않는다.
- [ ] 마이너 카드는 메이저처럼 과하게 길게 설명하지 않고, 질문 맥락에서 바로 쓸 수 있는 짧은 해석을 제공한다.
- [ ] 질문별 결과는 "정답"보다 "오늘 확인할 기준"으로 마무리한다.
- [ ] 불안 사용자를 반복 뽑기로 밀어 넣는 표현을 피한다.
- [ ] 돈, 건강, 관계 이별처럼 민감한 주제는 확정 단정 대신 점검 기준으로 쓴다.

## 완료 기준

- [x] 마이너 카드 56장 누끼 산출물이 준비되어 있다.
- [ ] 전체 78장 카드가 런타임 데이터에 존재한다.
- [ ] 오늘의 한 장이 78장 전체 덱에서 동작한다.
- [ ] 기존 메이저 카드 저장 결과가 깨지지 않는다.
- [ ] 질문별 한 장 리딩이 상태 선택, 질문 선택, 카드 결과, 저장까지 이어진다.
- [ ] 3장 리딩은 유료/심화 위치를 유지한다.
- [ ] 카드 기록에서 오늘의 한 장과 질문별 한 장을 구분해 볼 수 있다.
- [ ] focused test, lint, build를 통과한다.

## 관련 문서

- [[plans/ACTIVE_SPRINT]]
- [[Implementation-Plan]]
- [[Checklists-&-DoD]]

## See Also

- [[Tarot-Question-Based-One-Card]] — 질문별 한 장 기능 설계 (03-Features)
- [[Tarot-Question-Prompts]] — 상태별 질문 문안 (05-Content)
