---
title: Frontend Optimization Image Spike 2026-05-29
tags:
  - implementation
  - frontend
  - performance
  - assets
status: draft
updated: 2026-05-29
---

# Frontend Optimization Image Spike 2026-05-29

> 작업 5 결과. 홈 배경 4장을 대상으로 PNG 원본을 유지한 채 WebP/AVIF 후보를 생성했고, 1차 교체안으로 WebP q84를 런타임 경로에 연결했다.

## Scope

| Runtime asset | Current usage |
| --- | --- |
| `frontend/public/manyang/backgrounds/home-black-cat.webp` | 홈 검은 고양이 배경 |
| `frontend/public/manyang/backgrounds/home-white-cat-ref.webp` | 홈 흰 고양이 배경 |
| `frontend/public/manyang/backgrounds/home-cheese-cat.webp` | 홈 치즈 고양이 배경 |
| `frontend/public/manyang/backgrounds/home-gray-cat.webp` | 홈 회색 고양이 배경 |

## Candidate Settings

| Format | Setting | Reason |
| --- | --- | --- |
| WebP | `quality: 84`, `effort: 6`, `smartSubsample: true` | 디테일 보존과 용량 절감의 균형이 좋다. 첫 교체 후보로 적합하다. |
| AVIF | `quality: 56`, `effort: 6` | 용량은 가장 작지만, 작은 별/선/텍스처가 살짝 뭉개질 수 있어 시각 승인 후 적용한다. |

## Size Result

| Asset | PNG | WebP q84 | WebP saving | AVIF q56 | AVIF saving |
| --- | ---: | ---: | ---: | ---: | ---: |
| `home-black-cat` | 1828.1 KiB | 169.2 KiB | 90.7% | 93.4 KiB | 94.9% |
| `home-white-cat-ref` | 2340.1 KiB | 252.5 KiB | 89.2% | 167.0 KiB | 92.9% |
| `home-cheese-cat` | 1888.1 KiB | 227.2 KiB | 88.0% | 129.5 KiB | 93.1% |
| `home-gray-cat` | 2249.1 KiB | 242.4 KiB | 89.2% | 153.1 KiB | 93.2% |
| **Total** | **8.11 MiB** | **0.87 MiB** | **89.3%** | **0.53 MiB** | **93.5%** |

## Runtime Replacement

- Added WebP q84 files to `frontend/public/manyang/backgrounds/`.
- Updated `frontend/src/lib/manyang-assets.ts` so cat-specific home backgrounds point to `.webp`.
- Kept the PNG originals in place as source/reference files for now.
- Updated `frontend/src/lib/manyang-assets.test.ts` to verify WebP paths, dimensions, and size reduction.

## Visual Artifacts

- Candidate folder: `output/playwright/optimization/assets/home-backgrounds/`
- Comparison sheet: `output/playwright/optimization/assets/home-backgrounds/home-background-format-comparison.png`
- Current home screenshots:
  - `output/playwright/optimization/home-webp-375x667-after.png`
  - `output/playwright/optimization/home-webp-390x844-after.png`
  - `output/playwright/optimization/home-webp-430x932-after.png`

## Read

- WebP는 원본 대비 배경 톤, 고양이 얼굴, 오브, 타로 카드 디테일이 가장 안정적으로 유지된다.
- AVIF는 용량 절감 폭이 더 크다. 다만 별, 금색 선, 어두운 질감처럼 얇은 디테일은 WebP보다 살짝 평평하게 보일 수 있다.
- 후보는 원본과 같은 픽셀 크기로 생성했다. 따라서 포맷 교체만으로 배경 좌표나 홈 CTA 위치가 움직일 가능성은 낮다.
- `375x667`, `390x844`, `430x932` production screenshot에서 배경, CTA, footer 위치가 유지되는 것을 확인했다.

## Recommendation

1차 런타임 교체는 **WebP q84**로 적용했다. 홈 첫 화면 배경 4장이 약 8.11 MiB에서 0.87 MiB로 줄었다. 시각적으로 더 공격적인 절감이 필요하면 AVIF q56을 두 번째 후보로 비교한다.

## Next Step

