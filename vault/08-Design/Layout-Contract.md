---
title: Layout Contract
tags:
  - design
  - layout
  - contract
  - mobile
status: draft
updated: 2026-05-27
---

# Layout Contract

> 이 문서는 마냥 꿈해몽의 에셋 기반 모바일 UI를 구현할 때 지켜야 하는 화면 배치 계약이다. 배경 일러스트, 효과, 버튼 프레임, 텍스트 UI가 기기별로 따로 움직이지 않도록 기준 캔버스와 화면별 슬롯을 고정한다.

---

## 왜 필요한가

마냥 꿈해몽은 일반적인 반응형 웹앱보다 모바일 게임, 비주얼 노벨, 캐릭터 앱에 가까운 UI 구조를 가진다.

- 배경 일러스트가 화면 분위기와 정보 위계를 만든다.
- 버튼, 푸터, 패널이 PNG 에셋으로 구성된다.
- 촛불, 오브, 연기, 별빛 효과가 배경 이미지의 특정 위치에 맞아야 한다.
- 화면마다 스크롤 여부와 CTA 위치가 다르다.

따라서 화면을 수정할 때는 CSS 값만 감으로 조정하지 않고, 아래 계약을 기준으로 한다.

## 기준 캔버스

| 항목 | 기준 |
| --- | --- |
| 기준 아트보드 | `390 x 844` |
| 최대 앱 폭 | `430px` |
| 작은 폰 검수 | `375 x 667` |
| 기준 폰 검수 | `390 x 844` |
| 큰 폰 검수 | `430 x 932` |
| 기본 방향 | portrait only |
| 기본 쉘 | 모바일 앱형 full-height shell |

기준 아트보드는 디자인 좌표계다. 배경, 효과, CTA, 푸터의 기본 위치는 이 좌표계에서 먼저 정의하고, 실제 viewport에는 보정값을 적용한다.

## 공통 화면 슬롯

모든 화면은 아래 슬롯 중 필요한 것만 사용한다.

| 슬롯 | 역할 | 원칙 |
| --- | --- | --- |
| Safe Top | 노치, 주소창, 상단 여백 | 아이콘이 너무 위에 붙지 않게 최소 여백 유지 |
| Header | 뒤로가기, 알림, 설정, 보조 액션 | 아이콘 크기와 y 위치는 화면별로 흔들리지 않게 유지 |
| Title | 화면 제목과 짧은 설명 | 제목은 일러스트를 가리지 않는 높이에 배치 |
| Hero Asset | 고양이, 오브, 주요 일러스트 | 보호 영역을 먼저 정하고 UI를 배치 |
| Content | 입력창, 선택 칩, 카드, 리스트 | 화면 성격에 따라 고정/스크롤 정책 분리 |
| Primary CTA | 핵심 버튼 | 푸터 위에서 안정적으로 클릭 가능한 위치 유지 |
| Secondary Action | 보조 버튼, 텍스트 링크 | 메인 CTA보다 시각 무게를 낮춘다 |
| Bottom Note | 저장 안내, 루프 안내 | 작은 화면에서는 우선 축약 또는 숨김 가능 |
| Bottom Nav | 공통 하단 메뉴 | 모든 주요 화면에서 동일 높이와 safe-area 보정 유지 |
| Safe Bottom | 홈 인디케이터, 브라우저 하단바 | `env(safe-area-inset-bottom)` 반영 |

## 좌표계 계약

### 배경과 효과

배경 이미지와 효과는 같은 좌표계를 써야 한다.

- 금지: 효과 위치를 viewport 퍼센트만으로 고정한다.
- 권장: 배경 기준 좌표를 저장하고, 실제 렌더 시 scale과 crop offset을 계산한다.
- 고양이별 배경은 주요 피사체 위치가 다르므로 `object-position`, effect anchor, CTA 보정값을 분리한다.
- 촛불, 오브, 연기, 별빛은 배경 속 실제 오브/촛불 위치에 붙어야 한다.

필요한 구조 예시:

```ts
type BackgroundLayoutPreset = {
  designWidth: 390;
  designHeight: 844;
  objectPosition: string;
  compactObjectPosition?: string;
  tallObjectPosition?: string;
  protectedAreas: Array<{
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  effects: Array<{
    name: string;
    x: number;
    y: number;
    size: number;
  }>;
};
```

### UI 배치

- UI는 배경 이미지 위에 얹히지만, 배경의 핵심 보호 영역을 침범하면 안 된다.
- 기준 캔버스 위치는 유지하되 작은 폰에서는 보조 텍스트, 여백, 효과 크기부터 줄인다.
- 메인 CTA와 하단 nav가 겹치면 CTA를 줄이거나 secondary action을 접는다.
- 텍스트가 이미지 안에 박힌 에셋은 가능하면 피하고, 버튼 프레임 위에 코드 텍스트를 얹는다.

## 에셋 제작 계약

