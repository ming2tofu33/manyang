---
title: Visual Direction
tags:
  - design
  - visual
source: docs/manyang-dream-project-spec-updated.md
---

# Visual Direction

> 일반 앱보다 작은 꿈 해몽방에 들어온 느낌. 어둡고 신비롭지만 정보는 읽혀야 한다.

---

## 키워드

- 달빛
- 밤
- 꿈
- 고양이
- 카드
- 백과사전
- 작은 방
- 수정구슬
- 조용한 아카이브

## 색감

- 짙은 남색/검정 배경
- 보랏빛 계열 포인트
- 따뜻한 골드 라인과 텍스트
- 부드러운 핑크/살구색 보조

## UI 원칙

- 모바일 앱형 레이아웃을 우선한다.
- 배경 이미지는 분위기를 만들되 텍스트 가독성을 해치지 않는다.
- 카드, 영수증, 백과 항목은 소장품처럼 보여야 한다.
- 고양이는 귀엽지만 너무 유치하지 않게 유지한다.

## 참고 이미지

- 홈: `ref/home.png`
- 분석 중: `ref/interpretation.png`
- 꿈 영수증: `ref/dreamreceipt.png`
- 기록/달력: `ref/dreamcalendar.png`
- 백과: `ref/encyclopedia.png`

## Layout Contract

- 에셋 기반 UI는 일반 반응형 웹 레이아웃이 아니라 기준 캔버스와 보호 영역을 가진 모바일 stage로 관리한다.
- 기준 아트보드는 `390 x 844`로 두고, `375 x 667`, `390 x 844`, `430 x 932`에서 함께 검수한다.
- 배경, 효과, 버튼, 푸터는 같은 좌표계 위에서 움직여야 한다. 배경은 `object-cover`로 잘리는데 효과와 CTA만 viewport 기준으로 고정하면 실제 모바일에서 위치가 어긋난다.
- 화면별 스크롤 정책, 보호 영역, CTA 위치, 에셋 제작 규칙은 [[Layout-Contract]]를 따른다.
- 홈, 꿈쓰기, 꿈 씨앗, 꿈의 발자국, 기록, 백과, 결과 화면은 각각 다른 레이아웃 유형을 가지므로 한 화면에서 맞춘 임의 값을 다른 화면에 그대로 복사하지 않는다.

## Related

- [[Screen-Inventory]]
- [[Asset-Inventory]]
- [[Layout-Contract]]

## See Also

- [[Project-Vision]] — 시각 방향의 제품 근거 (01-Core)
- [[Dream-Receipt-&-Card]] — 결과물 비주얼 기능 (03-Features)
