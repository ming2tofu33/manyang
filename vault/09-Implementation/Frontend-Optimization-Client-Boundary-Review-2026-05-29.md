---
title: Frontend Optimization Client Boundary Review 2026-05-29
tags:
  - implementation
  - frontend
  - performance
  - nextjs
status: draft
updated: 2026-05-29
---

# Frontend Optimization Client Boundary Review 2026-05-29

## Scope

Task 8 reviewed client component boundaries under `frontend/src/app`, `frontend/src/components`, and `frontend/src/lib`.

Goal: keep UI that depends on browser state in client components, and move static route shells/content back to Server Components where the benefit is clear.

## Decision Summary

- 백과 목록/상세 페이지는 정적 SEO 콘텐츠가 대부분이므로 Server Component route로 되돌렸다.
- 선택된 고양이에 따라 바뀌는 백과 안내 카드만 `EncyclopediaReader*` client island로 분리했다.
- 홈, 꿈쓰기, 씨앗, 발자국, 기록, 결과 화면은 `localStorage`, form state, route navigation, share/download 같은 브라우저 동작이 핵심이라 이번 패스에서는 유지했다.

## Client Component Inventory

| Component | Reason for client | Can split? | Action |
| --- | --- | --- | --- |
| `archive-calendar.tsx` | `localStorage` records via `useSyncExternalStore` | Later | Keep |
| `bottom-nav.tsx` | `usePathname` active route state | No | Keep |
| `cat-reader-picker.tsx` | bottom sheet, selection state, callbacks | No | Keep |
| `dream-archive-list.tsx` | local records, delete interactions | Later | Keep |
| `dream-entry-form.tsx` | form state, submit, `useRouter`, selected cat storage | No | Keep |
| `dream-loading-page-client.tsx` | selected cat controls loading background | Later | Keep |
| `dream-result-page-client.tsx` | latest result from browser storage controls background | Later | Keep |
| `dream-result-receipt.tsx` | browser storage, share/download, pawprint action | No | Keep |
| `dream-seed-form.tsx` | form state and dream seed storage | No | Keep |
| `encyclopedia-reader-guide-client.tsx` | selected cat reader from browser storage | Yes | New small client island |
| `home-cat-background-transition.tsx` | transition state and timeout | No | Keep |
| `morning-mood-form.tsx` | form state and morning record storage | No | Keep |
| `profile-room.tsx` | selected cat reader and picker | Later | Keep |
| `today-home-actions.tsx` | current time, seed storage, selected cat, picker | Later | Keep |
| `today-home-scene.tsx` | selected cat changes home background/effects | Later | Keep |

## Refactor Completed

| Before | After |
| --- | --- |
| `/encyclopedia` rendered through `EncyclopediaPageClient` | `/encyclopedia` renders `AppShell` and `EncyclopediaContent` directly as a server route |
| `/encyclopedia/[slug]` rendered through `EncyclopediaDetailPageClient` | `/encyclopedia/[slug]` renders `AppShell` and `EncyclopediaDetailContent` directly as a server route |
| Reader-specific guide state wrapped the whole encyclopedia page | Reader-specific guide state lives only in `encyclopedia-reader-guide-client.tsx` |

## Deferred

- Home can be split further only if route JS evidence shows it matters; current selected-cat background makes the top scene client-driven.
- Archive can later split static empty-state/card layout from storage subscription.
- Result can later split static receipt layout from storage/share actions, but this has higher regression risk.

## Verification

- `npm test -- src/app/client-boundaries.test.ts src/components/encyclopedia-content.test.tsx src/components/encyclopedia-detail-content.test.tsx`

