---
title: Vault 운영 규칙
tags:
  - meta
---

# Vault 운영 규칙

> 마냥 꿈해몽 vault는 긴 기획서를 실행 가능한 제품 지식으로 쪼개기 위한 작업 공간이다.

---

## 레이어 구조

| 레이어 | 용도 |
| --- | --- |
| `00-Root` | 대시보드, 현재 스프린트, 메타 문서 |
| `01-Core` | 제품 비전, 타깃, 포지셔닝, MVP 범위 |
| `02-Architecture` | 시스템 구조, DB, API, 기술 결정 |
| `03-Features` | 사용자 기능 단위 스펙 |
| `04-AI-System` | LLM 파이프라인, 프롬프트, 백과 검색 |
| `05-Content` | 백과사전 seed, 고양이 말투, 카피 원칙 |
| `06-Business` | 리텐션, 수익화, KPI |
| `07-Operations` | 운영, 보안, 배포, 비용 |
| `08-Design` | UI 방향, 화면 목록, 에셋 목록 |
| `09-Implementation` | 실행 계약, Phase, 체크리스트, plans |
| `12-Journal-&-Decisions` | 결정 기록과 회고 |
| `90-Archive` | 폐기되거나 교체된 노트 |
| `99-Reference` | 원본 문서와 참고 자료 인덱스 |

---

## 노트 구조

모든 지식 노트는 다음 구조를 따른다.

```markdown
---
title: Note Title
tags:
  - layer
source: docs/manyang-dream-project-spec-updated.md
---

# Note Title

> 한 줄 요약.

---

## 본문

## Related

- [[Same-Layer-Note]]

## See Also

- [[Cross-Layer-Note]] — 설명 (레이어명)
```

---

## 링크 규칙

- `Related`에는 같은 레이어 노트만 둔다.
- `See Also`에는 다른 레이어 노트를 최대 2개만 둔다.
- 본문에는 필요한 경우에만 wikilink를 쓴다.
- 원본 기획서의 긴 내용을 그대로 복사하기보다, 결정과 실행 기준으로 압축한다.

---

## 문서 갱신 규칙

- 기능 범위가 바뀌면 `03-Features`, `08-Design`, `09-Implementation`을 함께 갱신한다.
- DB/API 계약이 바뀌면 `02-Architecture`와 `04-AI-System`을 함께 갱신한다.
- MVP 우선순위가 바뀌면 [[MVP-Scope]]와 [[Phase-Flow]]를 함께 갱신한다.
- 결정이 뒤집히면 기존 노트를 삭제하지 말고 `12-Journal-&-Decisions`에 결정 기록을 남긴다.

