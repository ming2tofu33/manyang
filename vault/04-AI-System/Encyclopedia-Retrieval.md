---
title: Encyclopedia Retrieval
tags:
  - ai-system
  - retrieval
source: docs/manyang-dream-project-spec-updated.md
---

# Encyclopedia Retrieval

> MVP에서는 문자열 매칭으로 시작하고, 이후 embedding과 pgvector로 확장한다.

---

## MVP 검색 방식

1. LLM이 추출한 `symbols`를 정규화한다.
2. `dream_encyclopedia.symbol`과 정확 매칭한다.
3. 정확 매칭이 없으면 `related_symbols`에서 찾는다.
4. 그래도 없으면 카테고리별 가까운 후보를 사용한다.

## 정규화 규칙

- 공백 제거
- 조사 제거는 MVP에서는 과하게 하지 않는다.
- “교실을 찾기”처럼 행동이 섞인 후보는 `교실`, `찾기`로 나눌 수 있다.
- 같은 의미의 표현은 seed 데이터에서 aliases로 관리한다.

## 확장 방식

- 백과사전 항목에 embedding 저장
- 꿈 요약과 상징 후보를 embedding해 유사 항목 검색
- pgvector로 top-k 검색
- 사용자별 상징 히스토리를 랭킹에 반영

## Related

- [[RAG-Strategy-for-Dream-Reading]]
- [[Multilingual-Symbol-Encyclopedia]]
- [[LLM-Pipeline]]
- [[Prompt-Guides]]

## See Also

- [[Dream-Encyclopedia]] — 사용자-facing 백과 기능 (03-Features)
- [[Encyclopedia-Seed-Data]] — seed 데이터 구조 (05-Content)
