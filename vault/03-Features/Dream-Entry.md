---
title: Dream Entry
tags:
  - features
  - dream-entry
source: docs/manyang-dream-project-spec-updated.md
---

# Dream Entry

> 사용자가 기억나는 꿈을 자유롭게 입력하는 첫 번째 핵심 화면.

---

## 목적

사용자가 어젯밤 꿈을 짧거나 뒤죽박죽이어도 부담 없이 입력하게 한다.

## 입력 요소

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| 꿈 내용 | 예 | 자유 텍스트 |
| 꿈 날짜 | 아니오 | 기본값 오늘 |
| 깼을 때 기분 | 아니오 | 불안, 편안, 조급함 등 |
| 꿈 분위기 | 아니오 | 이상함, 따뜻함, 어두움 등 |
| 가장 기억나는 장면 | 아니오 | 상징 추출 보조 |

## UX 문구

```text
어젯밤 꿈을 들려달라냥.
짧아도 괜찮고, 뒤죽박죽이어도 괜찮다냥.
```

## 완료 기준

- 꿈 원문을 1자 이상 입력하면 분석 CTA가 활성화된다.
- 입력 중 사용자가 이탈하지 않도록 화면은 모바일 한 화면 안에서 집중된다.
- “기억나지 않아요” 흐름으로 언제든 전환할 수 있다.

## Related

- [[Dream-Reading-Result]]
- [[Morning-Mood-Flow]]
- [[Dream-Receipt-&-Card]]

## See Also

- [[LLM-Pipeline]] — 입력 이후 분석 흐름 (04-AI-System)
- [[Screen-Inventory]] — 연결 화면 목록 (08-Design)