| 에셋 유형 | 제작 원칙 | 코드 적용 원칙 |
| --- | --- | --- |
| 배경 일러스트 | 텍스트 없는 전체 분위기 이미지 | `background` 레이어로 사용 |
| 캐릭터/오브 | 배경과 분리 가능한 경우 투명 PNG 우선 | 보호 영역을 따로 관리 |
| 버튼 프레임 | 텍스트 없는 빈 프레임 | 텍스트는 코드로 중앙 정렬 |
| 푸터 프레임 | 메뉴 텍스트 없는 프레임 | 아이콘과 라벨은 코드 또는 분리 에셋 |
| 패널/카드 | 모서리와 테두리 여백 충분히 확보 | 내부 padding과 최소 높이 고정 |
| 효과 | 투명 PNG 또는 CSS effect | 배경 기준 좌표에 붙인다 |
| 참고용 전체 화면 | 개발 기준 이미지 | 그대로 UI로 쓰지 않는다 |

## 스크롤 정책

| 정책 | 설명 | 사용 화면 |
| --- | --- | --- |
| Fixed | 한 화면 안에서 완료, 내부 스크롤 없음 | 홈, 로딩 |
| Content Scroll | 헤더/푸터는 고정, 콘텐츠 영역만 스크롤 | 꿈쓰기, 꿈 씨앗, 꿈의 발자국 |
| Page Scroll | 화면 전체 내용이 길게 흐름 | 결과, 기록, 백과, 프로필 |
| List Scroll | 리스트/달력/검색 결과가 중심 | 기록, 백과 목록 |

작은 폰에서 Fixed 화면에 스크롤이 생기면 레이아웃 계약 위반으로 본다. Content Scroll 화면은 CTA가 하단 nav 아래로 밀리지 않아야 한다.

## 화면별 레이아웃 기준표

| 화면 | Route | 레이아웃 유형 | 핵심 보호 영역 | CTA 기준 | 스크롤 정책 | 검수 포인트 |
| --- | --- | --- | --- | --- | --- | --- |
| 홈 | `/` | 배경 중심 Fixed stage | 고양이 얼굴, 오브, 타로 테이블 일부, 하단 nav | 시간대별 메인 CTA 1개와 보조 CTA 1개 | Fixed | `375x667`에서도 내부 스크롤 없음, 효과가 오브/촛불에 붙음 |
| 꿈쓰기 | `/write` | 입력 중심 Content Scroll | 고양이 프로필, 말풍선, 큰 입력창, 해몽 받기 버튼 | 해몽 받기 버튼은 푸터 위에 충분한 터치 영역 확보 | Content Scroll | 입력창과 칩이 겹치지 않음, CTA 글로우가 잘리지 않음 |
| 꿈 씨앗 심기 | `/seed` | 상단 일러스트 + 기록 UI | 잠든 고양이, 오브, 선택 칩, 씨앗 심기 버튼 | 씨앗 심기 버튼은 content 끝 CTA, 작은 폰에서는 선택 영역 압축 | Content Scroll | 상단 일러스트가 잘리지 않고, 가로 스크롤 없음 |
| 꿈의 발자국 | `/morning` | 아침 상태 기록 UI | 오브/고양이 일러스트, 기분 칩, 색상 선택, 발자국 남기기 버튼 | 발자국 남기기 버튼은 마지막 입력 다음에 배치 | Content Scroll | 선택 칩 줄바꿈 안정, 섹션 제목과 칩 간격 일정 |
| 기록/달력 | `/archive` | 달력 + 기록 리스트 | 달력 숫자 위치, 기록 카드, 월 이동 버튼 | CTA보다 탐색과 리스트 가독성 우선 | List Scroll | 달력 에셋과 숫자 정렬, 긴 기록 제목 ellipsis |
| 백과 목록 | `/encyclopedia` | 검색/카테고리 + 카드 리스트 | 검색창, 카테고리 칩, 상징 카드 | CTA 없음, 탐색성 우선 | List Scroll | 검색 결과 없음 상태와 리스트 카드 높이 일관 |
| 백과 상세 | `/encyclopedia/[slug]` | 상세 문서형 | 상징 제목, 요약, 해석 섹션, 관련 상징 | 결과/입력 연결 CTA는 하단 보조 | Page Scroll | 긴 본문 가독성, 뒤로가기 위치 유지 |
| 결과 | `/result` | 영수증/해석 중심 Page Scroll | 꿈 영수증 이미지, 해석 카드, 저장/공유 액션 | 저장/기록 CTA가 해석 흐름 이후에 보임 | Page Scroll | 영수증 텍스트 정렬, 긴 해석에서 푸터와 겹치지 않음 |
| 로딩 | `/loading` | 집중형 Fixed stage | 오브/로딩 문구, 진행감 | CTA 없음 | Fixed | 배경 확대/글로우가 화면 밖에서 어색하게 잘리지 않음 |
| 내 방/프로필 | `/profile` | 사용자 상태/설정 Page Scroll | 고양이 선택, 잠금 상태, 이용권/설정 카드 | 구독/설정 CTA는 카드 내부 | Page Scroll | 잠금/무료 상태가 명확하고 하단 nav와 겹치지 않음 |

## 화면별 보호 영역

