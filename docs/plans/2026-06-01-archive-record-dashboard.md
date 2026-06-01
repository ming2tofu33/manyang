# Archive Record Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the record area so users can scan their dream history, morning footprints, and night records from one coherent archive flow. The archive should show a compact dashboard first, then a full record list, then a readable detail surface for non-receipt records.

**Architecture:** Keep the existing local/Supabase-backed record sources. Add a shared archive view-model layer that normalizes dream receipts, pawprints, and night check-ins into one list. Reuse the existing result restore behavior for dream receipts, and add a client-side detail route for pawprint/night records.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, existing Manyang archive hooks, existing AppShell/BottomNav layout.

---

## Product Decisions

- `/archive` is the record dashboard, not the full list.
- `/archive/records` is the full searchable and filterable record box.
- `/archive/records/[recordId]` shows detail for pawprint and night records.
- Dream receipt records should reopen the existing receipt result flow instead of duplicating a receipt detail page.
- Morning footprint detail should use local morning mood detail when it exists. If the user is viewing server-only pawprint data, show the available footprint metadata and avoid pretending unavailable fields exist.
- Night record detail can show full stored night-check-in fields because the current model already stores mood, body condition, note, and date.
- “꿈 씨앗” language should not come back in this flow. Use “밤의 기록”.

## Target UX

### Archive Dashboard

1. Header: “꿈 기록”
2. Record entry panel: dream / morning footprint / night record, with the existing time-based active state.
3. Summary row: dream receipts, footprints, night records, monthly symbols.
4. Calendar: current month with adjacent month days and stamps.
5. Featured latest dream receipt: one large card with image/summary/tags and “꿈 영수증 보기”.
6. Recent records: latest three mixed records and a “전체 보기” link.

### Full Record List

1. Header: “꿈 영수증함” or “기록함”.
2. Search input: title, tags, mood, note, summary text.
3. Filters: 전체 / 꿈 영수증 / 발자국 기록 / 밤의 기록.
4. Sort: 최신순 first for MVP.
5. Cards:
   - Dream receipt: parchment-like card, thumbnail if available, tags, mood/sensation, “자세히 보기”.
   - Morning footprint: dark purple footprint card, morning mood/body/color/word when available.
   - Night record: dark card, mood/condition/note.

### Detail Surface

1. Pawprint detail:
   - Title: “꿈의 발자국”
   - Date chip
   - Morning mood/body/color/thought if local detail is available
   - Pawprint source fallback when detail is missing
2. Night detail:
   - Title: “밤의 기록”
   - Date chip
   - Mood, condition, note
3. Edit buttons can link back to `/morning` or `/night`.
4. Delete for routine records is out of scope unless API deletion is added later.

---

## Task 1: Normalize Archive Records

**Files:**
- Create `frontend/src/lib/archive-record-view.ts`
- Create `frontend/src/lib/archive-record-view.test.ts`
- Reuse `frontend/src/lib/archive-records.ts` where calendar-specific helpers already exist

**Implementation:**
- Add a shared `ArchiveRecordView` type.
- Normalize dream records, pawprints, and night check-ins into one sortable list.
- Add helpers:
  - `createArchiveRecordViews`
  - `filterArchiveRecordViews`
  - `getFeaturedDreamRecordView`
  - `getRecentArchiveRecordViews`
  - `getArchiveRecordViewById`
- Preserve stable URL-safe ids for non-dream details.

**Verification:**
- Tests cover sorting, filtering, record type labels, dream receipt titles, pawprint fallbacks, and night record metadata.

## Task 2: Build Dashboard Sections

**Files:**
- Modify `frontend/src/app/archive/page.tsx`
- Replace or refactor `frontend/src/components/dream-archive-list.tsx`
- Add focused components if needed under `frontend/src/components/`

**Implementation:**
- Keep `ArchiveRecordEntryPanel`.
- Keep `ArchiveCalendar`.
- Add latest dream receipt card below the calendar.
- Add recent mixed records list with a “전체 보기” link to `/archive/records`.
- For dream receipt click, call `openDreamRecord(record)` and navigate to `/result`.
- For pawprint/night click, navigate to `/archive/records/[recordId]`.

**Verification:**
- Component tests confirm dashboard renders loading, guest, empty, featured dream, and recent records states.

## Task 3: Add Full Record List Route

**Files:**
- Create `frontend/src/app/archive/records/page.tsx`
- Create `frontend/src/components/archive-records-client.tsx`
- Create tests for the client component

**Implementation:**
- Use `AppShell` with archive background.
- Add search input.
- Add filter chips for all three record types.
- Render type-specific cards.
- Use the same open behavior as dashboard.

**Verification:**
- Tests cover search by title/tag/mood/note and type filters.

## Task 4: Add Routine Record Detail Route

**Files:**
- Create `frontend/src/app/archive/records/[recordId]/page.tsx`
- Create `frontend/src/components/archive-record-detail-client.tsx`
- Add tests

**Implementation:**
- Resolve record from existing dream/routine hooks and local morning mood records.
- Dream records redirect or offer “꿈 영수증 보기” through existing result restore.
- Pawprint details show morning mood detail when `sourceId` matches a local morning record.
- Night details show saved mood, condition, and note.
- Missing records show a calm empty state.

**Verification:**
- Tests cover pawprint detail with local morning data, pawprint fallback, night detail, and missing record.

## Task 5: Polish and Verify

**Files:**
- Adjust CSS/classes in touched components only.
- Update existing tests if wording changes.

**Checks:**
- `npm --prefix frontend test -- src/lib/archive-record-view.test.ts src/components/dream-archive-list.test.tsx`
- Add route/component tests to the focused test command.
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

---

## Out of Scope

- Supabase schema changes for full morning mood detail persistence.
- Routine record deletion API.
- New image asset generation.
- Advanced sort options beyond latest-first.

