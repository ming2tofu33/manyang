# Mobile Width System Implementation Plan

> 작성일: 2026-06-03

## 목표

마냥 꿈해몽의 모바일 화면이 실제 기기 폭을 더 잘 쓰도록 공통 레이아웃 폭 체계를 만든다. 기준 캔버스는 기존 계약대로 `390 x 844`를 유지하고, `375 x 667`, `430 x 932`에서는 깨짐 검수와 보정만 한다.

이번 작업의 핵심은 "전체를 무조건 넓히기"가 아니라, 현재 흩어져 있는 `px-6`, `max-w-[...]`, `w-[76%]`, 푸터 음수 마진을 공통 토큰으로 묶고 화면별 예외를 명확히 분리하는 것이다.

## 현재 진단

1. `frontend/src/components/app-shell.tsx`의 콘텐츠 래퍼가 `px-6`을 사용한다.
   - 390px 기준 실제 콘텐츠 폭은 `390 - 48 = 342px`이 된다.
   - 기록, 백과, 입력 화면의 카드가 좁아 보이는 주된 이유다.

2. `frontend/src/components/bottom-nav.tsx`는 `-mx-6`과 `w-[calc(100%+3rem)]`로 `AppShell`의 `px-6`에 의존한다.
   - AppShell padding만 줄이면 푸터 정렬이 같이 깨질 수 있다.
   - 따라서 shell padding과 bleed width를 같은 토큰에서 관리해야 한다.

3. 홈 CTA는 `frontend/src/lib/home-action-layout.ts`에서 별도 stage 계약을 갖고 있다.
   - 홈은 배경 중심 fixed 화면이라 일반 패널 화면처럼 무작정 넓히면 안 된다.
   - 홈 버튼 폭은 별도 예외로 유지하되, 현재 위치가 틀어지지 않도록 테스트로 보호한다.

4. 결과 영수증은 `frontend/src/components/dream-result-receipt.tsx`에서 자체 `max-w-[372px]`와 내부 텍스트 폭 `w-[82%]`를 쓴다.
   - 영수증은 종이 에셋 비율이 중요하므로 일반 width 토큰의 직접 적용 대상이 아니다.

5. 기록/백과/프로필/입력 화면은 반복 패널과 리스트가 많다.
   - 이 화면들이 이번 width 개선의 1차 대상이다.

## 설계 방향

### 기준

| 항목 | 현재 | 변경 방향 |
| --- | --- | --- |
| 앱 최대 폭 | `430px` | 유지 |
| 기준 캔버스 | `390 x 844` | 유지 |
| AppShell 좌우 padding | `24px` | 기본 `16px`, 큰 폰 `18px` 수준으로 축소 |
| 390px 실제 콘텐츠 폭 | `342px` | 약 `358px` |
| 430px 실제 콘텐츠 폭 | `382px` | 약 `394px` |
| 하단 nav bleed | `px-6` 하드코딩 의존 | shell inset 토큰 기반 |
| 홈/영수증/로딩 | 공통 폭과 섞임 | 예외 슬롯으로 보호 |

### 새 공통 토큰

새 파일을 만들거나 `frontend/src/lib/styles.ts`를 확장한다.

우선 추천은 새 파일 생성이다.

- `frontend/src/lib/mobile-layout.ts`

예상 구조:

```ts
export const mobileLayout = {
  designViewport: { width: 390, height: 844 },
  verificationViewports: [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ],
  shellMaxWidth: 430,
  shellInlinePaddingClassName: "px-4 min-[420px]:px-[18px]",
  shellBleedClassName: "-mx-4 w-[calc(100%+2rem)] min-[420px]:-mx-[18px] min-[420px]:w-[calc(100%+36px)]",
  contentStackClassName: "space-y-4",
} as const;
```

이렇게 하면 나중에 디자인을 보면서 폭을 조정할 때 여러 컴포넌트를 건드리지 않고 토큰만 조정할 수 있다.

## 작업 계획

### Task 1. Width Contract 테스트 추가

목표: 구현 전에 390 기준과 주요 토큰이 코드로 보호되게 한다.

파일:

- 생성: `frontend/src/lib/mobile-layout.ts`
- 생성: `frontend/src/lib/mobile-layout.test.ts`
- 수정: `frontend/src/components/app-shell.test.tsx`
- 수정: `frontend/src/components/bottom-nav.test.tsx`

테스트 내용:

