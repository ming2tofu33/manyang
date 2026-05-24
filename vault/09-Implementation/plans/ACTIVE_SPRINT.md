---
title: Active Sprint
tags:
  - implementation
  - sprint
status: active
---

# Active Sprint

> 현재 목표: 문서 vault를 기준으로 프로젝트를 시작할 수 있는 Phase 0/1 작업을 정리한다.

---

## Sprint Goal

마냥 꿈해몽의 긴 기획서를 실행 가능한 vault로 분리하고, 바로 Next.js MVP를 시작할 수 있는 작업 순서를 만든다.

## Tasks

| ID | 제목 | 상태 | 우선순위 | 완료 기준 |
| --- | --- | --- | --- | --- |
| DOC-01 | 원본 기획서 vault 분리 | done | P0 | 레이어별 노트와 인덱스 생성 |
| DOC-02 | MVP 실행 계획 작성 | done | P0 | 상세 plan 파일 생성 |
| SETUP-01 | Next.js 프로젝트 생성 | done | P0 | 앱 실행, 첫 화면 표시 |
| UI-01 | 모바일 shell과 홈 화면 | done | P0 | 홈 CTA와 하단 nav 구현 |
| UI-02 | 핵심 메뉴 화면 1차 구현 | done | P0 | 꿈쓰기/기록/백과/아침기분/로딩/결과 화면 라우팅 |
| ASSET-01 | 분리 에셋 제작 요청서 | done | P1 | 필요한 이미지 에셋과 생성 가이드 정리 |
| BE-01 | backend mock 도메인 모듈 분리 | done | P0 | seed, matcher, mock analyzer, 테스트 구현 |
| DATA-01 | 백과사전 seed 10개 구현 | doing | P0 | backend seed 구현 완료, 프론트 목록 렌더링 연결 대기 |
| AI-01 | mock 분석 API 구현 | done | P0 | `POST /api/dreams/analyze`가 mock analyzer 결과 JSON 반환 |
| FLOW-01 | 입력→결과→저장→기록 루프 | todo | P0 | localStorage 기반 end-to-end |

## Current Plan

- [[plans/2026-05-24-mvp-foundation|MVP Foundation Plan]]
- [[../../../docs/plans/2026-05-24-backend-mock-analysis|Backend Mock Analysis Plan]]

## Notes

- 먼저 Prototype Mode로 시작한다.
- Supabase와 실제 LLM API는 UI 루프가 통과한 뒤 붙인다.
- 참고 이미지는 `ref/` 폴더에 있다.

## Evidence

- SETUP-01: `frontend/` 생성 완료, `npm run lint` 통과, `npm run build` 통과.
- UI-01: `frontend/src/app/page.tsx` 기본 Next 화면을 마냥 홈 셸로 교체, `http://127.0.0.1:3000` 브라우저 스냅샷에서 제목/CTA/하단 내비게이션 확인. Screenshot: `manyang-home-mobile.png`.
- UI-02: `frontend/src/app/write`, `/archive`, `/encyclopedia`, `/morning`, `/loading`, `/result` 1차 화면 구현. Mobile screenshots: `manyang-today-v4.png`, `manyang-write-mobile-v4.png`, `manyang-archive-mobile-v4.png`, `manyang-encyclopedia-mobile-v4.png`.
- ASSET-01: [[../../08-Design/Asset-Generation-Brief|Asset Generation Brief]] 작성.
- BE-01: `backend/` TypeScript 도메인 모듈 생성. `encyclopediaEntries`, `findMatchingSymbols`, `analyzeDream` 구현. `npm test`, `npm run typecheck` 통과.
- AI-01: `frontend/src/app/api/dreams/analyze/route.ts` 생성. `@manyang/backend` 로컬 패키지를 Next route handler에서 호출. `frontend`의 `npm test`, `npm run lint`, `npm run build` 통과.
- Verification: `npm test`, `npm run lint`, `npm run build` 통과.
- Dev server: `http://127.0.0.1:3000` 응답 확인.
