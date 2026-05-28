---
title: Asset Inventory
tags:
  - design
  - assets
source: docs/manyang-dream-project-spec-updated.md
---

# Asset Inventory

> UI 전체 이미지와 실제 구현용 분리 에셋을 구분해야 한다.

---

## 제작 방향이 잡힌 에셋

- 고양이 해몽사 일러스트
- 수정구슬 orb
- 고양이 말풍선
- dream receipt 템플릿
- UI 참고용 화면 이미지

## 추가로 필요한 에셋

- 하단 내비게이션 전용 아이콘 세트
- 백과 상징 아이콘 세트
- 빈 텍스트 없는 꿈 영수증 템플릿
- 텍스트 없는 카드/패널 프레임
- 감정/기분 아이콘 세트
- 로딩용 꿈 조각 아이콘
- 상징 카테고리 아이콘
- 꿈 카드 프레임
- 사라진 꿈의 발자국 카드 프레임
- 기록 없음 상태 고양이 일러스트
- 분석 실패/오류 상태 일러스트

## 구현 원칙

- 배경이 없는 독립 에셋과 화면 합성용 에셋을 분리한다.
- UI 전체 이미지는 개발 참고용으로만 사용한다.
- 실제 구현에는 배경, 캐릭터, 아이콘, 카드 프레임을 가능한 한 분리한다.
- MVP에서는 CSS로 재현 가능한 장식은 이미지로 만들지 않는다.

## 제작 브리프

- [[Asset-Generation-Brief]]

## Related

- [[Frontend-Optimization-Asset-Classification-2026-05-28]]
- [[Visual-Direction]]
- [[Screen-Inventory]]
- [[Layout-Contract]]

## See Also

- [[Dream-Receipt-&-Card]] — 카드/영수증 에셋 사용처 (03-Features)
