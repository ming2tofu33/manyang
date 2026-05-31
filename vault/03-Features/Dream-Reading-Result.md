---
title: Dream Reading Result
tags:
  - features
  - result
source: docs/manyang-dream-project-spec-updated.md
---

# Dream Reading Result

> 꿈 요약, 상징, 백과사전 근거, 공통 해몽, 오늘의 작은 처방을 보여주고 고양이는 결과 테마로만 적용한다.

---

## 결과 구성

1. 꿈 카드 또는 꿈 영수증
2. 꿈 요약
3. 꿈속 상징
4. 백과사전 기반 해석
5. 공통 해몽 리딩
6. 오늘의 작은 처방
7. 저장/공유 버튼
8. 참고한 백과사전 항목 링크

## UX 원칙

- 결과는 “정답”이 아니라 “읽어볼 수 있는 가능성”으로 표현한다.
- 상징별 근거를 보여줘서 LLM 결과의 신뢰감을 만든다.
- 고양이 선택은 해몽 문체나 결론을 바꾸지 않고, 결과 영수증의 시각 테마만 바꾼다.
- 저장 버튼은 결과 하단뿐 아니라 카드/영수증 근처에도 둔다.

## 작은 처방 예시

```text
새로운 일을 시작하기 전에, 지금 가장 불안한 준비물 하나를 먼저 확인해보자냥.
```

## 완료 기준

- 분석 결과가 카드와 텍스트 영역에 모두 표시된다.
- 참고한 백과사전 항목으로 이동할 수 있다.
- 저장 완료 후 기록 화면에서 다시 볼 수 있다.

## Related

- [[Dream-Entry]]
- [[Dream-Receipt-&-Card]]
- [[Dream-Encyclopedia]]

## See Also

- [[Prompt-Guides]] — 결과 생성 프롬프트 (04-AI-System)
- [[Safety-&-Compliance]] — 금지 표현 기준 (07-Operations)
