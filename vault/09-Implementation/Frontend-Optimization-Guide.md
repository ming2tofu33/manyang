---
title: Frontend Optimization Guide
tags:
  - implementation
  - frontend
  - performance
  - optimization
status: draft
updated: 2026-05-29
---

# Frontend Optimization Guide

> 마냥 꿈해몽의 프론트엔드 최적화 기준 문서. 이 프로젝트는 일반 웹앱보다 에셋 기반 모바일 앱에 가까우므로, 속도뿐 아니라 애니메이션 체감, 이미지 용량, 모바일 레이아웃 안정성을 함께 최적화한다.

---

## 최적화 목표

| 영역 | 목표 | 주요 지표 |
| --- | --- | --- |
| Loading Performance | 첫 화면이 빠르게 뜬다 | LCP, FCP, 이미지 총량, request 수 |
| Runtime Performance | 홈 효과와 화면 전환이 버벅이지 않는다 | INP, long task, frame drop, CPU usage |
| Layout Stability | 실제 모바일에서 버튼과 에셋 위치가 어긋나지 않는다 | CLS, screenshot diff, 가로/세로 스크롤 |
| Bundle Health | 불필요한 JS와 client boundary를 줄인다 | route JS size, client component 수 |
| Asset Hygiene | reference 에셋과 runtime 에셋을 분리한다 | public payload, unused large assets |

## 최적화 원칙

1. 측정 전에는 수정하지 않는다.
2. 가장 큰 병목부터 해결한다.
3. 시각 품질을 깨는 압축은 하지 않는다.
4. 에셋 기반 UI에서는 레이아웃 안정성도 성능으로 본다.
5. 모바일 기준으로 먼저 검증하고 데스크톱은 보조로 본다.
6. `prefers-reduced-motion` 대응은 유지한다.
7. 수정 전후 수치를 문서에 남긴다.

## Baseline 측정 절차

### 1. Production build 확인

```bash
cd frontend
npm run build
npm run start
```

### 2. 모바일 viewport 스크린샷

아래 세 뷰포트는 모든 주요 화면에서 반복 확인한다.

| Viewport | 목적 |
| --- | --- |
| `375 x 667` | 작은 폰, 브라우저 UI가 공간을 많이 차지하는 상황 |
| `390 x 844` | 기준 캔버스 |
| `430 x 932` | 큰 폰, 여백이 벌어지는 상황 |

예시:

```bash
npx playwright screenshot --viewport-size=375,667 --wait-for-timeout=1800 "http://127.0.0.1:3000/" "..\output\playwright\opt-home-375x667-before.png"
npx playwright screenshot --viewport-size=390,844 --wait-for-timeout=1800 "http://127.0.0.1:3000/" "..\output\playwright\opt-home-390x844-before.png"
npx playwright screenshot --viewport-size=430,932 --wait-for-timeout=1800 "http://127.0.0.1:3000/" "..\output\playwright\opt-home-430x932-before.png"
```

### 3. 이미지 용량 확인

```powershell
Get-ChildItem -Path frontend\public\manyang -Recurse -File |
  Sort-Object Length -Descending |
  Select-Object -First 30 FullName,Length
```

### 4. 코드 후보 확인

```bash
rg -n "unoptimized|Image|use client|useSyncExternalStore|animation|object-cover|100dvh|setTimeout|useEffect" frontend/src -g "*.tsx" -g "*.ts" -g "*.css"
```

### 5. 브라우저 측정

- Lighthouse mobile
- Chrome DevTools Performance
- Network waterfall
- Coverage
- Vercel production screenshot

## 현재 의심 병목

| 우선순위 | 후보 | 근거 | 먼저 볼 것 |
| --- | --- | --- | --- |
| P0 | 큰 PNG 에셋 | `public/manyang`에 2MB~3MB대 PNG 다수 | 홈 배경, 버튼 프레임, 푸터, receipt |
| P0 | `unoptimized` 이미지 | 많은 `next/image`가 최적화를 우회 | 꼭 필요한 곳과 제거 가능한 곳 분류 |
| P0 | 홈 layout drift | `object-cover` 배경과 viewport 기준 효과 좌표가 분리 | [[Layout-Contract]] 기준 stage화 |
| P1 | 지속 애니메이션 | 촛불, 연기, 오브, 별빛, 전환 효과가 동시에 동작 | blur/drop-shadow/will-change 비용 |
| P1 | client component 범위 | localStorage 구독으로 client boundary가 넓음 | server/static으로 둘 수 있는 UI 분리 |
| P2 | route bundle | 현 단계에서는 기능보다 에셋 영향이 더 클 가능성 | build analyzer 도입 여부 |

## 작업 순서

### Phase 0. Baseline 고정

목표: 현재 상태를 수치와 이미지로 남긴다.

- `npm run build` 결과 저장
- 주요 화면 3개 viewport screenshot 저장
- production `manyang.vercel.app`과 local production 비교
- 큰 이미지 top 30 목록 저장
- Lighthouse mobile 결과 저장

완료 기준:

- before screenshot이 `output/playwright/optimization/`에 저장되어 있다.
- 이미지 용량 목록과 주요 지표가 문서 또는 plan evidence에 기록되어 있다.

### Phase 1. 이미지와 에셋 다이어트

목표: 첫 화면과 공통 UI의 네트워크 payload를 줄인다.

