<p align="center">
  <img src="frontend/public/manyang/social/og-blackcat.jpg" alt="마냥 꿈해몽" width="720" />
</p>

# 마냥 꿈해몽

어젯밤 꿈을 적으면, 고양이 해몽사가 꿈속 상징을 백과사전에서 찾아 읽어주고  
작은 꿈 영수증과 기록으로 남겨주는 AI 꿈 리딩 토이 프로젝트입니다.

> [!NOTE]
> 이 프로젝트의 해몽은 오락과 자기 성찰을 위한 감성 리딩입니다. 의학적, 심리학적 진단이나 전문 상담을 대체하지 않습니다.

## 이런 걸 만들고 있어요

마냥 꿈해몽은 단순히 LLM에게 “이 꿈 무슨 뜻이야?”라고 묻는 앱이 아닙니다.

꿈에 나온 장면에서 상징을 찾고, 자체 꿈 해몽 백과사전과 RAG 검색을 거친 뒤, 고양이 해몽사 페르소나가 결과를 부드럽게 읽어줍니다.

```text
꿈 입력
-> 안전 정책 확인
-> 꿈 구조 분석
-> 상징 백과사전 매칭
-> RAG 근거 검색
-> 고양이 해몽사 리딩
-> 꿈 영수증 / 기록 저장
```

## 지금 들어있는 것

- 꿈 입력 및 AI 해몽 결과 생성
- 자체 꿈 상징 백과사전
- RAG 기반 상징 검색과 evidence gate
- 고양이 해몽사 페르소나
- 꿈 영수증 / 공유 결과
- 꿈 아카이브와 달력
- 꿈을 기억하지 못한 날의 아침 기록
- 데일리 타로와 공유 결과
- Supabase 기반 기록 저장
- 선택형 한국어 형태소 분석 서비스

## 프로젝트 구조

```text
manyang/
├─ frontend/                 # Next.js 앱
├─ backend/                  # 꿈 분석, RAG, LLM, 백과사전 로직
├─ services/korean-analyzer/ # Kiwi 기반 한국어 형태소 분석 HTTP 서비스
├─ supabase/                 # DB 마이그레이션
├─ docs/                     # 기획, 운영, 설계 문서
├─ vault/                    # 제품/콘텐츠/아키텍처 지식 베이스
└─ output/                   # 로컬 생성 결과물
```

## 로컬에서 실행하기

### 1. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

기본 설정은 mock 분석 모드라서 OpenAI 키 없이도 주요 화면을 확인할 수 있습니다.

### 2. 백엔드 테스트

```bash
cd backend
npm install
npm test
```

타입 체크가 필요하면:

```bash
npm run typecheck
```

### 3. 한국어 분석 서비스

이 서비스는 선택 사항입니다. 켜두면 한국어 어미 변화가 있는 표현도 더 잘 잡습니다.

```bash
cd services/korean-analyzer
npm install
npm run fetch-model
npm start
```

그 다음 `frontend/.env`에 연결합니다.

```env
MANYANG_LEMMATIZER_URL=http://localhost:8080
```

## 환경 변수

프론트엔드는 `frontend/.env.example`을 기준으로 설정합니다.

```bash
cd frontend
cp .env.example .env
```

주요 모드는 두 가지입니다.

```env
# OpenAI 없이 deterministic mock 결과 사용
MANYANG_ANALYSIS_MODE=mock

# 실제 LLM 분석 사용
MANYANG_ANALYSIS_MODE=llm
OPENAI_API_KEY=sk-...
MANYANG_OPENAI_MODEL=gpt-5-mini
```

Supabase를 연결하려면 아래 값도 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
```

## 자주 쓰는 명령어

| 위치 | 명령어 | 설명 |
| --- | --- | --- |
| `frontend` | `npm run dev` | Next.js 개발 서버 실행 |
| `frontend` | `npm run build` | 프로덕션 빌드 |
| `frontend` | `npm test` | 프론트엔드 테스트 |
| `frontend` | `npm run lint` | ESLint 실행 |
| `backend` | `npm test` | 백엔드 테스트 |
| `backend` | `npm run typecheck` | TypeScript 타입 체크 |
| `backend` | `npm run build:rag-index` | 꿈 RAG 벡터 인덱스 생성 |
| `backend` | `npm run eval:retrieval` | 검색 품질 평가 |
| `services/korean-analyzer` | `npm start` | 한국어 분석 서버 실행 |

## 기술 스택

- Next.js
- React
- TypeScript
- Supabase
- Vitest
- OpenAI API
- Kiwi NLP
- Tailwind CSS

## 더 읽어볼 문서

- [프로젝트 기획서](docs/manyang-dream-project-spec-updated.md)
- [Dream RAG 시스템 개요](docs/dream-rag-system-overview.md)
- [Dream RAG 운영 흐름](docs/dream-rag-operation-flow.md)
- [상징 백과사전 가이드](docs/dream-encyclopedia-guide.md)
- [관리자 접근 정책](docs/admin-access.md)

## 작은 메모

이 저장소는 완성된 제품이라기보다, “꿈을 기록하고 다시 꺼내보는 경험”을 실험하는 작업실에 가깝습니다.

그래서 코드 안에는 UI 실험, RAG 품질 테스트, 상징 백과 확장, 타로 리딩, 공유 이미지 같은 흔적이 같이 남아 있습니다. 핵심은 하나입니다.

> 사라지는 꿈을 그냥 흘려보내지 않고, 상징과 카드와 작은 기록으로 남겨보기.