1. 배포 후 `manyang.vercel.app`에서 동일 viewport 3개를 다시 비교한다.
2. 문제가 없으면 다음 이미지 묶음은 `receipts/empty.png` 또는 `ui/calendar.png`로 진행한다.
3. PNG 원본은 바로 삭제하지 말고 reference-only 정리 작업에서 별도로 승인받는다.

## Verification

- `npm test -- src/lib/manyang-assets.test.ts`: passed
- `npm test`: passed, 36 files / 157 tests
- `npm run lint`: passed
- `npm run build`: passed
- Static serving check: `.webp` files return `Content-Type: image/webp`

## Receipt And Calendar Follow-Up

The next two runtime-heavy single assets were also converted to WebP q86.

| Runtime asset | PNG | WebP q86 | Saving | Screenshot |
| --- | ---: | ---: | ---: | --- |
| `frontend/public/manyang/receipts/empty.webp` | 2474.0 KiB | 132.4 KiB | 94.6% | `output/playwright/optimization/result-receipt-webp-390x844-settled.png` |
| `frontend/public/manyang/ui/calendar.webp` | 2310.2 KiB | 146.7 KiB | 93.7% | `output/playwright/optimization/archive-calendar-webp-390x844.png` |

Combined payload changed from 4.67 MiB to 0.27 MiB, a 94.2% reduction.

Runtime changes:

- `frontend/src/components/dream-result-receipt.tsx` now uses `/manyang/receipts/empty.webp`.
- `frontend/src/components/archive-calendar.tsx` now uses `/manyang/ui/calendar.webp`.
- PNG originals remain in place as source/reference files.
- Added render tests for both components so the runtime paths do not drift back to PNG.

Follow-up verification:

- `npm test -- src/components/archive-calendar.test.tsx src/components/dream-result-receipt.test.tsx`: passed
- `npm test`: passed, 38 files / 159 tests
- `npm run lint`: passed
- `npm run build`: passed
- Static serving check: `calendar.webp` and `empty.webp` return `Content-Type: image/webp`
- Screenshots captured at `375x667`, `390x844`, and `430x932` for `/archive` and `/result`.

## Remaining Runtime Large Assets Follow-Up

The remaining large runtime image set was converted to WebP while keeping the PNG originals as source/reference assets.

| Runtime group | PNG total | WebP total | Saving | Runtime paths |
| --- | ---: | ---: | ---: | --- |
| Shared/default page backgrounds | 1.80 MiB | 0.11 MiB | 93.7% | `backgrounds/default.webp` |
| Interpretation backgrounds | 9.18 MiB | 1.01 MiB | 89.0% | `backgrounds/interpretation-*.webp` |
| Seed and morning illustrations | 3.78 MiB | 0.32 MiB | 91.6% | `backgrounds/dreamseed.webp`, `backgrounds/morning-illustration.webp` |
| Cat reader profile portraits | 7.28 MiB | 0.86 MiB | 88.2% | `references/cat-*-profile.webp` |
| Loading orbs | 6.63 MiB | 0.71 MiB | 89.3% | `orbs/orb*-transparent.webp` |
| **Total** | **28.66 MiB** | **3.00 MiB** | **89.5%** | Runtime WebP registry |

Runtime changes:

- `frontend/src/lib/manyang-assets.ts` now exposes WebP paths for default backgrounds, interpretation backgrounds, seed/morning illustrations, cat portraits, and loading orbs.
- `AppShell`, page shells, loading UI, seed options, archive, encyclopedia, and result flows now read these paths through the asset registry instead of hard-coded PNG runtime paths.
- The large PNG originals remain in `frontend/public/manyang` for now and should only be deleted after a separate reference-asset cleanup approval.

Follow-up verification:

- `npm test -- manyang-assets dream-loading-overlay dream-archive-list encyclopedia-content`: passed
- `npm test`: passed, 38 files / 161 tests
- `npm run lint`: passed
- `npm run build`: passed
- Playwright runtime check on `/write`, `/loading`, `/seed`, `/morning`, `/archive`, and `/result`: no requests for the replaced large PNG runtime patterns.
- Static serving check: representative `.webp` files return `Content-Type: image/webp`.
- Screenshots captured at `390x844` for `/write`, `/loading`, `/seed`, `/morning`, `/archive`, and `/result`.

## Related

- [[Frontend-Optimization-Guide]]
- [[Frontend-Optimization-Asset-Classification-2026-05-28]]
- [[Layout-Contract]]
