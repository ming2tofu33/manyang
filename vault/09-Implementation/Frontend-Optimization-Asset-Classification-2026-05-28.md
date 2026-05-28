---
title: Frontend Optimization Asset Classification 2026-05-28
tags:
  - implementation
  - frontend
  - performance
  - assets
status: draft
updated: 2026-05-28
---

# Frontend Optimization Asset Classification 2026-05-28

> 작업 4번 결과. `frontend/public/manyang` 아래 에셋을 런타임용, 압축 후보, 정리 후보로 나눈다. 이번 문서는 삭제 실행이 아니라 다음 최적화 작업의 기준표다.

## Evidence

- 기준 목록: `output/playwright/optimization/asset-size-baseline.txt`
- 런타임 에셋 레지스트리: `frontend/src/lib/manyang-assets.ts`
- 고양이별 동적 참조: `frontend/src/lib/cat-readers.ts`
- 직접 참조 확인: `rg -n "manyangAssets\.|/manyang/" frontend/src`
- 전체 public payload: 133 files, 99.52 MiB
- 상위 40개 파일 payload: 79.41 MiB, 전체의 79.8%

## Classification Rules

| Type | Meaning | Next action |
| --- | --- | --- |
| Runtime | 현재 화면에서 직접 또는 `manyangAssets` 경유로 쓰인다. | 삭제 금지. 먼저 압축/리사이즈한다. |
| Runtime but oversized | 쓰이지만 실제 표시 크기보다 과하다. | WebP/AVIF 후보를 만들고 `manyangAssets`를 교체한다. |
| Registered but unused | 레지스트리에 있지만 실제 컴포넌트에서 호출되지 않는다. | 코드 의도 확인 후 레지스트리에서 제거한다. |
| Reference-only | 구현 참고용 원본으로 보이며 런타임 참조가 없다. | `frontend/public` 밖의 `ref/` 또는 vault reference로 이동한다. |
| Delete candidate | 중복 또는 구버전으로 보인다. | 사용자 승인 후 삭제한다. |

## Priority Findings

1. `frontend/public/manyang` 총량이 약 99.52 MiB다. public 파일은 JS 번들에 직접 들어가지는 않지만, 배포 용량과 정적 파일 관리 비용을 키운다.
2. 홈/해몽 배경 8개, 결과 영수증, 달력, 오브, 고양이 프로필이 실제 런타임 최적화 우선순위다.
3. `references/cat-*.png`, `references/*screen*.png`, 원본 버튼 PNG, raw orb PNG는 현재 코드에서 쓰이지 않는 참고용 후보가 많다.
4. `home-white-cat-ref.png`와 `home-white-cat-mobile.png`는 크기와 해상도가 같다. 현재 런타임은 `home-white-cat-ref.png`만 쓴다.
5. `blackcat-profile-transparent.png`는 `manyangAssets`에 등록되어 있지만 실제 화면은 `cat-black-profile.png`를 쓴다.

## Runtime Assets To Optimize First