- 기준 viewport가 `390 x 844`인지 확인한다.
- 검수 viewport가 `375 x 667`, `390 x 844`, `430 x 932`인지 확인한다.
- shell max width가 `430`인지 확인한다.
- AppShell markup에 새 shell padding class가 들어가는지 확인한다.
- BottomNav가 더 이상 `-mx-6`, `w-[calc(100%+3rem)]`에 직접 의존하지 않는지 확인한다.

검증 명령:

```powershell
npm --prefix frontend test -- src/lib/mobile-layout.test.ts src/components/app-shell.test.tsx src/components/bottom-nav.test.tsx
```

### Task 2. AppShell과 BottomNav 폭 토큰 적용

목표: 모든 화면의 기본 사용 폭을 넓히되 푸터 정렬을 같이 맞춘다.

파일:

- 수정: `frontend/src/components/app-shell.tsx`
- 수정: `frontend/src/components/bottom-nav.tsx`
- 수정: `frontend/src/lib/mobile-layout.ts`

변경 내용:

- AppShell의 `px-6`을 `mobileLayout.shellInlinePaddingClassName`로 교체한다.
- BottomNav의 `-mx-6 w-[calc(100%+3rem)]`를 `mobileLayout.shellBleedClassName`로 교체한다.
- 하단 nav 내부 아이콘 위치는 기존 프레임 기준을 유지한다.
- `contentMode="fixed"` 화면에서 내부 스크롤이 생기지 않는지 확인한다.

위험:

- AppShell은 모든 주요 route에 영향을 준다.
- 푸터 에셋은 프레임 기반이라 bleed 계산이 틀리면 양옆이 뜨거나 잘릴 수 있다.

검증:

```powershell
npm --prefix frontend test -- src/components/app-shell.test.tsx src/components/bottom-nav.test.tsx
```

### Task 3. 패널/리스트 화면 폭 정리

목표: 기록, 백과, 프로필, 로그인처럼 카드와 리스트가 중심인 화면을 먼저 넓힌다.

대상 파일:

- `frontend/src/components/dream-archive-list.tsx`
- `frontend/src/components/archive-records-client.tsx`
- `frontend/src/components/archive-record-detail-client.tsx`
- `frontend/src/components/archive-record-entry-panel.tsx`
- `frontend/src/components/archive-calendar.tsx`
- `frontend/src/components/encyclopedia-search-client.tsx`
- `frontend/src/components/encyclopedia-detail-content.tsx`
- `frontend/src/components/encyclopedia-reader-guide-client.tsx`
- `frontend/src/components/profile-room.tsx`
- `frontend/src/components/account-status-card.tsx`
- `frontend/src/components/auth-form.tsx`

변경 기준:

- `ui.panel`은 폭을 직접 제한하지 않고 `w-full` 흐름을 따른다.
- 카드 내부 padding은 너무 커지지 않게 `p-4`를 기본으로 둔다.
- 리스트 아이템은 `min-w-0`, `truncate`, `line-clamp`를 유지해서 넓어진 폭에서도 텍스트가 안정적으로 흐르게 한다.
- 달력 에셋은 무작정 키우지 않고 현재 정렬이 깨지지 않는 선에서 max width만 재검토한다.

테스트:

```powershell
npm --prefix frontend test -- src/components/encyclopedia-content.test.tsx src/components/encyclopedia-detail-content.test.tsx src/components/archive-calendar.test.tsx src/components/profile-room.test.tsx
```

### Task 4. 입력 화면 width와 칩 grid 보정

목표: 꿈쓰기, 꿈의 발자국, 밤의 기록에서 선택 칩과 입력 패널이 좁아 보이지 않게 한다.

대상 파일:

- `frontend/src/components/dream-entry-form.tsx`
- `frontend/src/components/morning-mood-form.tsx`
- `frontend/src/components/night-checkin-form.tsx`
- `frontend/src/app/write/page.tsx`
- `frontend/src/app/morning/page.tsx`
- `frontend/src/app/night/page.tsx`

변경 기준:

- 선택 칩 grid는 줄바꿈 안정성을 우선한다.
- 긴 단어가 있는 칩은 폭을 넓히기보다 `text-[...]`, `leading-tight`, 아이콘 크기를 함께 조정한다.
- CTA 버튼 프레임은 글로우가 잘리지 않도록 wrapper overflow를 확인한다.
- `/morning`, `/night`의 상단 일러스트는 기존 보호 영역을 유지한다.

테스트:

```powershell
npm --prefix frontend test -- src/components/dream-entry-form.test.tsx src/components/morning-mood-form.test.tsx src/components/night-checkin-form.test.tsx
```

