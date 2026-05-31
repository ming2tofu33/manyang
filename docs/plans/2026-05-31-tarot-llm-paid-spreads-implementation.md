# Tarot LLM Paid Spreads Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade today's tarot so one-card and Moon Pass three-card readings use LLM-generated interpretation, never show local fallback copy as a completed reading, and store only successful generated tarot records.

**Architecture:** Keep deterministic card selection in the frontend domain model, then send the selected card ids, positions, and orientations to a server route that validates access and asks the existing OpenAI Responses provider for structured JSON. The local tarot card guide remains prompt evidence and deterministic metadata, not a user-visible fallback. Generated readings are saved in local browser storage for immediate resume and persisted to Supabase for authenticated users.

**Tech Stack:** Next.js 16 App Router route handlers, React 19 client component, TypeScript, Vitest, existing `@manyang/backend` LLM provider, PostgreSQL/Supabase migrations.

---

### Task 1: Backend Tarot LLM Service

**Files:**
- Create: `backend/src/services/tarot-reading-prompt.ts`
- Create: `backend/src/services/llm-tarot-reading.ts`
- Create: `backend/src/services/llm-tarot-reading.test.ts`
- Modify: `backend/src/index.ts`

**Step 1: Write the failing tests**

Create tests that assert:
- one-card requests produce one generated card reading for position `today`
- three-card requests require positions `situation`, `flow`, `advice`
- missing provider returns `status: "unavailable"` with `reason: "provider_missing"`
- invalid provider JSON returns retryable `invalid_response`

Run: `npm --prefix backend test -- src/services/llm-tarot-reading.test.ts`

Expected: FAIL because `llm-tarot-reading.ts` does not exist.

**Step 2: Implement prompt contract**

Create a strict JSON schema:

```ts
export const TAROT_READING_DRAFT_SCHEMA_NAME = "tarot_reading_draft";
export const TAROT_READING_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1 },
    overview: { type: "string", minLength: 80 },
    cardReadings: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          position: { type: "string", enum: ["today", "situation", "flow", "advice"] },
          heading: { type: "string", minLength: 1 },
          reading: { type: "string", minLength: 40 },
        },
        required: ["position", "heading", "reading"],
      },
    },
    advice: { type: "string", minLength: 40 },
  },
  required: ["title", "overview", "cardReadings", "advice"],
} as const;
```

**Step 3: Implement generation service**

`generateTarotReadingForUser(input, options)` must:
- return unavailable when `options.provider` is missing
- call provider with the prompt schema
- parse only valid structured JSON
- validate exact card count and positions for the requested spread
- classify timeout, invalid response, and provider errors
- never synthesize fallback user copy

**Step 4: Export service**

Export prompt and generation APIs from `backend/src/index.ts`.

**Step 5: Verify**

Run:

```powershell
npm --prefix backend test -- src/services/llm-tarot-reading.test.ts
npm --prefix backend run typecheck
```

---

### Task 2: Tarot Reading Domain Model

**Files:**
- Modify: `frontend/src/lib/daily-tarot.ts`
- Modify: `frontend/src/lib/daily-tarot.test.ts`

**Step 1: Write failing tests**

Add tests for:
- saving one-card and three-card readings on the same `appDate` without replacing each other
- generated readings require `source: "llm"`
- reading lookup can filter by `spread`
- local malformed generated fields are ignored

Run: `npm --prefix frontend test -- src/lib/daily-tarot.test.ts`

Expected: FAIL because current storage only keys by `appDate`.

**Step 2: Implement model changes**

Add:

```ts
type TarotSpread = "daily_one_card" | "daily_three_card";
type DailyTarotPosition = "today" | "situation" | "flow" | "advice";
type DailyTarotGeneratedCardReading = {
  position: DailyTarotPosition;
  heading: string;
  reading: string;
};
```

Extend `DailyTarotReading` with:
- `spread: TarotSpread`
- `source: "llm"`
- `cards`
- `generated`

Keep legacy single-card fields (`card`, `orientation`, `position`, `title`, `message`, `advice`) for the existing result UI.

**Step 3: Update storage replacement rule**

Replace only readings with the same `appDate` and same `spread`.

**Step 4: Verify**