| Asset | Size | Dimension | Runtime usage | Action |
| --- | ---: | --- | --- | --- |
| `backgrounds/interpretation-white-cat.png` | 2.51 MiB | 853x1844 | 해몽 입력/로딩/결과 배경 | WebP/AVIF 생성 |
| `receipts/empty.png` | 2.42 MiB | 771x1730 | 결과 영수증 | 표시 크기 기준 리사이즈 + WebP |
| `backgrounds/interpretation-gray-cat.png` | 2.36 MiB | 852x1846 | 해몽 입력/로딩/결과 배경 | WebP/AVIF 생성 |
| `backgrounds/home-white-cat-ref.png` | 2.29 MiB | 896x1755 | 홈 흰 고양이 배경 | WebP/AVIF 생성 |
| `ui/calendar.png` | 2.26 MiB | 962x1452 | 기록 달력 | 표시 크기 기준 리사이즈 + WebP |
| `backgrounds/home-gray-cat.png` | 2.20 MiB | 853x1844 | 홈 회색 고양이 배경 | WebP/AVIF 생성 |
| `backgrounds/interpretation-black-cat.png` | 2.19 MiB | 853x1844 | 해몽 입력/로딩/결과 배경 | WebP/AVIF 생성 |
| `backgrounds/interpretation-cheese-cat.png` | 2.11 MiB | 941x1672 | 해몽 입력/로딩/결과 배경 | WebP/AVIF 생성 |
| `references/cat-gray-profile.png` | 1.98 MiB | 1254x1254 | 고양이 선택/백과/기록/프로필 | 320-512px 표시용 파생본 생성 |
| `backgrounds/dreamseed.png` | 1.89 MiB | 1254x1254 | 꿈 씨앗 심기 상단 일러스트 | 표시 크기 기준 리사이즈 |
| `backgrounds/morning-illustration.png` | 1.89 MiB | 1254x1254 | 꿈의 발자국 상단 일러스트 | 표시 크기 기준 리사이즈 |
| `backgrounds/home-cheese-cat.png` | 1.84 MiB | 852x1846 | 홈 치즈 고양이 배경 | WebP/AVIF 생성 |
| `backgrounds/default.png` | 1.80 MiB | 853x1844 | archive/write/morning/profile/seed/encyclopedia shell | WebP/AVIF 생성 |
| `references/cat-white-profile.png` | 1.79 MiB | 1254x1254 | 고양이 선택/백과/기록/프로필 | 320-512px 표시용 파생본 생성 |
| `backgrounds/home-black-cat.png` | 1.79 MiB | 853x1844 | 홈 검은 고양이 배경 | WebP/AVIF 생성 |
| `references/cat-black-profile.png` | 1.77 MiB | 1254x1254 | 고양이 선택/백과/기록/프로필 | 320-512px 표시용 파생본 생성 |
| `orbs/orb-3-transparent.png` | 1.76 MiB | 1254x1254 | 해몽 로딩 overlay | 512px 이하 파생본 생성 |
| `references/cat-cheese-profile.png` | 1.73 MiB | 1254x1254 | 고양이 선택/백과/기록/프로필 | 320-512px 표시용 파생본 생성 |
| `orbs/orb-1-transparent.png` | 1.72 MiB | 1254x1254 | 해몽 로딩 overlay | 512px 이하 파생본 생성 |
| `orbs/orb-2-transparent.png` | 1.66 MiB | 1254x1254 | 해몽 로딩 overlay | 512px 이하 파생본 생성 |
| `orbs/orb-transparent.png` | 1.53 MiB | 1254x1254 | 해몽 로딩 페이지 중심 오브 | 512px 이하 파생본 생성 |
| `ui/footer/footer-frame.png` | 682.3 KiB | 1654x307 | 공통 하단 메뉴 프레임 | 표시 폭 기준 리사이즈 |
| `ui/buttons/dreammemory-write-frame.png` | 437.5 KiB | 860x375 | 홈/꿈쓰기 CTA | 표시 폭 기준 리사이즈 |
| `ui/buttons/morning-pawprint-frame.png` | 387.8 KiB | 852x300 | 꿈의 발자국 CTA | 표시 폭 기준 리사이즈 |
| `ui/buttons/dreammemory-submit-frame.png` | 370.4 KiB | 857x262 | 해몽 받기 CTA | 표시 폭 기준 리사이즈 |
| `ui/buttons/dreamseed-frame.png` | 353.2 KiB | 852x300 | 꿈 씨앗 심기 CTA | 표시 폭 기준 리사이즈 |
| `ui/buttons/dreammemory-forgot-frame.png` | 191.1 KiB | 808x148 | 홈 보조 CTA | 표시 폭 기준 리사이즈 |

## Reference Or Cleanup Candidates