### Task 5. 예외 화면 보호

목표: 넓히면 오히려 깨지는 화면을 공통 폭 변경에서 보호한다.

예외 대상:

- 홈 `/`
- 결과 `/result`
- 로딩 overlay
- 타로 `/tarot`

대상 파일:

- `frontend/src/lib/home-action-layout.ts`
- `frontend/src/components/today-home-actions.tsx`
- `frontend/src/components/today-home-scene.tsx`
- `frontend/src/components/dream-result-receipt.tsx`
- `frontend/src/components/dream-loading-overlay.tsx`
- `frontend/src/components/daily-tarot-client.tsx`

변경 기준:

- 홈은 `homeStageLayout` 기준을 유지한다.
- 영수증은 종이 에셋의 `max-w-[372px]` 기준을 우선 유지한다.
- 로딩 오브와 고양이 장면은 center stage를 유지한다.
- 타로 카드는 카드 비율이 중요하므로 AppShell padding 변경으로만 영향받게 두고, 카드 자체 폭은 별도 판단한다.

보호 테스트:

```powershell
npm --prefix frontend test -- src/components/today-home-actions.test.tsx src/components/dream-result-receipt.test.tsx src/components/daily-tarot-client.test.tsx
```

### Task 6. Playwright 모바일 검수

목표: 실제 viewport에서 넓어진 폭이 의도대로 보이는지 확인한다.

검수 route:

- `/`
- `/write`
- `/morning`
- `/night`
- `/archive`
- `/archive/records`
- `/encyclopedia`
- `/profile`
- `/result`

검수 viewport:

- `375 x 667`
- `390 x 844`
- `430 x 932`

검수 항목:

- 가로 스크롤 없음
- fixed 화면 내부 세로 스크롤 없음
- 하단 nav가 양옆으로 뜨거나 잘리지 않음
- 카드/패널이 화면 폭을 더 활용함
- 버튼 텍스트가 프레임 밖으로 나가지 않음
- 홈 고양이/오브/타로 테이블 보호 영역 유지
- 기록/백과 리스트가 더 넓어졌지만 과하게 퍼져 보이지 않음

예시 명령:

```powershell
npm --prefix frontend run dev
npx playwright screenshot --viewport-size=390,844 --wait-for-timeout=1800 "http://127.0.0.1:3000/archive" "output/playwright/mobile-width/archive-390x844.png"
npx playwright screenshot --viewport-size=430,932 --wait-for-timeout=1800 "http://127.0.0.1:3000/encyclopedia" "output/playwright/mobile-width/encyclopedia-430x932.png"
```

### Task 7. 문서 업데이트

목표: 나중에 디자인을 다시 조정할 때 어떤 값을 만져야 하는지 남긴다.

수정 파일:

- `vault/08-Design/Layout-Contract.md`
- `vault/09-Implementation/Frontend-Optimization-Guide.md`

추가 내용:

- AppShell 내부 padding 토큰
- BottomNav bleed 토큰
- 홈/영수증/로딩/타로 예외 원칙
- "390 기준에서 마음에 드는 위치를 잡고, 375/430은 보정 검수한다"는 작업 방식

## 커밋 단위

권장 커밋:

1. `test(layout): add mobile width contracts`
2. `feat(layout): add shared mobile width tokens`
3. `refactor(layout): apply shell and nav width tokens`
4. `refactor(layout): widen list and form surfaces`
5. `docs(layout): document mobile width rules`

## 최종 검증

전체 작업 후 실행:

```powershell
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

## 완료 기준

- 390px 기준에서 주요 패널의 체감 폭이 현재보다 넓어져 있다.
- 375px에서도 가로 스크롤이 없다.
- 430px에서 화면이 가운데 좁게 뭉쳐 보이지 않는다.
- BottomNav 프레임과 아이콘 정렬이 유지된다.
- 홈 CTA 위치와 배경 보호 영역이 무너지지 않는다.
- 영수증 종이 에셋은 늘어나거나 깨지지 않는다.
- 기록/백과/프로필/입력 화면은 공통 width 토큰을 사용한다.

## 판단

이 작업은 "디자인을 다시 하는 작업"이 아니라 "디자인을 수정하기 쉬운 폭 체계로 정리하는 작업"이다. 먼저 `AppShell + BottomNav`를 토큰화하고, 그 다음 카드/리스트/입력 화면을 넓히는 순서가 가장 안전하다. 홈과 영수증은 이미 에셋 좌표 의존도가 높으므로 공통 폭 작업의 예외로 두는 것이 맞다.
