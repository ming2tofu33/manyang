---
title: 2026-05-24 MVP Foundation
tags:
  - implementation
  - plan
status: ready
---

# Manyang MVP Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first working prototype loop for 마냥 꿈해몽: home → dream entry → mock reading result → receipt/card → saved archive.

**Architecture:** Start with a Next.js TypeScript app under `frontend/` in Prototype Mode using local seed data and a mock analysis route. Keep domain types and API response contracts compatible with the later Supabase/LLM implementation.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, localStorage, mock Next.js API route, later Supabase and LLM API.

---

## Task 1: Project Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/lib/types.ts`

**Step 1: Create Next.js app**

Run:

```powershell
npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes --disable-git
```

Expected: Next.js project files are created in `C:\Users\amy\Desktop\manyang\frontend`.

**Step 2: Run dev server**

Run:

```powershell
cd frontend
npm run dev
```

Expected: app serves at `http://localhost:3000` or next available port.

**Step 3: Replace default page**

Implement a mobile-first empty shell with title `마냥 꿈해몽`, primary CTA `꿈 비춰보기`, secondary CTA `기억나지 않아요`.

**Step 4: Verify**

Open app in browser and confirm the first screen is not the default Next.js page.

## Task 2: Domain Types and Seed Data

**Files:**
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/data/encyclopedia.ts`
- Create: `frontend/src/data/cat-readers.ts`

**Step 1: Define types**

Add `DreamEntry`, `DreamAnalysis`, `DreamCard`, `EncyclopediaEntry`, `CatReader`.

**Step 2: Add 10 encyclopedia seed entries**

Use 문, 열쇠, 복도, 신발, 엘리베이터, 물, 비, 학교, 고양이, 계단.

**Step 3: Verify**

Run:

```powershell
cd frontend
npm run lint
```

Expected: no type or lint errors from seed files.

## Task 3: Mock Analysis API

**Files:**
- Create: `frontend/src/app/api/dreams/analyze/route.ts`
- Create: `frontend/src/lib/mock-analysis.ts`

**Step 1: Write mock analyzer**

Match seed symbols by substring from the dream text. Return summary, symbols, emotions, themes, interpretation, small prescription, and card.

**Step 2: Add API route**

Accept `dreamText`, `dreamDate`, `wakeMood`, `dreamMood`, `catReaderType`.

**Step 3: Verify API**

Run:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/dreams/analyze -ContentType "application/json" -Body '{"dreamText":"학교 복도에서 신발을 잃어버렸어요","dreamDate":"2026-05-24","wakeMood":"anxious"}'
```

Expected: JSON includes `symbols` with `학교`, `복도`, `신발`.

## Task 4: Dream Entry Flow

**Files:**
- Create: `frontend/src/components/dream-entry-form.tsx`
- Modify: `frontend/src/app/page.tsx`

**Step 1: Build form**

Fields: dream text, wake mood, dream mood.

**Step 2: Submit to mock API**

Call `/api/dreams/analyze`, store response in component state.

**Step 3: Show loading states**

Use three labels: 꿈 조각을 모으는 중, 상징을 찾는 중, 꿈 영수증을 쓰는 중.

**Step 4: Verify**

Enter a dream and confirm result data appears without refresh.

## Task 5: Result and Receipt UI

**Files:**
- Create: `frontend/src/components/dream-result.tsx`
- Create: `frontend/src/components/dream-receipt.tsx`
- Create: `frontend/src/components/symbol-chip.tsx`

**Step 1: Render receipt**

Display date, mood, symbols, dream reading, small prescription.

**Step 2: Render encyclopedia references**

Show matched symbols as chips.

**Step 3: Add save button**

Clicking save writes result to localStorage key `manyang:dreams`.

**Step 4: Verify**

After save, reload page and confirm saved data is still available.

## Task 6: Archive Screen

**Files:**
- Create: `frontend/src/app/archive/page.tsx`
- Create: `frontend/src/components/dream-archive-list.tsx`
- Create: `frontend/src/lib/storage.ts`

**Step 1: Build localStorage helpers**

Functions: `getDreams`, `saveDream`, `clearDreams`.

**Step 2: Render list**

Show date, card name, summary, symbols.

**Step 3: Add navigation**

Home links to archive. Archive links back home.

**Step 4: Verify**

Save one dream, open `/archive`, confirm it appears.

## Task 7: Morning Mood Flow

**Files:**
- Create: `frontend/src/components/morning-mood-form.tsx`
- Create: `frontend/src/app/api/dreams/morning/route.ts`

**Step 1: Build form**

Fields: mood, color, body state, first thought.

**Step 2: Generate missing dream card**

Return `remembered: false` entry and card title `사라진 꿈의 발자국`.

**Step 3: Save result**

Use the same storage path as dream analysis results.

**Step 4: Verify**

Create a morning record and confirm it appears in archive.

## Task 8: Visual Pass

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/page.tsx`
- Modify: UI components above

**Step 1: Apply theme**

Use dark background, warm gold text, violet accent, card/receipt surfaces.

**Step 2: Check mobile viewport**

Use browser at 390px width. Confirm text does not overlap.

**Step 3: Check desktop viewport**

Confirm content is centered and constrained, not stretched.

**Step 4: Verify**

Take screenshots for home, result, archive.

## Related Plans

- [[plans/ACTIVE_SPRINT|Active Sprint]]
