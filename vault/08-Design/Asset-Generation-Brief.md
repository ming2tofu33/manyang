---
title: Asset Generation Brief
tags:
  - design
  - assets
  - prompt
status: request
---

# Asset Generation Brief

> 현재 프로토타입은 코드와 기존 참고 이미지만으로 동작한다. 실제 제품 질감을 올리려면 아래 분리 에셋이 필요하다.

---

## 공통 생성 규칙

- 스타일: dark moonlit cat dream oracle room, antique gold line art, deep violet accent, subtle glow.
- 배경: transparent background 또는 단색 배경 없는 PNG/SVG.
- 금지: 텍스트, 한국어 라벨, 완성된 UI 화면, 버튼 문구, 워터마크.
- 크기: 아이콘은 1024x1024 PNG 또는 SVG, 프레임/영수증은 2x 이상 해상도.
- 형태: 중앙 정렬, 동일한 선 두께, UI에서 잘려도 어색하지 않게 충분한 여백.

## 요청 1: 하단 내비게이션 아이콘

필요 수량: 4개.

- 오늘: 초승달 또는 달과 작은 별
- 꿈쓰기: 깃펜 또는 펜
- 기록: 클립보드/영수증
- 백과: 열린 책

생성 프롬프트 예시:

```text
transparent background, antique gold line icon of a crescent moon with tiny stars, dark dream oracle app style, consistent 2px stroke, subtle violet glow, centered, no text, no UI frame
```

## 요청 2: 꿈 영수증 빈 템플릿

필요 수량: 1개.

- 세로형 종이/영수증 템플릿
- 찢긴 가장자리 또는 오래된 양피지 질감
- 텍스트 영역은 비워두기
- 코드에서 날짜, 제목, 해몽 문구를 올릴 수 있어야 함

생성 프롬프트 예시:

```text
blank vertical dream receipt paper, antique parchment, slightly torn edges, warm candlelit texture, transparent background, no text, no symbols, no watermark, mobile app asset, 2x resolution
```

## 요청 3: 상징 아이콘 세트

필요 수량: 우선 10개.

- 복도, 신발, 비, 고양이, 문, 학교, 계단, 바다, 창문, 엘리베이터

생성 프롬프트 예시:

```text
transparent background, antique gold and muted violet line icon of a corridor in a dream, mystical but simple, centered, consistent stroke, no text, no label, mobile UI asset
```

## 요청 4: 카드/패널 프레임

필요 수량: 3개.

- 꿈 기록 카드 프레임
- 백과 상징 카드 프레임
- 사라진 꿈 발자국 카드 프레임

생성 프롬프트 예시:

```text
transparent background, ornate thin antique gold frame for a dark dream card, rounded rectangle, subtle violet glow, empty center, no text, no icons, scalable mobile UI asset
```

## 요청 5: 감정/기분 아이콘

필요 수량: 6개.

- 편안, 불안, 조급, 신기, 흐릿, 졸림

생성 프롬프트 예시:

```text
transparent background, small mystical mood icon for calm feeling, antique gold line art, soft violet accent, centered, no text, consistent style with dream oracle cat app
```

## 우선순위

| 순위 | 에셋 | 이유 |
| --- | --- | --- |
| 1 | 하단 내비게이션 아이콘 | 모든 화면에서 반복 노출 |
| 2 | 상징 아이콘 세트 | 백과/결과/기록에서 반복 사용 |
| 3 | 꿈 영수증 빈 템플릿 | 결과 화면의 핵심 공유물 |
| 4 | 카드/패널 프레임 | CSS 대체 가능하지만 완성도 향상 |
| 5 | 감정/기분 아이콘 | 선택 UI의 감성 강화 |

## Related

- [[Asset-Inventory]]
- [[Visual-Direction]]
- [[Screen-Inventory]]
