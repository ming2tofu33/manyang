---
title: Dream Receipt & Card
tags:
  - features
  - card
source: docs/manyang-dream-project-spec-updated.md
---

# Dream Receipt & Card

> 꿈 카드는 저장형 결과물, 꿈 영수증은 공유형 결과물이다.

---

## 꿈 카드

꿈 해석 결과를 소장 가능한 카드로 만든다.

### 구성

- 카드명
- 고양이 또는 상징 일러스트 영역
- 꿈 키워드
- 짧은 해석
- 오늘의 작은 처방
- 해몽사 이름
- 생성 날짜

## 꿈 영수증

하루의 꿈을 짧게 요약해 공유하기 쉬운 결과물로 만든다.

### 구성

- Dream Receipt 타이틀
- 꿈 제목
- 날짜와 기분
- 주요 상징
- 꿈 분위기
- 고양이 해석
- 오늘의 작은 처방
- From. 고양이 해몽사

## MVP 구현 방식

- 이미지 생성 모델을 쓰지 않는다.
- HTML/CSS 템플릿에 텍스트를 렌더링한다.
- 저장 이미지는 1차 MVP에서는 optional로 둔다.

## Related

- [[Dream-Entry]]
- [[Dream-Reading-Result]]
- [[Dream-Archive-&-Calendar]]

## See Also

- [[Visual-Direction]] — 영수증/카드 비주얼 방향 (08-Design)
- [[Database-Schema]] — 저장 데이터 구조 (02-Architecture)