| 화면 | 가리면 안 되는 요소 | 작아진 화면에서 먼저 줄일 것 |
| --- | --- | --- |
| 홈 | 고양이 얼굴, 오브, 메인 CTA, 하단 nav | 보조 안내문, 링크 여백, 효과 크기 |
| 꿈쓰기 | 입력창, 해몽 받기 버튼, 선택 칩 첫 줄 | 말풍선 높이, 칩 간격, 상단 장식 |
| 꿈 씨앗 | 잠든 고양이/오브, 질문 유형, CTA | 설명 문구, 분위기 칩 간격, 하단 안내문 |
| 꿈의 발자국 | 기분/색/몸상태 선택, CTA | 상단 설명, 섹션 간격 |
| 기록 | 달력 숫자, 기록 카드 제목 | 장식 배경, 부가 설명 |
| 백과 | 검색창, 상징 카드 제목 | 카드 장식, 보조 설명 |
| 결과 | 영수증 본문, 해석 섹션 제목, 저장 상태 | 장식 효과, 보조 카피 |

## 컴포넌트 계약

| 컴포넌트 | 계약 |
| --- | --- |
| `AppShell` | 모바일 최대 폭, safe-area, 하단 nav, 공통 배경 레이어를 담당 |
| `BackgroundStage` | 배경 이미지 crop, 효과 좌표 변환, 고양이별 보정값을 담당 |
| `ScreenHeading` | 아이콘, 제목, 설명의 크기와 y 위치를 화면 타입별로 통일 |
| `AssetImageTextButton` | 버튼 프레임과 코드 텍스트 합성, 텍스트 overflow 방지 |
| `BottomNav` | 모든 주요 화면에서 동일 높이, 동일 touch target 유지 |
| `ChoiceChip` | 선택/비선택/disabled 상태, 줄바꿈, 최소 높이 통일 |
| `TextAreaPanel` | 입력창 프레임, 글자 수, placeholder, 아이콘 위치 통일 |

## 검수 계약

화면 수정 후 최소 아래 뷰포트에서 확인한다.

| Viewport | 목적 |
| --- | --- |
| `375 x 667` | 작은 폰, 주소창이 공간을 많이 차지하는 상황 |
| `390 x 844` | 기준 캔버스 |
| `430 x 932` | 큰 폰, 여백이 과하게 벌어지는지 확인 |

검수 항목:

- 가로 스크롤이 없어야 한다.
- Fixed 화면은 내부 세로 스크롤이 없어야 한다.
- CTA가 하단 nav 또는 safe-area에 가려지면 안 된다.
- 텍스트가 버튼 프레임 밖으로 넘치면 안 된다.
- 효과는 배경 속 오브/촛불/별 위치와 시각적으로 붙어 있어야 한다.
- 배포본에서는 Vercel 캐시와 최신 배포 여부를 함께 확인한다.

## 관련 문서

- [[Visual-Direction]]
- [[Screen-Inventory]]
- [[Asset-Inventory]]
- [[Frontend-Optimization-Guide]]
- [[Implementation-Plan]]

## Home Stage Contract Update - 2026-05-29

- Home design 기준 캔버스는 `390 x 844`로 고정한다.
- `375 x 667`, `430 x 932`는 디자인 기준이 아니라 깨짐 검사용 viewport로 사용한다.
- `/` 홈 화면은 fixed stage로 다룬다. 내부 스크롤이 생기면 레이아웃 계약 위반으로 본다.
- 홈 CTA는 `homeStageLayout.bands.actions` 안에서 관리하고, 하단 메뉴와 최소 `12px` 간격을 유지한다.
- 홈 라이브 효과 레이어는 `data-home-effect-stage="390x844"`를 노출해, 효과 좌표가 어떤 기준 캔버스에 묶여 있는지 확인할 수 있어야 한다.
- 홈 액션 영역은 `data-home-action-stage="root"`와 `home-action-stage` class를 사용한다. 나중에 버튼 위치를 조정할 때는 여러 CSS 파일을 직접 바꾸기보다 `frontend/src/lib/home-action-layout.ts`의 stage 값과 class preset을 먼저 수정한다.

## Mobile Width Token Update - 2026-06-03

- 공통 모바일 폭 값은 `frontend/src/lib/mobile-layout.ts`에서 관리한다.
- `AppShell` 내부 좌우 inset은 `mobileLayout.shellInlinePaddingClassName`을 기준으로 한다.
- 하단 nav의 bleed 폭은 `mobileLayout.shellBleedClassName`을 기준으로 한다. shell inset만 바꾸고 nav bleed를 따로 두면 푸터 프레임이 양옆으로 뜨거나 잘릴 수 있다.
- 기록 달력과 리스트형 surface의 최대 폭은 `mobileLayout.wideSurfaceMaxWidthClassName`을 우선 사용한다.
- 홈, 결과 영수증, 로딩, 타로처럼 에셋 좌표와 비율이 중요한 화면은 공통 surface 폭을 직접 적용하지 않는다.
- `390 x 844`에서 먼저 위치를 잡고, `375 x 667`과 `430 x 932`는 깨짐 검수와 보정용으로 본다.