Run: `npm --prefix frontend test -- src/lib/daily-tarot.test.ts`

---

### Task 3: Tarot API Route

**Files:**
- Create: `frontend/src/app/api/tarot/readings/route.ts`
- Create: `frontend/src/app/api/tarot/readings/route.test.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Create: `supabase/migrations/20260531000200_create_tarot_readings.sql`

**Step 1: Write failing API tests**

Cover:
- 400 for invalid app date, spread, duplicate card ids, or wrong positions
- 403 when non-Moon Pass user requests `daily_three_card`
- 503 when provider is unavailable, with no persistence
- 200 returns generated one-card reading and persists for authenticated users
- 200 returns generated three-card reading for Moon Pass users

Run: `npm --prefix frontend test -- src/app/api/tarot/readings/route.test.ts`

Expected: FAIL because route does not exist.

**Step 2: Add database migration**

Create `manyang.tarot_readings`:
- `id uuid`
- `user_id uuid`
- `app_date date`
- `spread text check in ('daily_one_card', 'daily_three_card')`
- `cards jsonb`
- `title text`
- `overview text`
- `card_readings jsonb`
- `advice text`
- `raw_reading jsonb`
- `created_at timestamptz`
- unique `(user_id, app_date, spread)`

**Step 3: Add DB persistence helper**

Add `persistCompletedTarotReading(input)` to `manyang-db.ts`.

**Step 4: Implement route**

The route must:
- validate request body
- resolve authenticated user and access plan
- allow one-card for guests/free users
- allow three-card only for Moon Pass or admin bypass
- create provider via `createOpenAIResponsesProviderFromEnv`
- call `generateTarotReadingForUser`
- return `status: "unavailable"` with 503 on LLM failure
- persist only successful authenticated readings

**Step 5: Verify**

Run:

```powershell
npm --prefix frontend test -- src/app/api/tarot/readings/route.test.ts
npm --prefix frontend test -- src/lib/daily-tarot.test.ts
```

---

### Task 4: Client LLM Flow And Failure UX

**Files:**
- Modify: `frontend/src/components/daily-tarot-client.tsx`
- Modify: `frontend/src/components/daily-tarot-client.test.tsx`

**Step 1: Write failing component tests**

Add static render tests for:
- spread selector labels
- three-card locked CTA for guest initial state
- generated reading renders generated overview and card readings
- local fallback copy is not rendered as a completed reading unless `source: "llm"`

Run: `npm --prefix frontend test -- src/components/daily-tarot-client.test.tsx`

Expected: FAIL because UI only supports one local reading flow.

**Step 2: Implement client state**

Add states:
- `selectedSpread`
- `pendingSelections`
- `readingStatus: "idle" | "generating" | "error"`
- `generationError`

**Step 3: Implement API submission**

On card selection:
- one-card: submit immediately
- three-card: collect `situation`, `flow`, `advice`, then submit
- on success: save generated reading to local storage
- on failure: do not save reading; show retry using the same selected cards

**Step 4: Implement paid UI**

Use `useAccessPlan()`.
- guests/free users see locked three-card panel
- Moon Pass/admin can select three cards

**Step 5: Verify**

Run:

```powershell
npm --prefix frontend test -- src/components/daily-tarot-client.test.tsx
npm --prefix frontend test -- src/app/tarot/page.test.tsx
```

---

### Task 5: Final Verification

**Files:**
- Run checks only unless failures require scoped fixes.

**Step 1: Focused tests**

Run:

```powershell
npm --prefix backend test -- src/services/llm-tarot-reading.test.ts
npm --prefix frontend test -- src/lib/daily-tarot.test.ts src/app/api/tarot/readings/route.test.ts src/components/daily-tarot-client.test.tsx src/app/tarot/page.test.tsx
```

**Step 2: Type/lint**

Run:

```powershell
npm --prefix backend run typecheck
npm --prefix frontend run lint
```

Existing unrelated lint or parse failures should be reported, not hidden.

**Step 3: Manual browser verification**

Open `http://127.0.0.1:3000/tarot` and verify:
- free one-card selection goes into LLM loading state
- provider failure shows retry UX, not fallback reading
- three-card spread is locked for non-paid access
- generated reading cards retain transparent cutout presentation

