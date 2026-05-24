---
title: Phase Flow
tags:
  - implementation
  - phase
source: docs/manyang-dream-project-spec-updated.md
---

# Phase Flow

> Phase는 기능 목록이 아니라 Gate를 통과하기 위한 순서다.

---

## Phase 0. 콘셉트와 계약 확정

목표:

- vault 정리
- 대표 고양이 해몽사 1마리 설정
- 백과사전 초기 항목 30개 구조 확정
- LLM 출력 JSON schema 확정
- MVP 화면 우선순위 확정

완료 기준:

- [[MVP-Scope]], [[LLM-Pipeline]], [[Screen-Inventory]]가 서로 충돌하지 않는다.

## Phase 1. Prototype MVP

목표:

- Next.js 프로젝트 생성
- 모바일 앱형 shell 구현
- 로컬 seed 백과사전 연결
- mock 분석 API 구현
- 꿈 입력 → 결과 → 저장 → 기록 조회 루프 구현

완료 기준:

- 외부 API 없이 핵심 루프가 동작한다.

## Phase 2. Real AI MVP

목표:

- LLM 구조화 분석 API 연결
- 백과사전 매칭 로직 연결
- 최종 해몽 생성
- 안전 표현 검사

완료 기준:

- 10개 샘플 꿈에서 JSON parse 실패 없이 결과 생성.

## Phase 3. Persistence MVP

목표:

- Supabase 연결
- dream_entries, dream_analyses, dream_cards 저장
- 기록/달력 실제 데이터 조회

완료 기준:

- 새로고침 후에도 기록이 유지된다.

## Phase 4. Beta Polish

목표:

- 백과 전체/상세 화면
- 아침 기분 기록 강화
- 공유 이미지 optional
- 5~10명 테스트

완료 기준:

- 테스트 사용자 피드백으로 다음 개선 목록 작성.

## Related

- [[Implementation-Plan]]
- [[Checklists-&-DoD]]
- [[plans/ACTIVE_SPRINT]]

## See Also

- [[MVP-Scope]] — Phase 범위 기준 (01-Core)
- [[KPI-Gates]] — Phase 이후 검증 지표 (06-Business)