- runtime 에셋과 reference 에셋 분리
- 배경 PNG의 WebP/AVIF 후보 생성
- 버튼/푸터/아이콘 표시 크기 기준 리사이즈
- `unoptimized` 사용 사유 표 작성
- 홈 첫 화면에서 priority 이미지를 1장으로 제한

완료 기준:

- 홈 첫 화면에서 불필요한 큰 이미지를 요청하지 않는다.
- 품질 손상 없이 주요 배경/버튼 용량이 줄어든다.
- `manyangAssets`가 runtime 에셋만 바라본다.

### Phase 2. 홈 stage와 layout stability

목표: 실제 모바일에서 버튼, 효과, 배경 피사체가 같이 움직이게 한다.

- 배경 기준 좌표계 도입
- 고양이별 `object-position`과 effect anchor 분리
- CTA 그룹 위치를 `clamp()` 또는 layout preset으로 관리
- safe-area bottom 반영
- Fixed 화면 내부 스크롤 제거

완료 기준:

- 홈은 `375x667`, `390x844`, `430x932`에서 가로 스크롤과 내부 세로 스크롤이 없다.
- 오브/촛불 효과가 배경 속 실제 위치와 붙어 있다.
- CTA가 하단 nav와 겹치지 않는다.

### Phase 3. 애니메이션 최적화

목표: 분위기는 유지하되 모바일 CPU/GPU 부담을 줄인다.

- 지속 효과 개수와 blur/drop-shadow 비용 점검
- `will-change` 남용 제거
- effect layer에 `contain` 적용 여부 점검
- 저성능/축소 motion 조건에서 효과 강도 낮추기
- 고양이 전환 효과 중복 레이어와 duration 점검

완료 기준:

- 홈 idle 상태에서 장시간 애니메이션이 과도하게 CPU를 쓰지 않는다.
- 전환 효과는 유지되지만 선택 반응이 지연처럼 느껴지지 않는다.
- `prefers-reduced-motion`에서 효과가 단순화된다.

### Phase 4. React/Next 구조 정리

목표: 필요 없는 client boundary와 JS 실행을 줄인다.

- server component로 둘 수 있는 shell/정적 UI 분리
- localStorage 구독 컴포넌트 최소화
- route별 client component 진입점 정리
- 무거운 UI를 route 단위로만 로드
- metadata/static route 상태 유지

완료 기준:

- 정적 화면은 불필요하게 client component가 되지 않는다.
- 기능 회귀 없이 route JS 부담이 줄어든다.

## 화면별 최적화 체크포인트

| 화면 | 우선 체크 |
| --- | --- |
| 홈 | LCP 배경, CTA 위치, 효과 좌표, 내부 스크롤, nav 겹침 |
| 꿈쓰기 | 큰 입력창 reflow, 칩 선택 반응, 해몽 버튼 글로우 clipping |
| 꿈 씨앗 | 상단 일러스트 crop, content scroll, 선택 칩 줄바꿈 |
| 꿈의 발자국 | 칩 grid 안정성, 색상 선택 영역, CTA 위치 |
| 기록 | 달력 에셋 용량, 숫자 정렬, 리스트 렌더링 |
| 백과 | 리스트 카드 수, 검색 UI, 상세 페이지 정적 렌더 |
| 결과 | receipt 이미지 용량, 긴 해석 scroll, 저장 버튼 반응 |
| 프로필 | 고양이 카드 이미지, 잠금/무료 상태 렌더 |

## 측정 기록 템플릿

```markdown
## Optimization Evidence - YYYY-MM-DD

### Scope
- 화면:
- 변경 범위:

### Before
- Local build:
- LCP:
- CLS:
- INP:
- 홈 첫 화면 이미지 요청 총량:
- 가장 큰 이미지:
- Screenshot:

### After
- Local build:
- LCP:
- CLS:
- INP:
- 홈 첫 화면 이미지 요청 총량:
- 가장 큰 이미지:
- Screenshot:

### Decision
- 유지:
- 후속 작업:
```

## Frontend Optimization DoD

- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] 주요 화면 `375x667`, `390x844`, `430x932` 스크린샷 확인
- [ ] 가로 스크롤 없음
- [ ] Fixed 화면 내부 세로 스크롤 없음
- [ ] LCP 후보 이미지가 의도한 에셋인지 확인
- [ ] 큰 PNG가 runtime path에 불필요하게 남지 않음
- [ ] `prefers-reduced-motion` 회귀 없음
- [ ] Vercel production과 local production 차이 확인

## 관련 문서

- [[Frontend-Optimization-Asset-Classification-2026-05-28]]
- [[Frontend-Optimization-Image-Spike-2026-05-29]]
- [[Frontend-Optimization-Client-Boundary-Review-2026-05-29]]
- [[Frontend-Optimization-Evidence-2026-05-29]]
- [[Layout-Contract]]
- [[Visual-Direction]]
- [[Implementation-Plan]]
- [[Checklists-&-DoD]]
- [[plans/ACTIVE_SPRINT]]

## Runtime Image Optimization Status

Updated 2026-05-29:

- Home backgrounds, receipt/calendar, interpretation backgrounds, shared default background, seed/morning illustrations, cat portraits, and loading orbs now use WebP runtime assets.
- The tracked large runtime image set changed from 41.44 MiB to 4.15 MiB.
- PNG originals remain as source/reference assets and should not be deleted without separate cleanup approval.
- See [[Frontend-Optimization-Evidence-2026-05-29]] for the final pass summary, size deltas, verification commands, and screenshot evidence.