| Asset | Size | Dimension | Current signal | Recommendation |
| --- | ---: | --- | --- | --- |
| `references/cat-gray.png` | 3.24 MiB | 1254x1254 | 런타임 참조 없음 | `ref/` 이동 또는 삭제 후보 |
| `references/cat-white.png` | 2.76 MiB | 1254x1254 | 런타임 참조 없음 | `ref/` 이동 또는 삭제 후보 |
| `references/cat-cheese.png` | 2.69 MiB | 1254x1254 | 런타임 참조 없음 | `ref/` 이동 또는 삭제 후보 |
| `backgrounds/home-white-cat.png` | 2.50 MiB | 941x1672 | 현재 홈은 `home-white-cat-ref.png` 사용 | 구버전이면 삭제 후보 |
| `backgrounds/home-white-cat-mobile.png` | 2.29 MiB | 896x1755 | `home-white-cat-ref.png`와 동일 크기/해상도 | 중복 후보 |
| `ui/buttons/dreammemory-group.png` | 1.97 MiB | 1207x1014 | 런타임 참조 없음 | reference-only 후보 |
| `receipts/filled-reference.png` | 1.97 MiB | 853x1844 | 런타임 참조 없음 | `ref/` 이동 후보 |
| `backgrounds/room.png` | 1.94 MiB | 941x1672 | 프로필 페이지가 현재 `default.png` 사용 | 미사용이면 정리 후보 |
| `references/home.png` | 1.88 MiB | 853x1843 | 런타임 참조 없음 | reference-only 후보 |
| `references/blackcat-profile-transparent.png` | 1.82 MiB | 1254x1254 | 레지스트리 등록, 실제 호출 없음 | 레지스트리 제거 후 정리 후보 |
| `backgrounds/home-mobile.png` | 1.79 MiB | 853x1844 | 현재 홈은 고양이별 배경 사용 | 구버전이면 삭제 후보 |
| `backgrounds/interpretation.png` | 1.73 MiB | 853x1844 | 고양이별 해몽 배경으로 대체됨 | 구버전이면 삭제 후보 |
| `references/cat-gray-profile-cute.png` | 1.72 MiB | 1254x1254 | 런타임 참조 없음 | reference-only 후보 |
| `references/cat-cheese-profile-cute.png` | 1.69 MiB | 1254x1254 | 런타임 참조 없음 | reference-only 후보 |
| `references/encyclopedia.png` | 1.64 MiB | 853x1844 | 런타임 참조 없음 | reference-only 후보 |
| `backgrounds/home.png` | 1.63 MiB | 941x1672 | `AppShell` 기본값으로만 남아 있음 | 기본값 교체 후 정리 검토 |
| `orbs/orb-3.png` | 1.63 MiB | 1254x1254 | transparent 버전만 런타임 참조 | raw 버전 정리 후보 |
| `orbs/orb-1.png` | 1.56 MiB | 1254x1254 | transparent 버전만 런타임 참조 | raw 버전 정리 후보 |
| `orbs/orb-2.png` | 1.54 MiB | 1254x1254 | transparent 버전만 런타임 참조 | raw 버전 정리 후보 |
| `references/cat-black-profile-cute.png` | 1.53 MiB | 1254x1254 | 런타임 참조 없음 | reference-only 후보 |
| `references/dreamcalendar.png` | 1.52 MiB | 853x1844 | 런타임 참조 없음 | reference-only 후보 |
| `references/cat-white-profile-cute.png` | 1.50 MiB | 1254x1254 | 런타임 참조 없음 | reference-only 후보 |
| `references/writingdream.png` | 1.48 MiB | 853x1844 | 런타임 참조 없음 | reference-only 후보 |
| `references/morning.png` | 1.46 MiB | 859x1831 | 런타임 참조 없음 | reference-only 후보 |
| `orbs/orb.png` | 1.44 MiB | 1254x1254 | `orb-transparent.png`가 런타임 사용 | raw 버전 정리 후보 |
| `ui/buttons/dreamseed.png` | 1.19 MiB | 1471x519 | frame 버전만 런타임 사용 | 원본 버튼 reference 후보 |
| `ui/buttons/dreammemory-write.png` | 862.6 KiB | 1207x405 | frame 버전만 런타임 사용 | 원본 버튼 reference 후보 |
| `ui/buttons/dreammemory-submit.png` | 826.1 KiB | 1199x382 | frame 버전만 런타임 사용 | 원본 버튼 reference 후보 |
| `ui/buttons/dreamseed-archive.png` | 789.5 KiB | 1652x360 | 현재 CTA에서 미사용 | reference-only 후보 |
| `ui/menu-button.png` | 687.5 KiB | 1701x327 | 런타임 참조 없음 | reference-only 후보 |
| `ui/buttons/dreammemory-forgot.png` | 324.7 KiB | 924x191 | frame 버전만 런타임 사용 | 원본 버튼 reference 후보 |
| `ui/footer/footer-active-pill.png` | 154.2 KiB | 578x256 | 현재 bottom nav에서 미사용 | 디자인 옵션이면 `ref/` 이동 |

## Screen Mapping

| Screen | Runtime high-impact assets |
| --- | --- |
| Home | `backgrounds/home-*-cat.png`, `backgrounds/home-white-cat-ref.png`, CTA frame buttons, footer frame/icons |
| Write dream | `backgrounds/default.png`, `references/cat-*-profile.png`, `ui/buttons/dreammemory-submit-frame.png` |
| Dream loading | `backgrounds/interpretation-*-cat.png`, `orbs/orb-transparent.png`, `orbs/orb-*-transparent.png` |
| Dream result | `backgrounds/interpretation-*-cat.png`, `receipts/empty.png` |
| Dream seed | `backgrounds/default.png`, `backgrounds/dreamseed.png`, `ui/buttons/dreamseed-frame.png` |
| Morning pawprint | `backgrounds/default.png`, `backgrounds/morning-illustration.png`, `ui/buttons/morning-pawprint-frame.png` |
| Archive | `backgrounds/default.png`, `ui/calendar.png` |
| Encyclopedia/Profile | `backgrounds/default.png`, `references/cat-*-profile.png`, shared icons |

## Recommended Next Steps

1. 먼저 reference-only 후보를 `frontend/public/manyang` 밖으로 이동할지 승인받는다.
2. 런타임 배경 8개, `receipts/empty.png`, `ui/calendar.png`부터 WebP/AVIF 후보를 만든다.
3. 고양이 프로필과 오브는 실제 표시 크기 기준으로 512px 이하 파생본을 만든다.
4. `manyangAssets`는 런타임에서 쓰는 파일만 가리키게 유지한다.
5. 변경 후 `375x667`, `390x844`, `430x932` 스크린샷과 네트워크 payload를 다시 기록한다.

## Related

- [[Frontend-Optimization-Guide]]
- [[Asset-Inventory]]
- [[Layout-Contract]]
