---
title: Frontend Optimization Evidence 2026-05-29
tags:
  - implementation
  - frontend
  - performance
  - evidence
status: draft
updated: 2026-05-29
---

# Frontend Optimization Evidence 2026-05-29

## Scope

This report summarizes the current frontend optimization pass for Manyang's mobile web app.

Covered work:

- Runtime/reference asset classification
- Runtime image WebP replacement
- Home layout stability contract
- Home animation cost review
- Client boundary review for high-confidence routes

Not covered as measured metrics:

- Lighthouse LCP, CLS, INP
- Real-device CPU profiling
- Production `manyang.vercel.app` post-deploy verification

## Before And After

| Metric | Before | After | Notes |
| --- | ---: | ---: | --- |
| Home background runtime set | 8.11 MiB | 0.87 MiB | 4 cat home backgrounds changed from PNG to WebP q84 |
| Receipt and calendar assets | 4.67 MiB | 0.27 MiB | `receipts/empty` and `ui/calendar` changed to WebP q86 |
| Remaining large runtime image set | 28.66 MiB | 3.00 MiB | default/interpretation backgrounds, seed/morning illustrations, cat portraits, loading orbs |
| Tracked large runtime image total | 41.44 MiB | 4.15 MiB | Current measured WebP total: 4,347,384 bytes |
| Largest optimized runtime image request | 2.51 MiB | 286.0 KiB | `interpretation-white-cat.png` to `interpretation-white-cat.webp` |
| LCP | Not measured | Not measured | Run Lighthouse mobile or WebPageTest after deploy |
| CLS | Not measured | Layout proxy passed | Mobile screenshot checks found no horizontal scroll; home fixed screen has no internal vertical scroll |
| INP | Not measured | Not measured | Needs real interaction profiling on mobile |

## Decisions

### Kept Visual Quality

- WebP was chosen over AVIF for first runtime replacement because it preserved thin gold lines, star details, dark texture, cat faces, and orb gradients more reliably.
- PNG originals remain in `frontend/public/manyang` for now as source/reference files. They should not be deleted without a separate reference cleanup approval.
- Existing asset-based UI remains intact; the optimization changed runtime paths and boundaries rather than redesigning the screens.

### Replaced Runtime Assets

- Home backgrounds:
  - `backgrounds/home-black-cat.webp`
  - `backgrounds/home-white-cat-ref.webp`
  - `backgrounds/home-cheese-cat.webp`
  - `backgrounds/home-gray-cat.webp`
- Receipt/calendar:
  - `receipts/empty.webp`
  - `ui/calendar.webp`
- Shared large runtime assets:
  - `backgrounds/default.webp`
  - `backgrounds/interpretation-*.webp`
  - `backgrounds/dreamseed.webp`
  - `backgrounds/morning-illustration.webp`
  - `references/cat-*-profile.webp`
  - `orbs/orb*-transparent.webp`

### Layout And Animation

- Home now declares a `390x844` design stage contract.
- Home runs in fixed `AppShell` content mode to avoid accidental page scroll.
- Live background effects expose `data-home-effect-stage="390x844"`.
- Home live/cat transition layers no longer pre-promote `filter` through `will-change`.
- `prefers-reduced-motion` removes home animation filters and layer hints.

### Client Boundary

- `/encyclopedia` and `/encyclopedia/[slug]` now render their route shell and static content as Server Components.
- Selected-cat guide UI moved to `encyclopedia-reader-guide-client.tsx`.
- Form/storage-heavy pages stayed client-side because their interactions depend on browser state.

## Screenshot Evidence

| Area | Screenshot |
| --- | --- |
| Home baseline | `output/playwright/optimization/home-390x844-before.png` |
| Home WebP after | `output/playwright/optimization/home-webp-390x844-after.png` |
| Home layout after | `output/playwright/optimization/optimization-home-layout-after-390x844.png` |
| Home animation cost | `output/playwright/optimization/home-animation-cost-390x844.png` |
| Archive calendar WebP | `output/playwright/optimization/archive-calendar-webp-390x844.png` |
| Result receipt WebP | `output/playwright/optimization/result-receipt-webp-390x844-settled.png` |
| Write screen WebP runtime | `output/playwright/optimization/optimization-write-webp-390x844.png` |
| Loading screen WebP runtime | `output/playwright/optimization/optimization-loading-webp-390x844.png` |
| Seed screen WebP runtime | `output/playwright/optimization/optimization-seed-webp-390x844.png` |
| Morning screen WebP runtime | `output/playwright/optimization/optimization-morning-webp-390x844.png` |
| Encyclopedia client boundary | `output/playwright/optimization/encyclopedia-client-boundary-390x844.png` |
| Encyclopedia detail client boundary | `output/playwright/optimization/encyclopedia-cat-client-boundary-390x844.png` |

## Verification

Final verification for this pass:

- `npm test`: passed
- `npm run lint`: passed
- `npm run build`: passed
- Playwright local production checks:
  - Home `375x667`, `390x844`, `430x932`: no horizontal scroll, no home page vertical scroll, CTA/nav gap verified
  - Home reduced motion: home animation names become `none`, `filter` becomes `none`, `will-change` becomes `auto`
  - Encyclopedia list/detail `390x844`: no horizontal scroll, core links and guide UI render

## Deferred Work

1. Run Lighthouse mobile after the next Vercel deploy and fill LCP/CLS/INP with actual values.
2. Decide whether PNG originals and reference-only assets should move out of `frontend/public/manyang`.
3. Review receipt/result animations separately; Task 7 intentionally scoped only home animations.
4. Review route JS with `next experimental-analyze` only if bundle size becomes a visible bottleneck.
5. Consider a second AVIF comparison pass for backgrounds if further network reduction is needed.

## Related

- [[Frontend-Optimization-Guide]]
- [[Frontend-Optimization-Asset-Classification-2026-05-28]]
- [[Frontend-Optimization-Image-Spike-2026-05-29]]
- [[Frontend-Optimization-Client-Boundary-Review-2026-05-29]]
- [[Layout-Contract]]

